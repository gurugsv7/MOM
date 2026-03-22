// Manually maintained types until Supabase CLI generates them
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string | null; created_at: string }
        Insert: { id: string; display_name?: string | null; created_at?: string }
        Update: { id?: string; display_name?: string | null; created_at?: string }
      }
      goals: {
        Row: {
          id: string; user_id: string; title: string; category: string
          description: string | null; deadline: string; daily_budget_minutes: number
          color: string; status: string; created_at: string
        }
        Insert: {
          id?: string; user_id: string; title: string; category: string
          description?: string | null; deadline: string; daily_budget_minutes?: number
          color?: string; status?: string; created_at?: string
        }
        Update: {
          id?: string; user_id?: string; title?: string; category?: string
          description?: string | null; deadline?: string; daily_budget_minutes?: number
          color?: string; status?: string; created_at?: string
        }
      }
      goal_days: {
        Row: {
          id: string; goal_id: string; user_id: string; day_number: number
          scheduled_date: string; status: string; created_at: string
        }
        Insert: {
          id?: string; goal_id: string; user_id: string; day_number: number
          scheduled_date: string; status?: string; created_at?: string
        }
        Update: {
          id?: string; goal_id?: string; user_id?: string; day_number?: number
          scheduled_date?: string; status?: string; created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string; goal_day_id: string; user_id: string; title: string
          description: string | null; estimated_minutes: number; status: string
          redistributed: boolean; original_day_number: number | null
          display_order: number; created_at: string
        }
        Insert: {
          id?: string; goal_day_id: string; user_id: string; title: string
          description?: string | null; estimated_minutes?: number; status?: string
          redistributed?: boolean; original_day_number?: number | null
          display_order?: number; created_at?: string
        }
        Update: {
          id?: string; goal_day_id?: string; user_id?: string; title?: string
          description?: string | null; estimated_minutes?: number; status?: string
          redistributed?: boolean; original_day_number?: number | null
          display_order?: number; created_at?: string
        }
      }
      vault_entries: {
        Row: {
          id: string; user_id: string; encrypted_blob: string; iv: string
          search_hint: string | null; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; user_id: string; encrypted_blob: string; iv: string
          search_hint?: string | null; created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; user_id?: string; encrypted_blob?: string; iv?: string
          search_hint?: string | null; created_at?: string; updated_at?: string
        }
      }
    }
  }
}

// App-level types
export type GoalCategory = 'fitness' | 'diet' | 'exam' | 'skill' | 'habit' | 'custom'
export type GoalStatus = 'active' | 'completed' | 'archived'
export type TaskStatus = 'pending' | 'done' | 'skipped'
export type DayStatus = 'pending' | 'completed' | 'missed' | 'partial'

export interface VaultEntryPlaintext {
  site: string
  username: string
  password: string
  url?: string
  notes?: string
  category?: string
}

export interface DecryptedVaultEntry {
  id: string
  search_hint: string | null
  created_at: string
  updated_at: string
  plaintext: VaultEntryPlaintext
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}
