import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useVaultStore } from '@/stores/vaultStore'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { Lock, Plus, Search, Copy, Eye, EyeOff, Trash2, Globe, Shield, FolderOpen, Cloud, Github, Database, Server, ChevronRight, ChevronDown, Activity } from 'lucide-react'
import type { VaultEntryPlaintext } from '@/types/supabase'

// Platform metadata: icon + color per known platform
const PLATFORM_META: Record<string, { color: string; icon: React.ReactNode }> = {
  Vercel:   { color: '#ffffff', icon: <span className="text-[11px] font-black">▲</span> },
  Netlify:  { color: '#00d9c1', icon: <Cloud size={10} /> },
  GitHub:   { color: '#e8e8e8', icon: <Github size={10} /> },
  Supabase: { color: '#3ecf8e', icon: <Database size={10} /> },
  AWS:      { color: '#ff9900', icon: <Server size={10} /> },
  GCP:      { color: '#4285f4', icon: <Cloud size={10} /> },
  Azure:    { color: '#0078d4', icon: <Cloud size={10} /> },
}

function getPlatformMeta(name: string) {
  return PLATFORM_META[name] || { color: '#a3a6ff', icon: <FolderOpen size={10} /> }
}

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
                {field === 'site' ? 'Project Name' :
                 field === 'username' ? 'Account / Username' :
                 field === 'category' ? 'Platform (Folder)' :
                 field}
              </label>
              <input
                className="w-full bg-surface-highest text-on-surface placeholder-on-surface-variant/40 px-3 py-1.5 text-sm border-b border-outline-variant focus:border-primary transition-colors"
                style={{ outline: 'none', borderRadius: 0 }}
                placeholder={
                  field === 'site' ? 'e.g. MOM, Personal Site' : 
                  field === 'category' ? 'e.g. Vercel, GitHub, Netlify, Supabase' :
                  field === 'username' ? 'email or account name' :
                  field === 'url' ? 'https://...' : ''
                }
                value={(form as any)[field] || ''}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                required={field === 'site' || field === 'username'}
              />
            </div>
          ))}

          <div>
            <label className="text-[9px] uppercase tracking-widest text-on-surface-variant">Password <span className="text-[#6366f1]/50">(optional)</span></label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="w-full bg-surface-highest text-on-surface placeholder-on-surface-variant/40 px-3 py-1.5 pr-10 text-sm border-b border-outline-variant focus:border-primary transition-colors"
                style={{ outline: 'none', borderRadius: 0 }}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Leave blank if not applicable..."
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

// SetKeyModal removed in favor of Inline Decryption

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
  const { user, cryptoKey, setCryptoKey } = useAuthStore()
  const { entries, isLoading, lockedCount, searchQuery, setSearchQuery, fetchAndDecrypt, deleteEntry, rotateKey } = useVaultStore()
  const { addToast } = useUIStore()
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [showKeyReset, setShowKeyReset] = useState(false)
  const [showPasscodeSetup, setShowPasscodeSetup] = useState(false)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const loadVault = useCallback(() => {
    if (user && cryptoKey) fetchAndDecrypt(user.id, cryptoKey)
  }, [user, cryptoKey, fetchAndDecrypt])

  useEffect(() => { loadVault() }, [loadVault])

  // Automatically trigger the password prompt if we're on this page and key is missing
  useEffect(() => {
    if (!cryptoKey && !isLoading) {
      setShowKeyReset(true)
    }
  }, [cryptoKey, isLoading])


  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const handleDelete = async (id: string) => {
    await deleteEntry(id)
    addToast('Entry permanently deleted.', 'success')
  }

  const filtered = entries.filter((e) => {
    const q = searchQuery.toLowerCase()
    return (
      e.plaintext.site.toLowerCase().includes(q) ||
      e.plaintext.username.toLowerCase().includes(q) ||
      (e.plaintext.category || '').toLowerCase().includes(q) ||
      (e.plaintext.notes || '').toLowerCase().includes(q)
    )
  })

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

        {cryptoKey && (
          <div className="mt-2 flex items-center justify-between px-3 py-1.5 bg-surface-high/50 border border-outline-variant/10">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Shield size={10} className="text-success" />
                <span className="text-[10px] font-bold text-success">{entries.length} DECRYPTED</span>
              </div>
            </div>
            <button 
              onClick={() => setCryptoKey(null)}
              className="text-[9px] font-bold text-on-surface-variant hover:text-warning transition-colors"
            >
              LOCK VAULT
            </button>
          </div>
        )}

        <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent mt-3" />
      </header>

      <div className="flex-1 px-5 pt-4 pb-24">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-surface-high animate-pulse" />)}
          </div>
        ) : !cryptoKey ? (
          <div className="text-center py-20 px-6 max-w-sm mx-auto animate-fade-in">
            <div className="relative mb-8">
              <Shield size={40} className="mx-auto text-primary/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-primary/10 border-t-primary rounded-full animate-spin" />
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#f9f5fd]">Vault Syncing</h3>
                <p className="text-[10px] text-on-surface-variant/60 font-medium">Verify login password to proceed</p>
              </div>

              <input
                type="password"
                autoFocus
                className="w-full bg-transparent border-b border-outline-variant/30 px-2 py-3 text-center text-sm focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/20 tracking-widest"
                placeholder="········"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const pass = (e.target as HTMLInputElement).value
                    if (pass && user) {
                      const { deriveKey } = await import('@/lib/crypto')
                      const key = await deriveKey(pass, user.id)
                      const exported = await window.crypto.subtle.exportKey('raw', key)
                      const b64 = btoa(String.fromCharCode(...new Uint8Array(exported)))
                      localStorage.setItem('mom_vault_session', b64)
                      setCryptoKey(key)
                    }
                  }
                }}
              />
              
              <p className="text-[8px] text-on-surface-variant uppercase tracking-widest opacity-30">
                Press Enter to Authorize Device
              </p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Shield size={36} className="mx-auto text-on-surface-variant/40 mb-4" />
            <p className="text-on-surface-variant text-sm">
              {searchQuery ? 'No matching entries.' : 'Vault is empty. Add your first credential.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {Object.entries(
              filtered.reduce((acc, entry) => {
                const cat = entry.plaintext.category || 'Other'
                acc[cat] = acc[cat] || []
                acc[cat].push(entry)
                return acc
              }, {} as Record<string, typeof entries>)
            ).sort(([a], [b]) => a.localeCompare(b)).map(([platform, catEntries]) => {
              const meta = getPlatformMeta(platform)
              const isExpanded = expandedCategories.has(platform) || searchQuery.trim().length > 0
              
              return (
                <div key={platform} className="group">
                  {/* Platform folder header */}
                  <div
                    onClick={() => toggleCategory(platform)}
                    className="flex items-center gap-2 mb-2 px-3 py-2 border-l-2 cursor-pointer hover:brightness-110 active:brightness-90 transition-all select-none"
                    style={{ borderColor: meta.color, background: `${meta.color}10` }}
                  >
                    <span style={{ color: meta.color }} className="transition-transform duration-200">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                    <span style={{ color: meta.color }}>{meta.icon}</span>
                    <span
                      className="text-[10px] font-black uppercase tracking-widest"
                      style={{ color: meta.color }}
                    >
                      {platform}
                    </span>
                    <span className="ml-auto text-[9px] text-on-surface-variant/40 font-mono">
                      {catEntries.length} {catEntries.length === 1 ? 'ITEM' : 'ITEMS'}
                    </span>
                  </div>

                  {/* Entries within this platform folder */}
                  {isExpanded && (
                    <div className="space-y-2 pl-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    {catEntries.map((entry) => {
                      const revealed = revealedIds.has(entry.id)
                      const hasPassword = entry.plaintext.password && entry.plaintext.password.length > 0
                      return (
                        <div key={entry.id} className="bg-surface-high px-4 py-3 border border-outline-variant/10">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              {/* Project name */}
                              <p className="text-sm font-bold text-on-surface truncate">{entry.plaintext.site}</p>
                              {/* Account */}
                              <p className="text-[10px] text-on-surface-variant/70 truncate mt-0.5">
                                <span className="text-on-surface-variant/40">@</span>{entry.plaintext.username}
                              </p>
                              {/* Notes inline (project context, always visible) */}
                              {entry.plaintext.notes && (
                                <p className="text-[10px] text-[#a3a6ff]/60 mt-1.5 leading-relaxed italic">
                                  {entry.plaintext.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                              <ClipboardCopy text={entry.plaintext.username} label="Account" />
                              {hasPassword && (
                                <>
                                  <ClipboardCopy text={entry.plaintext.password} label="Password" />
                                  <button onClick={() => toggleReveal(entry.id)} className="text-primary hover:text-primary/80 btn-press">
                                    {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
                                  </button>
                                </>
                              )}
                              <button onClick={() => handleDelete(entry.id)} className="text-on-surface-variant hover:text-warning btn-press transition-colors">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          {/* Revealed password strip */}
                          {revealed && hasPassword && (
                            <div className="mt-2 bg-surface-highest px-3 py-2 border-l-2 border-primary animate-slide-up">
                              <p className="text-xs font-mono text-primary select-all">{entry.plaintext.password}</p>
                              {entry.plaintext.url && (
                                <p className="text-[10px] text-on-surface-variant/50 mt-1 truncate">{entry.plaintext.url}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
          </div>
        )}
      </div>

      {showNewEntry && <NewEntryModal onClose={() => setShowNewEntry(false)} onAdded={loadVault} />}
    </div>
  )
}
