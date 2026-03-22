import { useMemo, useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useGoalsStore } from '@/stores/goalsStore'
import { Check, FastForward, Clock, Activity, Target, Zap, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'

interface ProgressRingProps {
  progress: number
  label: string
  colorClass?: string
}

function ProgressRing({ progress, label, colorClass = 'text-primary' }: ProgressRingProps) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            className="text-surface-highest"
            cx="32"
            cy="32"
            fill="transparent"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
          />
          <circle
            className={colorClass}
            cx="32"
            cy="32"
            fill="transparent"
            r={radius}
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeWidth="4"
          />
        </svg>
        <span className="absolute text-xs font-bold text-on-surface">{Math.round(progress)}%</span>
      </div>
      <span className="text-[10px] font-bold text-on-surface-variant tracking-[0.1em] uppercase">{label}</span>
    </div>
  )
}

export function DashboardPage() {
  const { user, profile } = useAuthStore()
  const { todayTasks, goals, updateTaskStatus, skipTask } = useGoalsStore()

  const displayName = useMemo(() => {
    return profile?.display_name?.toUpperCase() || 
           user?.user_metadata?.full_name?.split(' ')[0]?.toUpperCase() || 
           'WARRIOR'
  }, [profile, user])

  const todayStr = format(new Date(), 'EEE dd MMM').toUpperCase()

  // Simple progress calculation based on today's tasks for each goal
  const goalProgress = useMemo(() => {
    return goals.map(goal => {
      const tasksForGoal = todayTasks.filter(t => t.goal?.id === goal.id)
      const completed = tasksForGoal.filter(t => t.status === 'done').length
      const progress = tasksForGoal.length > 0 ? (completed / tasksForGoal.length) * 100 : 0
      return {
        id: goal.id,
        category: goal.category || goal.title || 'GOAL',
        progress: progress
      }
    }).filter(gp => todayTasks.some(t => t.goal?.id === gp.id)).slice(0, 3) // Show top 3 active goals today
  }, [goals, todayTasks])

  const sortedTodayTasks = useMemo(() => {
    return [...todayTasks].sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1
      if (a.status !== 'done' && b.status === 'done') return -1
      return 0
    })
  }, [todayTasks])

  const totalMinutes = useMemo(() => {
    return todayTasks.reduce((acc, t) => acc + (t.estimated_minutes || 0), 0)
  }, [todayTasks])
  const overloaded = totalMinutes > 240

  return (
    <div className="min-h-full pb-24 text-on-surface w-full max-w-2xl mx-auto overflow-x-hidden">
      {/* Top Bar */}
      <header className="sticky top-0 w-full z-40 px-4 h-14 flex items-center justify-between bg-surface/80 backdrop-blur-xl border-b border-primary/20">
        <div className="flex items-center gap-2">
          <TerminalIcon />
          <span className="text-on-surface font-black tracking-[-0.02em] uppercase text-lg">MOM_CORE</span>
        </div>
        <div className="text-on-surface-variant font-bold tracking-tighter uppercase text-xs">{todayStr}</div>
      </header>

      <main className="px-4 py-8 space-y-8">
        {/* Greeting */}
        <section className="flex flex-col gap-3">
          <h1 className="text-3xl font-black tracking-tight text-on-surface">
            GOOD {new Date().getHours() < 12 ? 'MORNING' : 'EVENING'}, {displayName}.
          </h1>
          <div className="flex">
            <div className="bg-primary/20 px-3 py-1 flex items-center gap-2 border border-primary/30 shadow-sm">
               <span className="text-[10px] font-bold uppercase tracking-widest text-primary">STATUS</span>
               <span className="text-on-surface font-bold text-xs tracking-wide">SYSTEM NOMINAL</span>
            </div>
          </div>
        </section>

        {/* Progress Rings */}
        {goalProgress.length > 0 && (
          <section className="grid grid-cols-3 gap-4 py-4">
            {goalProgress.map(gp => (
              <ProgressRing key={gp.id} progress={gp.progress} label={gp.category} />
            ))}
          </section>
        )}

        {/* Overload Warning Banner */}
        {overloaded && (
          <section className="bg-warning p-4 flex items-center justify-between border border-black/10 shadow-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-black" size={20} strokeWidth={2.5} />
              <span className="text-black font-bold text-sm tracking-tight uppercase">
                Day is overloaded ({Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m)
              </span>
            </div>
          </section>
        )}

        {/* Section Label */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase">TODAY'S TASKS</span>
          <div className="h-px flex-grow bg-outline-variant/30" />
          <div className="bg-primary/20 border border-primary/40 px-2 py-0.5 text-[10px] font-bold text-primary">
            [{todayTasks.length.toString().padStart(2, '0')}]
          </div>
        </div>

        {/* Task List */}
        <section className="space-y-4">
          {sortedTodayTasks.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-outline-variant text-on-surface-variant text-sm">
              No tasks scheduled for today.
            </div>
          ) : (
            sortedTodayTasks.map((task, index) => {
              const completed = task.status === 'done'
              const bgClass = completed ? 'bg-surface-low opacity-75' : 'bg-surface-high'
              const accentColor = index % 2 === 0 ? 'bg-primary' : 'bg-secondary'

              return (
                <div key={task.id} className={cn("flex border border-outline-variant/20 relative group transition-all duration-300", bgClass)}>
                  <div className={cn("w-1", completed ? 'bg-outline-variant' : accentColor)} />
                  <div className="p-4 flex-grow space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="bg-surface-highest text-[10px] font-bold px-2 py-0.5 border border-outline-variant text-on-surface-variant uppercase tracking-tighter">
                          {task.goal?.category || task.goal?.title || 'TASK'}
                        </span>
                        {(task.goal as any)?.momentum_score < 70 && (
                          <span className="text-[8px] font-black uppercase text-primary animate-pulse">Momentum Reset: Simple</span>
                        )}
                      </div>
                      {task.estimated_minutes && (
                        <span className="text-secondary text-[10px] font-bold">~{task.estimated_minutes} MIN</span>
                      )}
                    </div>
                    <div>
                      <div className="flex flex-col">
                        <h3 className={cn("text-[15px] font-bold", completed ? "line-through text-on-surface-variant" : "text-on-surface")}>
                          {task.title}
                        </h3>
                        {(task as any).scheduled_time && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3 text-primary/60" />
                            <span className="text-[10px] font-bold text-primary/80 uppercase">@{ (task as any).scheduled_time }</span>
                          </div>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{task.description}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col justify-center gap-2 p-3 bg-surface-low border-l border-outline-variant/20 shrink-0">
                    <button 
                      onClick={() => updateTaskStatus(task.id, completed ? 'pending' : 'done')}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center border transition-all active:scale-90",
                        completed 
                          ? "bg-primary text-black border-transparent" 
                          : "bg-surface-highest border-outline-variant text-primary hover:bg-primary hover:text-black"
                      )}
                    >
                      <Check size={16} strokeWidth={completed ? 3 : 2} />
                    </button>
                    {!completed && (
                      <button 
                        onClick={() => {
                          if (user?.id) skipTask(task.id, user.id)
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-surface-highest border border-outline-variant text-warning hover:bg-warning hover:text-black transition-all active:scale-90"
                      >
                        <FastForward size={16} strokeWidth={2} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </section>

      </main>
    </div>
  )
}

function TerminalIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a3a6ff" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <polyline points="4 17 10 11 4 5"></polyline>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
  )
}
