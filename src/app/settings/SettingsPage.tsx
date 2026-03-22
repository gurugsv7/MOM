import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useVaultStore } from '@/stores/vaultStore'
import { useUIStore } from '@/stores/uiStore'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { User, Moon, Sun, Monitor, Trash2, LogOut, Shield } from 'lucide-react'

type Theme = 'dark' | 'light' | 'system'

export function SettingsPage() {
  const { user, profile, updateProfile, logout } = useAuthStore()
  const { clear: clearVault } = useVaultStore()
  const { addToast, theme, setTheme } = useUIStore()

  const [displayName, setDisplayName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Sync local state with store profile
  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name)
  }, [profile])

  const handleSaveName = async () => {
    if (!user || !displayName.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', user.id)

    if (error) {
      addToast('Failed to update identity signature.', 'error')
    } else {
      updateProfile({ display_name: displayName.trim() })
      addToast('Tactical identity updated.', 'success')
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    clearVault()
    await logout()
    addToast('Session terminated. Vault cleared.', 'info')
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    // Delete in order: vault, tasks, goal_days, goals, profile, then auth user
    await supabase.from('vault_entries').delete().eq('user_id', user.id)
    await supabase.from('tasks').delete().eq('user_id', user.id)
    await supabase.from('goal_days').delete().eq('user_id', user.id)
    await supabase.from('goals').delete().eq('user_id', user.id)
    await supabase.from('profiles').delete().eq('id', user.id)
    clearVault()
    await logout()
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md px-5 pt-4 pb-3">
        <h2 className="text-sm font-black uppercase tracking-widest text-on-surface">SETTINGS</h2>
        <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent mt-3" />
      </header>

      <div className="flex-1 px-5 pt-5 pb-24 space-y-6">
        {/* Identity */}
        <section>
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-primary mb-3">IDENTITY</h3>
          <div className="bg-surface-high p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-surface-highest border border-outline-variant/30 flex items-center justify-center">
                <User size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">{user?.email}</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Authenticated user</p>
              </div>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest text-on-surface-variant">Display Name</label>
              <div className="flex gap-2 mt-1">
                <input
                  className="flex-1 bg-black/20 text-on-surface placeholder-outline-variant px-0 py-1.5 text-sm border-b border-outline-variant focus:border-primary transition-colors"
                  style={{ outline: 'none', borderRadius: 0 }}
                  placeholder="e.g. Warrior"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="px-3 py-1 bg-primary text-black text-[9px] font-black uppercase btn-press disabled:opacity-60"
                  style={{ borderRadius: 0 }}>
                  {saving ? '...' : 'SAVE'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Vault Security */}
        <section>
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-primary mb-3">VAULT SECURITY</h3>
          <div className="bg-surface-high p-4">
            <div className="flex items-start gap-3">
              <Shield size={16} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-on-surface">AES-256-GCM Encryption</p>
                <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">
                  Your vault is encrypted client-side using a key derived from your login password via PBKDF2 (100,000 iterations). The server never sees your plaintext passwords.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Theme */}
        <section>
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-primary mb-3">THEME</h3>
          <div className="bg-surface-high p-4">
            <div className="flex gap-2">
              {([['dark', 'DARK', Moon], ['light', 'LIGHT', Sun], ['system', 'SYSTEM', Monitor]] as const).map(([value, label, Icon]) => (
                <button key={value} type="button"
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 text-[9px] font-bold uppercase tracking-wider transition-colors btn-press',
                    theme === value ? 'bg-primary text-black' : 'bg-surface-low text-on-surface-variant'
                  )}
                  style={{ borderRadius: 0 }}>
                  <Icon size={11} /> {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-warning mb-3">DANGER ZONE</h3>
          <div className="space-y-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 bg-surface-high hover:bg-surface-highest text-sm text-on-surface transition-colors btn-press"
              style={{ borderRadius: 0 }}>
              <LogOut size={14} className="text-on-surface-variant" />
              Sign Out (Clears vault memory)
            </button>

            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-warning/10 hover:bg-warning/20 text-sm text-warning border border-warning/20 transition-colors btn-press"
                style={{ borderRadius: 0 }}>
                <Trash2 size={14} />
                Delete Account & All Data
              </button>
            ) : (
              <div className="bg-warning/10 border border-warning/30 px-4 py-4 space-y-3">
                <p className="text-xs text-warning">
                  This permanently deletes ALL your goals, tasks, and vault entries. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setDeleteConfirm(false)}
                    className="flex-1 py-2 border border-outline-variant text-on-surface-variant text-[10px] uppercase tracking-widest btn-press"
                    style={{ borderRadius: 0 }}>CANCEL</button>
                  <button onClick={handleDeleteAccount}
                    className="flex-1 py-2 bg-warning text-black text-[10px] font-black uppercase tracking-widest btn-press"
                    style={{ borderRadius: 0 }}>DELETE ALL</button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
