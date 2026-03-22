import { useUIStore, type TabKey } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { LayoutGrid, Terminal, Target, Lock, Settings } from 'lucide-react'

const TABS: Array<{ key: TabKey; label: string; Icon: typeof LayoutGrid }> = [
  { key: 'home', label: 'FEED', Icon: LayoutGrid },
  { key: 'chat', label: 'CHAT', Icon: Terminal },
  { key: 'goals', label: 'GOALS', Icon: Target },
  { key: 'vault', label: 'VAULT', Icon: Lock },
  { key: 'settings', label: 'SETUP', Icon: Settings },
]

export function BottomNav() {
  const { activeTab, setActiveTab } = useUIStore()

  return (
    <nav className="flex-shrink-0 z-30 nav-glass">
      <div className="grid grid-cols-5 w-full">
        {TABS.map(({ key, label, Icon }) => {
          const active = activeTab === key
          return (
            <button
              key={key}
              id={`nav-${key}`}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex flex-col items-center py-3 gap-1 transition-colors duration-200 btn-press',
                active ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              <div className="relative">
                <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
                {active && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary" />
                )}
              </div>
              <span className={cn(
                'text-[8px] tracking-[0.1em] font-bold uppercase',
                active && 'text-primary'
              )}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
