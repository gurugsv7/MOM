import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { deriveKey } from '@/lib/crypto'
import type { Session, User } from '@supabase/supabase-js'

interface Profile {
  display_name: string
  memory_summary: string
}

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  cryptoKey: CryptoKey | null
  isLoading: boolean
  isPasscodeLocked: boolean
  hasPasscode: boolean
  setSession: (session: Session | null) => Promise<void>
  setCryptoKey: (key: CryptoKey | null) => Promise<void>
  setPasscode: (pin: string) => Promise<void>
  unlockWithPasscode: (pin: string) => Promise<boolean>
  clearPasscode: () => void
  fetchProfile: (userId: string) => Promise<void>
  updateProfile: (updates: Partial<Profile>) => void
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  cryptoKey: null,
  isLoading: true,
  isPasscodeLocked: false,
  hasPasscode: typeof window !== 'undefined' ? !!localStorage.getItem('mom_passcode_bundle') : false,

  setSession: async (session) => {
    const user = session?.user ?? null
    const hasBundle = typeof window !== 'undefined' && !!localStorage.getItem('mom_passcode_bundle')
    
    if (!user) {
      // Session lost or signed out: Purge all sensitive data
      set({ 
        session: null, 
        user: null, 
        profile: null, 
        cryptoKey: null,
        isPasscodeLocked: false,
        isLoading: false, 
        hasPasscode: hasBundle 
      })
      localStorage.removeItem('mom_vault_session')
    } else {
      // Valid session
      set({ session, user, isLoading: false, hasPasscode: hasBundle })
      get().fetchProfile(user.id)
    }
  },

  setCryptoKey: async (key) => {
    set({ cryptoKey: key })
    if (key) {
      try {
        // Ensure extractable is true for persistence
        const exported = await window.crypto.subtle.exportKey('raw', key)
        const b64 = btoa(String.fromCharCode(...new Uint8Array(exported)))
        localStorage.setItem('mom_vault_session', b64)
      } catch (e) {
        console.warn('Vault key not extractable (Legacy Session). Please refresh or re-login for permanent access.', e)
      }
    } else {
      localStorage.removeItem('mom_vault_session')
    }
  },

  setPasscode: async (pin: string) => {
    const { user, cryptoKey } = get()
    if (!user || !cryptoKey) return

    try {
      const { deriveKey, encryptRaw } = await import('@/lib/crypto')
      // Note: we derive a key that is extractable so it can re-encrypt the vault key if needed
      const pinKey = await deriveKey(pin, user.id + '_pin')
      const rawVaultKey = await window.crypto.subtle.exportKey('raw', cryptoKey)
      const bundle = await encryptRaw(rawVaultKey, pinKey)
      
      localStorage.setItem('mom_passcode_bundle', JSON.stringify(bundle))
      set({ hasPasscode: true, isPasscodeLocked: false })
    } catch (e) {
      console.error('Passcode setup failed:', e)
      throw e
    }
  },

  unlockWithPasscode: async (pin: string) => {
    const { user } = get()
    const bundleStr = localStorage.getItem('mom_passcode_bundle')
    if (!user || !bundleStr) return false

    try {
      const { deriveKey, decryptRaw } = await import('@/lib/crypto')
      const bundle = JSON.parse(bundleStr)
      const pinKey = await deriveKey(pin, user.id + '_pin')
      const decryptedRaw = await decryptRaw(bundle.blob, bundle.iv, pinKey)
      
      const vaultKey = await window.crypto.subtle.importKey(
        'raw', decryptedRaw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']
      )
      
      await get().setCryptoKey(vaultKey)
      set({ isPasscodeLocked: false })
      return true
    } catch (e) {
      console.error('Passcode unlock failed:', e)
      return false
    }
  },

  clearPasscode: () => {
    localStorage.removeItem('mom_passcode_bundle')
    set({ hasPasscode: false, isPasscodeLocked: false })
  },

  fetchProfile: async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, memory_summary')
      .eq('id', userId)
      .maybeSingle()
    if (data) {
      set({ profile: { display_name: data.display_name || '', memory_summary: data.memory_summary || '' } })
    }
  },

  updateProfile: (updates) => {
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates } : null
    }))
  },

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    // deriveKey now returns extractable: true from crypto.ts
    const key = await deriveKey(password, data.user.id)
    await get().setCryptoKey(key)
    set({ session: data.session, user: data.user, isLoading: false })
    await get().fetchProfile(data.user.id)
  },

  signup: async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (!data.user) throw new Error('Signup failed')

    if (data.session) {
      await supabase.from('profiles').update({ display_name: displayName } as any).eq('id', data.user.id)
      const key = await deriveKey(password, data.user.id)
      await get().setCryptoKey(key)
      set({ session: data.session, user: data.user, isLoading: false })
      await get().fetchProfile(data.user.id)
    } else {
      throw new Error('Signup success, but no session.')
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('mom_vault_session')
    set({ session: null, user: null, profile: null, cryptoKey: null, isPasscodeLocked: false })
  },
}))

// Initialize session and secure state on load
const init = async () => {
  let session: Session | null = null
  try {
    const { data } = await supabase.auth.getSession()
    session = data.session
  } catch (e) {
    console.warn('Session check failed:', e)
  }

  const hasBundle = typeof window !== 'undefined' && !!localStorage.getItem('mom_passcode_bundle')
  const savedKey = typeof window !== 'undefined' ? localStorage.getItem('mom_vault_session') : null
  
  let restored = false
  
  if (savedKey && session?.user) {
    try {
      const raw = Uint8Array.from(atob(savedKey), c => c.charCodeAt(0))
      const key = await window.crypto.subtle.importKey(
        'raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']
      )
      useAuthStore.setState({ cryptoKey: key, isPasscodeLocked: false })
      restored = true
    } catch (e) {
      console.warn('Token recovery failed, clearing stale session.')
      localStorage.removeItem('mom_vault_session')
    }
  }

  // Final synchronization of loading and lock states
  useAuthStore.setState({ 
    session, 
    user: session?.user ?? null,
    isLoading: false, 
    hasPasscode: hasBundle,
    isPasscodeLocked: hasBundle && !restored 
  })

  // Auth changes
  supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
    await useAuthStore.getState().setSession(session)
  })
}

// Global initialization trigger
if (typeof window !== 'undefined') {
  init()
}
