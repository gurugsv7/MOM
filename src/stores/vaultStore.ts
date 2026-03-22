import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { encryptEntry, decryptEntry } from '@/lib/crypto'
import type { DecryptedVaultEntry, VaultEntryPlaintext } from '@/types/supabase'

interface VaultState {
  entries: DecryptedVaultEntry[]
  isLoading: boolean
  lockedCount: number
  searchQuery: string
  setSearchQuery: (q: string) => void
  fetchAndDecrypt: (userId: string, key: CryptoKey) => Promise<void>
  addEntry: (plaintext: VaultEntryPlaintext, userId: string, key: CryptoKey) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  rotateKey: (userId: string, oldKey: CryptoKey, newKey: CryptoKey) => Promise<void>
  clear: () => void
}

export const useVaultStore = create<VaultState>((set, get) => ({
  entries: [],
  isLoading: false,
  lockedCount: 0,
  searchQuery: '',

  setSearchQuery: (q) => set({ searchQuery: q }),

  fetchAndDecrypt: async (userId: string, key: CryptoKey) => {
    set({ isLoading: true, lockedCount: 0 })
    const { data, error } = await supabase
      .from('vault_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error || !data) {
      set({ isLoading: false })
      return
    }

    const decrypted: DecryptedVaultEntry[] = []
    let failed = 0
    for (const entry of data) {
      try {
        const plaintext = await decryptEntry<VaultEntryPlaintext>(entry.encrypted_blob, entry.iv, key)
        decrypted.push({
          id: entry.id,
          search_hint: entry.search_hint,
          created_at: entry.created_at,
          updated_at: entry.updated_at,
          plaintext,
        })
      } catch (e) {
        failed++
      }
    }

    set({ entries: decrypted, lockedCount: failed, isLoading: false })
  },

  addEntry: async (plaintext: VaultEntryPlaintext, userId: string, key: CryptoKey) => {
    const { blob, iv } = await encryptEntry(plaintext, key)
    const { data, error } = await supabase
      .from('vault_entries')
      .insert({
        user_id: userId,
        encrypted_blob: blob,
        iv,
        search_hint: `${plaintext.site} [${plaintext.category || 'Personal'}]`,
      })
      .select()
      .single()

    if (error || !data) throw error

    set((state) => ({
      entries: [
        {
          id: data.id,
          search_hint: data.search_hint,
          created_at: data.created_at,
          updated_at: data.updated_at,
          plaintext,
        },
        ...state.entries,
      ],
    }))
  },

  deleteEntry: async (id: string) => {
    await supabase.from('vault_entries').delete().eq('id', id)
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }))
  },

  rotateKey: async (userId: string, oldKey: CryptoKey, newKey: CryptoKey) => {
    const { entries } = get()
    if (entries.length === 0) return

    set({ isLoading: true })
    const { encryptEntry } = await import('@/lib/crypto')

    try {
      // Re-encrypt all entries with the new key in a single batch
      const updates = await Promise.all(entries.map(async (entry: DecryptedVaultEntry) => {
        const { blob, iv } = await encryptEntry(entry.plaintext, newKey)
        return {
          id: entry.id,
          user_id: userId,
          encrypted_blob: blob,
          iv,
          search_hint: entry.search_hint,
          created_at: entry.created_at,
          updated_at: new Date().toISOString()
        }
      }))

      const { error } = await supabase
        .from('vault_entries')
        .upsert(updates)

      if (error) throw error
      set({ isLoading: false })
    } catch (e) {
      set({ isLoading: false })
      throw e
    }
  },

  clear: () => set({ entries: [], searchQuery: '', lockedCount: 0 }),
}))
