import { useMemo } from 'react'
import { useGoalsStore } from '@/stores/goalsStore'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { 
  Check, 
  FastForward, 
  ArrowLeft, 
  Clock, 
  Target, 
  Zap, 
  AlertTriangle, 
  ExternalLink,
  ChevronRight,
  ListChecks,
  Wrench
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function TaskDetailPage() {
  const { user } = useAuthStore()
  const { todayTasks, updateTaskStatus, skipTask } = useGoalsStore()
  const { selectedTaskId, setSelectedTask, addToast } = useUIStore()

  const task = useMemo(() => {
    return todayTasks.find(t => t.id === selectedTaskId)
  }, [todayTasks, selectedTaskId])

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-surface">
        <div className="w-16 h-16 bg-surface-highest flex items-center justify-center mb-6">
          <AlertTriangle className="text-warning" size={32} />
        </div>
        <h2 className="text-lg font-black uppercase tracking-widest text-on-surface mb-2">Task Not Found</h2>
        <p className="text-xs text-on-surface-variant mb-8 uppercase tracking-tighter">The requested tactical objective is no longer in active memory.</p>
        <button 
          onClick={() => setSelectedTask(null)}
          className="px-8 py-3 outline outline-1 outline-outline-variant text-[10px] font-black uppercase tracking-widest hover:bg-surface-high transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    )
  }

  const completed = task.status === 'done'
  const accentColor = "text-primary"

  return (
    <div className="flex flex-col h-full bg-[#180720] text-[#f8dcff] overflow-x-hidden font-inter select-none">
      {/* Header HUD */}
      <header className="sticky top-0 z-50 bg-[#180720]/80 backdrop-blur-xl border-b border-[#55405d]/30 px-6 py-4 flex items-center justify-between">
        <button 
          onClick={() => setSelectedTask(null)}
          className="w-10 h-10 flex items-center justify-center bg-[#261030] border border-[#55405d]/40 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-center flex-grow">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a7a5ff] opacity-80">DAILY GUIDE</span>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8 space-y-10 pb-32">
        {/* Title Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="bg-[#a7a5ff]/20 text-[#a7a5ff] text-[9px] font-black px-2 py-0.5 uppercase tracking-widest outline outline-1 outline-[#a7a5ff]/30">
              {task.goal?.category || 'GOAL'}
            </span>
            <div className="h-[1px] flex-grow bg-gradient-to-r from-[#a7a5ff]/40 to-transparent" />
          </div>
          <h1 className="text-2xl font-black tracking-tight leading-none uppercase text-white">
            {task.title}
          </h1>
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-1.5 text-[#bca2c4]">
              <Clock size={12} className="text-[#a7a5ff]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">~{task.estimated_minutes} MIN</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#bca2c4]">
              <Zap size={12} className="text-[#c081ff]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">@ {(task as any).scheduled_time || 'TBD'}</span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4 bg-[#261030] p-6 border-l-4 border-[#a7a5ff]">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a7a5ff]">WHAT YOU'LL ACHIEVE</h2>
            <p className="text-sm font-medium leading-relaxed opacity-90">
               {task.objective || 'Initialize mission parameters for optimal results.'}
            </p>
          </div>
          <div className="bg-[#261030]/50 p-6 border border-[#55405d]/30 space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#bca2c4]">QUICK INFO</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-tighter">
                <span className="opacity-40 text-white">ETA:</span>
                <span className="text-[#a7a5ff]">{task.estimated_minutes}M</span>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-tighter">
                <span className="opacity-40 text-white">WINDOW:</span>
                <span className="text-[#c081ff]">{(task as any).scheduled_time || 'ACTIVE'}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-tighter">
                <span className="opacity-40 text-white">STATUS:</span>
                <span className={cn(completed ? "text-green-400" : "text-yellow-400")}>
                  {completed ? "COMPLETE" : "PENDING"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Tactical Overview */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#bca2c4]">ABOUT THIS TASK</h2>
          <p className="text-xs leading-relaxed opacity-60 italic">
            {task.description || 'Loading task details...'}
          </p>
        </section>

        {/* Steps */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <ListChecks className="w-4 h-4 text-[#c081ff]" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">STEP-BY-STEP GUIDE</h2>
          </div>
          <div className="space-y-4">
            {(() => {
              let stepsArray: string[] = []
              if (Array.isArray(task.steps)) {
                stepsArray = task.steps as any[]
              } else if (typeof task.steps === 'string') {
                try {
                  stepsArray = JSON.parse(task.steps)
                } catch {
                  stepsArray = []
                }
              }

              if (stepsArray.length === 0) {
                return (
                  <div className="p-4 bg-[#261030]/30 border border-[#a7a5ff]/10">
                    <p className="text-[10px] text-[#a7a5ff]/60 italic leading-relaxed uppercase tracking-wider">
                      This task was created with an older version of MOM. 
                      Try starting a new goal to see your detailed step-by-step guide!
                    </p>
                  </div>
                )
              }

              return stepsArray.map((step: string, i: number) => (
                <div key={i} className="flex gap-4 group">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center text-[10px] font-black text-[#10b981] group-hover:bg-[#10b981] group-hover:text-black transition-all">
                    {i + 1}
                  </div>
                  <div className="p-5 bg-[#261030] border border-[#55405d]/40 flex-1 hover:border-[#a7a5ff]/40 transition-colors">
                    <p className="text-sm leading-relaxed opacity-90">
                      {step}
                    </p>
                  </div>
                </div>
              ))
            })()}
          </div>
        </section>

        {/* Requirements */}
        {task.requirements && (task.requirements as string[]).length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Wrench className="w-4 h-4 text-[#a7a5ff]" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">WHAT YOU'LL NEED</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {(task.requirements as string[]).map((req, i) => (
                <div key={i} className="px-4 py-2 bg-[#180720] border border-[#55405d]/40 text-[10px] font-bold uppercase tracking-widest text-[#bca2c4]">
                  {req}
                </div>
              ))}
            </div>
          </section>
        )}

          {/* Success Criteria */}
          <section className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#10b981]">HOW TO KNOW YOU'RE DONE</h2>
            <div className="p-4 bg-[#180720] border border-[#10b981]/20 border-l-2 border-l-[#10b981]">
              <p className="text-xs leading-relaxed opacity-80">{task.success_criteria || 'Once you finish the steps above, you are all set!'}</p>
            </div>
          </section>

          {/* Common Mistakes */}
          <section className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff6e84]">THINGS TO WATCH OUT FOR</h2>
            <div className="p-4 bg-[#180720] border border-[#ff6e84]/20 border-l-2 border-l-[#ff6e84]">
              <p className="text-xs leading-relaxed opacity-80">{task.common_mistakes || 'Take it slow and double-check your work as you go.'}</p>
            </div>
          </section>

        {/* Resources */}
        {task.resources && (task.resources as any[]).length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a7a5ff]">HELPFUL LINKS & VIDEOS</h2>
            <div className="flex flex-col gap-2">
              {(task.resources as any[]).map((res, i) => (
                <a 
                  key={i} 
                  href={typeof res === 'string' ? '#' : res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 bg-[#261030] border border-[#55405d]/30 text-[11px] font-bold uppercase tracking-tight text-[#f8dcff] hover:bg-[#a7a5ff]/10 hover:border-[#a7a5ff]/40 transition-all cursor-pointer group"
                >
                  <span className="flex items-center gap-3">
                    <ExternalLink size={14} className="text-[#a7a5ff]" />
                    {typeof res === 'string' ? res : res.label}
                  </span>
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Persistent Footer Actions */}
      <footer className="fixed bottom-0 left-0 right-0 p-5 bg-[#180720]/90 backdrop-blur-xl border-t border-[#55405d]/30 flex flex-col gap-3">
        <button 
          onClick={() => {
            updateTaskStatus(task.id, completed ? 'pending' : 'done')
            if (!completed) {
              addToast('Mission accomplished. Well done, operator.', 'success')
              setSelectedTask(null)
            }
          }}
          className={cn(
            "w-full py-4 text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-lg",
            completed 
              ? "bg-[#261030] text-[#a7a5ff] outline outline-1 outline-[#a7a5ff]/40" 
              : "bg-[#a7a5ff] text-[#1c00a0]"
          )}
        >
          {completed ? 'UNDO COMPLETION' : 'MARK AS DONE'}
        </button>
        
        {!completed && (
          <button 
            onClick={() => {
              if (user?.id) skipTask(task.id, user.id)
              addToast('Task rescheduled. No pressure!', 'info')
              setSelectedTask(null)
            }}
            className="w-full py-4 bg-transparent text-[#ff6e84] text-[10px] font-black uppercase tracking-[0.2em] border border-[#ff6e84]/30 hover:bg-[#ff6e84]/10 transition-all active:scale-[0.98]"
          >
            I'LL DO THIS LATER
          </button>
        )}
      </footer>
    </div>
  )
}
