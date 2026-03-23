import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import { BottomNav } from '@/components/BottomNav'
import { ToastContainer } from '@/components/ToastContainer'
import { DashboardPage } from '@/app/dashboard/DashboardPage'
import { ChatPage } from '@/app/chat/ChatPage'
import { GoalsPage } from '@/app/goals/GoalsPage'
import { VaultPage } from '@/app/vault/VaultPage'
import { SettingsPage } from '@/app/settings/SettingsPage'
import { TaskDetailPage } from '@/app/tasks/TaskDetailPage'

export function AppLayout() {
  const { activeTab, theme } = useUIStore()

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.add('light')
    } else if (theme === 'dark') {
      root.classList.remove('light')
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (isDark) root.classList.remove('light')
      else root.classList.add('light')
    }
  }, [theme])

  return (
    <div className="relative h-[100dvh] max-w-sm mx-auto flex flex-col overflow-hidden bg-surface">
      <ToastContainer />

      <main className="flex-1 overflow-hidden flex flex-col relative">
        <div className={cn(activeTab !== 'home' && 'hidden', 'h-full overflow-y-auto')}>
          <DashboardPage />
        </div>
        <div className={cn(activeTab !== 'chat' && 'hidden', 'h-full')}>
          <ChatPage />
        </div>
        <div className={cn(activeTab !== 'goals' && 'hidden', 'h-full overflow-y-auto')}>
          <GoalsPage />
        </div>
        <div className={cn(activeTab !== 'vault' && 'hidden', 'h-full overflow-y-auto')}>
          <VaultPage />
        </div>
        <div className={cn(activeTab !== 'settings' && 'hidden', 'h-full overflow-y-auto')}>
          <SettingsPage />
        </div>
        {activeTab === 'task-detail' && (
          <div className="absolute inset-0 z-[100] h-full overflow-hidden bg-background">
            <TaskDetailPage />
          </div>
        )}
      </main>

      {activeTab !== 'task-detail' && <BottomNav />}
    </div>
  )
}
