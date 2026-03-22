import { create } from 'zustand'

export interface Message {
  id: string
  role: 'mom' | 'user'
  content: string
  imageUrl?: string
  timestamp: string
  status?: 'sending' | 'sent' | 'error'
  pendingAction?: {
    type: 'ADD_VAULT_ENTRY'
    site: string
    username?: string
    category?: string
    notes?: string
  } | {
    type: 'BATCH_VAULT_REVIEW'
    entries: Array<{
      site: string
      username?: string
      category?: string
      notes?: string
    }>
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
  addMessage: (role: 'mom' | 'user', content: string, pendingAction?: Message['pendingAction'], imageUrl?: string) => void
  setTyping: (typing: boolean) => void
  removePendingAction: (messageId: string) => void
  clearChat: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [
    {
      id: '1',
      role: 'mom',
      content: "Hello! I'm MOM, your personal manager. I'm here to help you stay on top of your goals and keep your secrets safe. What can we work on together today?",
      timestamp: new Date().toISOString(),
    }
  ],
  isTyping: false,

  addMessage: (role, content, pendingAction, imageUrl) => {
    const newMessage: Message = {
      id: Math.random().toString(36).slice(2),
      role,
      content,
      imageUrl,
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
