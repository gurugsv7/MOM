import { useAuthStore } from '@/stores/authStore'
import { AuthPage } from '@/app/auth/AuthPage'
import { AppLayout } from '@/components/AppLayout'
import { SecurityGate } from '@/components/auth/SecurityGate'

export function App() {
  const { session, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* MOM loading state */}
          <div className="relative">
            <h1 className="text-5xl font-black tracking-tighter text-[#f9f5fd]" style={{ letterSpacing: '-0.04em' }}>
              MOM
            </h1>
            <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] animate-pulse" />
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 h-1 bg-[#6366f1] animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return session ? (
    <SecurityGate>
      <AppLayout />
    </SecurityGate>
  ) : (
    <AuthPage />
  )
}
