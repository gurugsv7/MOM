import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { encryptEntry, decryptEntry } from '@/lib/crypto'
import type { DecryptedVaultEntry, VaultEntryPlaintext } from '@/types/supabase'

interface VaultState {
  entries: DecryptedVaultEntry[]
  isLoading: boolean
  searchQuery: string
  setSearchQuery: (q: string) => void
  fetchAndDecrypt: (userId: string, key: CryptoKey) => Promise<void>
  addEntry: (plaintext: VaultEntryPlaintext, userId: string, key: CryptoKey) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  clear: () => void
}

export const useVaultStore = create<VaultState>((set) => ({
  entries: [],
  isLoading: false,
  searchQuery: '',

  setSearchQuery: (q) => set({ searchQuery: q }),

  fetchAndDecrypt: async (userId: string, key: CryptoKey) => {
    set({ isLoading: true })
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
      } catch {
        // Skip corrupted entries
      }
    }

    set({ entries: decrypted, isLoading: false })
  },

  addEntry: async (plaintext: VaultEntryPlaintext, userId: string, key: CryptoKey) => {
    const { blob, iv } = await encryptEntry(plaintext, key)
    const { data, error } = await supabase
      .from('vault_entries')
      .insert({
        user_id: userId,
        encrypted_blob: blob,
        iv,
        search_hint: plaintext.site,
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

  clear: () => set({ entries: [], searchQuery: '' }),
}))
