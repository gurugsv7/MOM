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
    set({ session, user, isLoading: false })
    if (user) {
      get().fetchProfile(user.id)
      // Since we don't persist cryptoKey, if it's missing after a refresh, 
      // the VaultPage will prompt for it once.
    }
  },

  setCryptoKey: async (key) => {
    set({ cryptoKey: key })
    if (key) {
      // Persist key to sessionStorage so it survives refreshes (but not tab closure)
      try {
        const exported = await window.crypto.subtle.exportKey('raw', key)
        const b64 = btoa(String.fromCharCode(...new Uint8Array(exported)))
        sessionStorage.setItem('mom_vault_session', b64)
      } catch (e) {
        console.warn('Could not save vault session:', e)
      }
    } else {
      sessionStorage.removeItem('mom_vault_session')
    }
  },

  setPasscode: async (pin: string) => {
    const { user, cryptoKey } = get()
    if (!user || !cryptoKey) return

    try {
      const { deriveKey, encryptRaw } = await import('@/lib/crypto')
      const pinKey = await deriveKey(pin, user.id + '_pin') // Unique salt for PIN
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
        'raw', decryptedRaw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
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

    // Derive vault key from account password immediately on login
    const key = await deriveKey(password, data.user.id)
    set({ session: data.session, user: data.user, cryptoKey: key, isLoading: false })
    await get().fetchProfile(data.user.id)
  },

  signup: async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (!data.user) throw new Error('Signup failed')

    if (data.session) {
      await supabase.from('profiles').update({ display_name: displayName } as any).eq('id', data.user.id)
      const key = await deriveKey(password, data.user.id)
      set({ session: data.session, user: data.user, cryptoKey: key, isLoading: false })
      await get().fetchProfile(data.user.id)
    } else {
      throw new Error('Signup successful, but session not created. Ensure "Confirm Email" is OFF in Supabase Auth settings.')
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, profile: null, cryptoKey: null })
  },
}))

// Initialize session from Supabase on load
// Initialize session from Supabase on load
supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: Session | null } }) => {
  const store = useAuthStore.getState()
  
  // Set initial PIN state
  const hasBundle = typeof window !== 'undefined' && !!localStorage.getItem('mom_passcode_bundle')
  if (hasBundle) {
    useAuthStore.setState({ isPasscodeLocked: true, hasPasscode: true })
  }

  // Try to restore vault key from sessionStorage (survives refreshes)
  const savedKey = typeof window !== 'undefined' ? sessionStorage.getItem('mom_vault_session') : null
  if (savedKey && session?.user && !store.cryptoKey) {
    try {
      const raw = Uint8Array.from(atob(savedKey), c => c.charCodeAt(0))
      const key = await window.crypto.subtle.importKey(
        'raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
      )
      useAuthStore.setState({ cryptoKey: key })
    } catch (e) {
      console.warn('Could not restore vault session:', e)
    }
  }

  await store.setSession(session)
})

supabase.auth.onAuthStateChange((_event: any, session: Session | null) => {
  useAuthStore.getState().setSession(session)
})
