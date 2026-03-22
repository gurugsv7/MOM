import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useVaultStore } from '@/stores/vaultStore'
import { useUIStore } from '@/stores/uiStore'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { User, Moon, Sun, Monitor, Trash2, LogOut, Shield, Lock } from 'lucide-react'

type Theme = 'dark' | 'light' | 'system'

export function SettingsPage() {
  const { user, profile, updateProfile, logout, hasPasscode } = useAuthStore()
  const { clear: clearVault } = useVaultStore()
  const { addToast, theme, setTheme } = useUIStore()
  const [showPasscodeSetup, setShowPasscodeSetup] = useState(false)

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
    addToast('Session terminated. Local keys wiped for privacy.', 'info')
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
          <div className="bg-surface-high p-4 space-y-4">
            <div className="flex items-start gap-3">
              <Shield size={16} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-on-surface">AES-256-GCM Encryption</p>
                <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">
                  Your vault is encrypted client-side using a key derived from your login password via PBKDF2 (100,000 iterations). Your encrypted data is safe in the cloud, but the decryption keys only live in your device's memory.
                </p>
              </div>
            </div>

            {/* Device PIN Toggle/Change */}
            <div className="pt-3 border-t border-outline-variant/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Lock size={14} className={cn(hasPasscode ? "text-success" : "text-on-surface-variant")} />
                <div>
                  <p className="text-[11px] font-bold text-on-surface">Device PIN Lock</p>
                  <p className="text-[9px] text-on-surface-variant">{hasPasscode ? "Enabled" : "Not Setup"}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPasscodeSetup(true)}
                className="px-3 py-1.5 bg-surface-highest text-primary text-[9px] font-black uppercase tracking-wider hover:bg-primary hover:text-black transition-all"
              >
                {hasPasscode ? "Manage PIN" : "Setup PIN"}
              </button>
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
              Sign Out (End decryption session)
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
      {showPasscodeSetup && <PasscodeSetupModal onClose={() => setShowPasscodeSetup(false)} />}
    </div>
  )
}

function PasscodeSetupModal({ onClose }: { onClose: () => void }) {
  const { setPasscode, clearPasscode, hasPasscode } = useAuthStore()
  const { addToast } = useUIStore()
  const [pin, setPin] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  const handleSave = async () => {
    if (pin.length < 4) return
    setIsBusy(true)
    try {
      await setPasscode(pin)
      addToast('Passcode established successfully.', 'success')
      onClose()
    } catch (e) {
      addToast('Failed to setup passcode.', 'error')
    }
    setIsBusy(false)
  }

  const handleRemove = () => {
    clearPasscode()
    addToast('Passcode removed. Login will require full password.', 'info')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-6">
      <div className="w-full max-w-sm bg-surface-lowest border border-primary/20 p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <Lock size={32} className="mx-auto text-primary mb-4" />
          <h2 className="text-lg font-black uppercase tracking-[0.2em] text-on-surface">Device PIN</h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Choose a 4-6 digit PIN for this device.
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            className="w-full bg-surface-high text-center text-3xl font-black tracking-[1em] text-primary px-4 py-6 border-b-2 border-primary outline-none"
            placeholder="****"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
            autoFocus
          />

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleSave}
              disabled={isBusy || pin.length < 4}
              className="py-4 bg-primary text-on-primary text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50"
            >
              Set PIN
            </button>
            <button
              onClick={onClose}
              className="py-4 bg-surface-high text-on-surface text-[10px] font-black uppercase tracking-widest hover:bg-surface-low"
            >
              Cancel
            </button>
          </div>

          {hasPasscode && (
            <button
              onClick={handleRemove}
              className="w-full py-2 text-[9px] font-black uppercase text-error hover:underline mt-4"
            >
              Remove Passcode
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
