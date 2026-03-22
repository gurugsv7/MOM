'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Lock, Shield, Delete, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SecurityGate({ children }: { children: React.ReactNode }) {
  const { hasPasscode, isPasscodeLocked, unlockWithPasscode, logout } = useAuthStore()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  // Auto-lock when session starts if passcode exists
  useEffect(() => {
    if (hasPasscode && !isPasscodeLocked) {
      // In a real app, you might only lock after inactivity
      // For now, if they have a passcode, we assume they want it active
    }
  }, [hasPasscode, isPasscodeLocked])

  const handlePress = (num: string) => {
    if (pin.length >= 6) return
    setError(false)
    setPin(prev => prev + num)
  }

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1))
  }

  const handleUnlock = async () => {
    setIsVerifying(true)
    const success = await unlockWithPasscode(pin)
    if (!success) {
      setError(true)
      setPin('')
    }
    setIsVerifying(false)
  }

  useEffect(() => {
    if (pin.length === 4 || pin.length === 6) {
      // Auto-unlock for common PIN lengths if the user stops typing?
      // Better to have an explicit button or auto-trigger at a specific length
    }
  }, [pin])

  if (hasPasscode && isPasscodeLocked) {
    return (
      <div className="fixed inset-0 z-[9999] bg-surface-lowest flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
        <div className="w-full max-w-xs space-y-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield size={32} className="text-primary animate-pulse" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-widest text-on-surface">MOM SECURE</h1>
            <p className="text-xs text-on-surface-variant font-medium">Enter your device passcode to unlock your session.</p>
          </div>

          <div className="space-y-8">
            {/* PIN Dots */}
            <div className="flex justify-center gap-4">
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-3 h-3 rounded-full border-2 transition-all duration-200",
                    error ? "border-error bg-error/20" : 
                    i < pin.length ? "bg-primary border-primary scale-125" : "border-on-surface-variant/30"
                  )} 
                />
              ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  onClick={() => handlePress(num)}
                  disabled={isVerifying}
                  className="w-16 h-16 rounded-full bg-surface-high text-xl font-bold text-on-surface flex items-center justify-center hover:bg-surface-low transition-colors active:scale-95 disabled:opacity-50"
                >
                  {num}
                </button>
              ))}
              <button 
                onClick={logout}
                className="w-16 h-16 flex items-center justify-center text-[10px] font-black uppercase text-error hover:underline"
              >
                Logout
              </button>
              <button
                onClick={() => handlePress('0')}
                disabled={isVerifying}
                className="w-16 h-16 rounded-full bg-surface-high text-xl font-bold text-on-surface flex items-center justify-center hover:bg-surface-low transition-colors active:scale-95 disabled:opacity-50"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                className="w-16 h-16 flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-90"
              >
                <Delete size={20} />
              </button>
            </div>
          </div>

          <button
            onClick={handleUnlock}
            disabled={pin.length < 4 || isVerifying}
            className="w-full py-4 bg-primary text-on-primary text-xs font-black uppercase tracking-[0.2em] rounded-none shadow-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isVerifying ? 'Verifying...' : <>Unlock Session <ArrowRight size={14} /></>}
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
