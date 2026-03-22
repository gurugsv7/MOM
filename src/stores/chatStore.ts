import { create } from 'zustand'

export interface Message {
  id: string
  role: 'mom' | 'user'
  content: string
  timestamp: string
  status?: 'sending' | 'sent' | 'error'
  pendingAction?: {
    type: 'ADD_VAULT_ENTRY'
    site: string
    username?: string
  } | {
    type: 'VAULT_LOOKUP'
    site: string
    username: string
    password?: string
  }
}

interface ChatState {
  messages: Message[]
  isTyping: boolean
  addMessage: (role: 'mom' | 'user', content: string, pendingAction?: Message['pendingAction']) => void
  setTyping: (typing: boolean) => void
  removePendingAction: (messageId: string) => void
  clearChat: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [
    {
      id: '1',
      role: 'mom',
      content: 'MOM COMMAND SYSTEM INITIALIZED. Awaiting instructions, Operator.',
      timestamp: new Date().toISOString(),
    }
  ],
  isTyping: false,

  addMessage: (role, content, pendingAction) => {
    const newMessage: Message = {
      id: Math.random().toString(36).slice(2),
      role,
      content,
      timestamp: new Date().toISOString(),
      status: 'sent',
      pendingAction,
    }
    set((state) => ({ messages: [...state.messages, newMessage] }))
  },

  setTyping: (isTyping) => set({ isTyping }),

  removePendingAction: (messageId) => set((state) => ({
    messages: state.messages.map((m) =>
      m.id === messageId ? { ...m, pendingAction: undefined } : m
    ),
  })),

  clearChat: () => set({ messages: [] }),
}))
