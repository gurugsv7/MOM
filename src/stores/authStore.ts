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
  setSession: (session: Session | null) => Promise<void>
  setCryptoKey: (key: CryptoKey | null) => void
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

  setSession: async (session) => {
    const user = session?.user ?? null
    set({ session, user, isLoading: false })
    if (user) {
      get().fetchProfile(user.id)
      // For OAuth users (GitHub etc.) there is no password — derive key from access_token
      if (session && !get().cryptoKey) {
        try {
          const token = session.access_token
          const key = await deriveKey(token, user.id)
          set({ cryptoKey: key })
        } catch (e) {
          console.warn('Could not auto-derive vault key for OAuth user:', e)
        }
      }
    }
  },

  setCryptoKey: (key) => set({ cryptoKey: key }),

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
supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
  useAuthStore.getState().setSession(session)
})

supabase.auth.onAuthStateChange((_event: any, session: Session | null) => {
  useAuthStore.getState().setSession(session)
})
