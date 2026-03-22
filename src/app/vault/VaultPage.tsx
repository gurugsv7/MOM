import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useVaultStore } from '@/stores/vaultStore'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { Lock, Plus, Search, Copy, Eye, EyeOff, Trash2, Globe, Shield } from 'lucide-react'
import type { VaultEntryPlaintext } from '@/types/supabase'

function NewEntryModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { user, cryptoKey } = useAuthStore()
  const { addEntry } = useVaultStore()
  const { addToast } = useUIStore()
  const [form, setForm] = useState<VaultEntryPlaintext>({ site: '', username: '', password: '', url: '', notes: '', category: 'Personal' })
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !cryptoKey) { addToast('Vault key not available — please re-login', 'error'); return }
    setLoading(true)
    try {
      await addEntry(form, user.id, cryptoKey)
      addToast('Entry encrypted and stored.', 'success')
      onAdded()
      onClose()
    } catch (err) {
      addToast('Failed to add entry', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-surface border-t border-outline-variant pb-8 pt-6 px-6 animate-slide-up shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-primary" />
            <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">NEW VAULT ENTRY</h3>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {['site', 'username', 'url', 'category', 'notes'].map((field) => (
            <div key={field}>
              <label className="text-[9px] uppercase tracking-widest text-on-surface-variant">
                {field} {field === 'category' && '(Folder)'}
              </label>
              <input
                className="w-full bg-surface-highest text-on-surface placeholder-on-surface-variant/40 px-3 py-1.5 text-sm border-b border-outline-variant focus:border-primary transition-colors"
                style={{ outline: 'none', borderRadius: 0 }}
                placeholder={
                  field === 'site' ? 'e.g. Netflix' : 
                  field === 'category' ? 'e.g. Work, MOM Project' : 
                  field === 'username' ? 'email or username' : ''
                }
                value={(form as any)[field] || ''}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                required={field === 'site' || field === 'username'}
              />
            </div>
          ))}

          <div>
            <label className="text-[9px] uppercase tracking-widest text-on-surface-variant">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="w-full bg-surface-highest text-on-surface placeholder-on-surface-variant/40 px-3 py-1.5 pr-10 text-sm border-b border-outline-variant focus:border-primary transition-colors"
                style={{ outline: 'none', borderRadius: 0 }}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1.5 text-primary">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary to-primary/80 text-black text-xs font-black uppercase tracking-widest btn-press disabled:opacity-60"
            style={{ borderRadius: 0 }}>
            {loading ? 'ENCRYPTING...' : 'ENCRYPT & STORE'}
          </button>
        </form>
      </div>
    </div>
  )
}

function ClipboardCopy({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const { addToast } = useUIStore()

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    addToast(`${label} copied. Clears in 30s.`, 'info')
    setTimeout(() => {
      navigator.clipboard.writeText('')
      setCopied(false)
    }, 30000)
  }

  return (
    <button onClick={handleCopy} className={cn('btn-press', copied ? 'text-success' : 'text-primary hover:text-primary/80')}>
      <Copy size={12} />
    </button>
  )
}

export function VaultPage() {
  const { user, cryptoKey } = useAuthStore()
  const { entries, isLoading, searchQuery, setSearchQuery, fetchAndDecrypt, deleteEntry } = useVaultStore()
  const { addToast } = useUIStore()
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())

  const loadVault = useCallback(() => {
    if (user && cryptoKey) fetchAndDecrypt(user.id, cryptoKey)
  }, [user, cryptoKey, fetchAndDecrypt])

  useEffect(() => { loadVault() }, [loadVault])

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleDelete = async (id: string) => {
    await deleteEntry(id)
    addToast('Entry permanently deleted.', 'success')
  }

  const filtered = entries.filter((e) =>
    e.plaintext.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.plaintext.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md px-5 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-on-surface">VAULT</h2>
          </div>
          <button
            onClick={() => setShowNewEntry(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-black text-[10px] font-black uppercase tracking-widest btn-press"
            style={{ borderRadius: 0 }}>
            <Plus size={12} /> ADD
          </button>
        </div>

        <div className="flex items-center gap-2 bg-surface-high border border-outline-variant px-3 py-2">
          <Search size={12} className="text-on-surface-variant" />
          <input
            className="flex-1 bg-transparent text-on-surface placeholder-on-surface-variant/40 text-xs"
            style={{ outline: 'none' }}
            placeholder="Search sites, usernames..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {!cryptoKey && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-warning/10 border border-warning/20">
            <Lock size={11} className="text-warning" />
            <p className="text-[10px] text-warning">Vault locked — vault key unavailable. Re-login to unlock.</p>
          </div>
        )}

        <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent mt-3" />
      </header>

      <div className="flex-1 px-5 pt-4 pb-24">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-surface-high animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Shield size={36} className="mx-auto text-on-surface-variant/40 mb-4" />
            <p className="text-on-surface-variant text-sm">
              {searchQuery ? 'No matching entries.' : 'Vault is empty. Add your first credential.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 animate-fade-in">
            {/* Grouped view by category (Folder system) */}
            {Object.entries(
              filtered.reduce((acc, entry) => {
                const cat = entry.plaintext.category || 'Personal'
                acc[cat] = acc[cat] || []
                acc[cat].push(entry)
                return acc
              }, {} as Record<string, typeof entries>)
            ).map(([category, catEntries]) => (
              <div key={category} className="mb-6">
                <div className="flex items-center gap-2 mb-3 bg-[#1e1e24]/50 py-1.5 px-3 border-l-2 border-[#a3a6ff]">
                  <Shield size={10} className="text-[#a3a6ff]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#a3a6ff]">
                    FOLDER: {category}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {catEntries.map((entry) => {
                    const revealed = revealedIds.has(entry.id)
                    return (
                      <div key={entry.id} className="bg-surface-high px-4 py-4 border border-outline-variant/10">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Globe size={12} className="text-primary flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-on-surface truncate">{entry.plaintext.site}</p>
                              <p className="text-[10px] text-on-surface-variant/70 truncate">{entry.plaintext.username}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <ClipboardCopy text={entry.plaintext.username} label="Username" />
                            <ClipboardCopy text={entry.plaintext.password} label="Password" />
                            <button onClick={() => toggleReveal(entry.id)} className="text-primary hover:text-primary/80 btn-press">
                              {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                            <button onClick={() => handleDelete(entry.id)} className="text-on-surface-variant hover:text-warning btn-press transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        {revealed && (
                          <div className="mt-3 bg-surface-highest px-3 py-2 border-l-2 border-primary animate-slide-up">
                            <p className="text-xs font-mono text-primary select-all">{entry.plaintext.password}</p>
                            {entry.plaintext.url && (
                              <p className="text-[10px] text-on-surface-variant/50 mt-1 truncate">{entry.plaintext.url}</p>
                            )}
                            {entry.plaintext.notes && (
                              <p className="text-[10px] text-[#f9f5fd]/60 mt-2 p-2 bg-black/20 italic">
                                {entry.plaintext.notes}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNewEntry && <NewEntryModal onClose={() => setShowNewEntry(false)} onAdded={loadVault} />}
    </div>
  )
}
