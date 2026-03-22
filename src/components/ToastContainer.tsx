import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const COLORS = {
  success: 'border-[#10b981] text-[#10b981]',
  error: 'border-[#ff6e84] text-[#ff6e84]',
  warning: 'border-[#f59e0b] text-[#f59e0b]',
  info: 'border-[#a3a6ff] text-[#a3a6ff]',
}

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="fixed top-4 right-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-2.5 px-3 py-3 glass-card border-l-2 pointer-events-auto animate-slide-up',
              COLORS[toast.type]
            )}
          >
            <Icon size={14} className="flex-shrink-0 mt-0.5" />
            <p className="flex-1 text-xs text-[#f9f5fd]">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#76747b] hover:text-[#f9f5fd] flex-shrink-0"
            >
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
