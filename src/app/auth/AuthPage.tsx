import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, Lock, Shield } from 'lucide-react'

type Mode = 'login' | 'signup'

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login, signup } = useAuthStore()
  const { addToast } = useUIStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
        addToast('Access granted. Welcome back.', 'success')
      } else {
        if (!displayName.trim()) throw new Error('Display name is required')
        await signup(email, password, displayName)
        addToast('Identity initialized. Welcome to MOM.', 'success')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failure'
      // Treat email-confirm message as info, not error
      const isInfo = msg.toLowerCase().includes('check your email') || msg.toLowerCase().includes('confirm')
      addToast(msg, isInfo ? 'info' : 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden">
      {/* Nebula glow top-left */}
      <div className="absolute top-0 left-0 w-64 h-64 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 0% 0%, rgba(99,102,241,0.18) 0%, transparent 70%)' }} />

      {/* Lock icon decoration top-right */}
      <div className="absolute top-8 right-6 text-[#6366f1] opacity-30">
        <Shield size={48} strokeWidth={1} />
      </div>

      {/* Brand */}
      <div className="w-full max-w-sm mb-8 animate-fade-in">
        <div className="flex items-baseline gap-3">
          <h1 className="text-6xl font-black tracking-tighter text-[#f9f5fd]"
            style={{ letterSpacing: '-0.04em' }}>MOM</h1>
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#6366f1]">
            <Lock size={13} className="text-white" />
          </div>
        </div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#acaab1] mt-1 font-medium">
          My Own Manager
        </p>
        <p className="text-[13px] italic text-[#76747b] mt-3 leading-relaxed">
          "Your goals. Your schedule. Your secrets."
        </p>
      </div>

      {/* Glass Form Card */}
      <div className="w-full max-w-sm glass-card p-7 animate-slide-up">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {mode === 'signup' && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-[0.2em] text-[#acaab1]">
                Identity / Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Warrior"
                className="w-full bg-black/60 text-[#f9f5fd] placeholder-[#48474d] px-0 py-2 text-sm border-b border-[#48474d] focus:border-[#a3a6ff] transition-colors duration-300"
                style={{ outline: 'none', borderRadius: 0 }}
                autoComplete="name"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-[0.2em] text-[#acaab1]">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full bg-black/60 text-[#f9f5fd] placeholder-[#48474d] px-0 py-2 text-sm border-b border-[#48474d] focus:border-[#a3a6ff] transition-colors duration-300"
              style={{ outline: 'none', borderRadius: 0 }}
              required
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-[0.2em] text-[#acaab1]">
              {mode === 'login' ? 'Password / Vault Key' : 'Master Password (also encrypts vault)'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/60 text-[#f9f5fd] placeholder-[#48474d] px-0 py-2 pr-8 text-sm border-b border-[#48474d] focus:border-[#a3a6ff] transition-colors duration-300"
                style={{ outline: 'none', borderRadius: 0 }}
                required
                minLength={8}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-2 text-[#6366f1] hover:text-[#a3a6ff] transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {mode === 'signup' && (
              <p className="text-[10px] text-[#6063ee] mt-1">
                ⚡ This password also encrypts your vault. Never share it.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              'w-full py-3 mt-2 text-xs font-bold uppercase tracking-[0.2em] btn-press',
              'bg-gradient-to-r from-[#6366f1] to-[#6063ee] text-black',
              'transition-all duration-200 hover:opacity-90',
              loading && 'opacity-60 cursor-not-allowed'
            )}
            style={{ borderRadius: 0 }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border border-black/40 border-t-black animate-spin rounded-full" />
                {mode === 'login' ? 'Authenticating...' : 'Initializing...'}
              </span>
            ) : (
              mode === 'login' ? 'ENTER' : 'INITIALIZE'
            )}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-[12px] text-[#8B5CF6] hover:text-[#ac8aff] transition-colors text-center"
          >
            {mode === 'login'
              ? 'New here? Begin your journey →'
              : '← Already initialized? Sign in'}
          </button>
        </form>
      </div>

      {/* Bottom indigo strip */}
      <div className="fixed bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#6366f1] to-transparent opacity-60" />
    </div>
  )
}
