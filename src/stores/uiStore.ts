import { create } from 'zustand'

export type TabKey = 'home' | 'chat' | 'goals' | 'vault' | 'settings' | 'task-detail'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

export type Theme = 'dark' | 'light' | 'system'

interface UIState {
  activeTab: TabKey
  theme: Theme
  selectedTaskId: string | null
  overloadWarnings: Array<{ goalId: string; dayNumbers: number[] }>
  toasts: Toast[]
  setActiveTab: (tab: TabKey) => void
  setTheme: (theme: Theme) => void
  setSelectedTask: (taskId: string | null) => void
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
  addOverloadWarning: (goalId: string, dayNumbers: number[]) => void
  clearOverloadWarning: (goalId: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'home',
  theme: (localStorage.getItem('mom-theme') as Theme) || 'dark',
  selectedTaskId: null,
  overloadWarnings: [],
  toasts: [],

  setSelectedTask: (taskId) => set({ selectedTaskId: taskId, activeTab: taskId ? 'task-detail' : 'home' }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTheme: (theme) => {
    localStorage.setItem('mom-theme', theme)
    set({ theme })
  },

  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  addOverloadWarning: (goalId, dayNumbers) =>
    set((state) => ({
      overloadWarnings: [
        ...state.overloadWarnings.filter((w) => w.goalId !== goalId),
        { goalId, dayNumbers },
      ],
    })),

  clearOverloadWarning: (goalId) =>
    set((state) => ({
      overloadWarnings: state.overloadWarnings.filter((w) => w.goalId !== goalId),
    })),
}))
