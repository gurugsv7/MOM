import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useGoalsStore } from '@/stores/goalsStore'
import { useUIStore } from '@/stores/uiStore'
import { supabase } from '@/lib/supabase'
import { generateRoadmap } from '@/lib/azure'
import { cn } from '@/lib/utils'
import { Plus, ChevronDown, ChevronUp, Target, Calendar, Zap } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import type { GoalCategory } from '@/types/supabase'

const CATEGORIES: { value: GoalCategory; label: string; emoji: string }[] = [
  { value: 'fitness', label: 'FITNESS', emoji: '💪' },
  { value: 'diet', label: 'DIET', emoji: '🥗' },
  { value: 'exam', label: 'EXAM', emoji: '📚' },
  { value: 'skill', label: 'SKILL', emoji: '🎯' },
  { value: 'habit', label: 'HABIT', emoji: '🔄' },
  { value: 'custom', label: 'CUSTOM', emoji: '⚡' },
]

const GOAL_COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#0ea5e9', '#ef4444']

function NewGoalModal({ onClose, onCreated, initialGoal, goals }: { onClose: () => void; onCreated: () => void; initialGoal?: any; goals: any[] }) {
  const { user } = useAuthStore()
  const { addToast } = useUIStore()
  const [form, setForm] = useState({
    title: initialGoal?.title || '',
    category: initialGoal?.category || 'habit' as GoalCategory,
    description: initialGoal?.description || '',
    deadline: initialGoal?.deadline || '',
    daily_budget_minutes: initialGoal?.daily_budget_minutes || 60,
    color: initialGoal?.color || GOAL_COLORS[0],
  })
  const [step, setStep] = useState<'form' | 'generating' | 'preview'>('form')
  const [roadmapData, setRoadmapData] = useState<Awaited<ReturnType<typeof generateRoadmap>> | null>(null)

  const cumulativeLoad = (goals || [])
    .filter((g: any) => g.status === 'active' && (!initialGoal || g.id !== initialGoal.id))
    .reduce((sum: number, g: any) => sum + (g.daily_budget_minutes || 0), 0)

  const totalLoad = cumulativeLoad + (form.daily_budget_minutes || 0)
  const isOverloaded = totalLoad > 480 // 8 hours soft limit

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setStep('generating')

    try {
      const daysTotal = differenceInDays(new Date(form.deadline), new Date())
      if (daysTotal < 1) throw new Error('Deadline must be in the future')

      const roadmap = await generateRoadmap(
        form.title, form.category, 
        `${form.description}\n\n[STRATEGIC CONTEXT]: User already has ${cumulativeLoad}m/day of active goals. Plan efficiently. If total exceeds 480m, suggest trimming.`,
        form.deadline, daysTotal, form.daily_budget_minutes
      )
      setRoadmapData(roadmap)
      setStep('preview')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation failed'
      addToast(msg, 'error')
      setStep('form')
    }
  }

  const handleConfirm = async () => {
    if (!user || !roadmapData) return

    let goalId = initialGoal?.id;

    if (initialGoal) {
      const { error: uErr } = await supabase
        .from('goals')
        .update({ ...form })
        .eq('id', initialGoal.id);
      if (uErr) { addToast('Shields failed: Could not update mission.', 'error'); return; }
      
      // Clear existing future days if regenerating
      await supabase.from('goal_days').delete().eq('goal_id', initialGoal.id).gt('scheduled_date', format(new Date(), 'yyyy-MM-dd'));
    } else {
      const { data: goal, error: gErr } = await supabase
        .from('goals')
        .insert({ ...form, user_id: user.id, status: 'active' })
        .select()
        .single();
      
      if (gErr || !goal) { addToast('Deployment failure: Mission not saved.', 'error'); return; }
      goalId = goal.id;
    }

    for (const day of roadmapData.days) {
      const scheduledDate = new Date()
      scheduledDate.setDate(scheduledDate.getDate() + day.day_number - 1)

      const { data: gDay } = await supabase
        .from('goal_days')
        .insert({ goal_id: goalId, user_id: user.id, day_number: day.day_number, scheduled_date: format(scheduledDate, 'yyyy-MM-dd'), status: 'pending' })
        .select()
        .single()

      if (gDay) {
        await supabase.from('tasks').insert(
          day.tasks.map((t, i) => ({
            goal_day_id: gDay.id, user_id: user.id,
            title: t.title, description: t.description,
            estimated_minutes: t.estimated_minutes,
            status: 'pending', redistributed: false,
            original_day_number: null, display_order: i,
          }))
        )
      }
    }

    addToast('Goal created! Your roadmap is ready.', 'success')
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-surface border-t border-outline-variant pb-8 pt-6 px-6 animate-slide-up max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">
            {step === 'form' ? 'NEW MISSION' : step === 'generating' ? 'AI GENERATING...' : 'ROADMAP PREVIEW'}
          </h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface text-lg">✕</button>
        </div>

        {step === 'form' && (
          <form onSubmit={handleGenerate} className="space-y-4">
            <input
              className="w-full bg-surface-highest text-on-surface placeholder-on-surface-variant/40 px-3 py-2 text-sm border-b border-outline-variant focus:border-primary transition-colors"
              style={{ outline: 'none', borderRadius: 0 }}
              placeholder="Goal title..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />

            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map((c) => (
                <button key={c.value} type="button"
                  onClick={() => setForm({ ...form, category: c.value })}
                  className={cn(
                    'py-2 text-[9px] font-bold uppercase tracking-wider transition-colors',
                    form.category === c.value
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-high text-on-surface-variant hover:text-on-surface'
                  )}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>

            <textarea
              className="w-full bg-surface-highest text-on-surface placeholder-on-surface-variant/40 px-3 py-2 text-sm border-b border-outline-variant focus:border-primary transition-colors resize-none"
              style={{ outline: 'none', borderRadius: 0 }}
              placeholder="Context / description (helps AI plan better)..."
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] uppercase tracking-widest text-on-surface-variant">Deadline</label>
                <input type="date"
                  className="w-full bg-surface-highest text-on-surface px-3 py-2 text-sm border-b border-outline-variant focus:border-primary transition-colors"
                  style={{ outline: 'none', borderRadius: 0 }}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-widest text-on-surface-variant">Daily Budget (min)</label>
                <input type="number"
                  className="w-full bg-surface-highest text-on-surface px-3 py-2 text-sm border-b border-outline-variant focus:border-primary transition-colors"
                  style={{ outline: 'none', borderRadius: 0 }}
                  min={15} max={480} step={15}
                  value={form.daily_budget_minutes}
                  onChange={(e) => setForm({ ...form, daily_budget_minutes: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              {GOAL_COLORS.map((c) => (
                <button key={c} type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={cn('w-5 h-5 transition-transform', form.color === c && 'scale-125 ring-1 ring-primary/50')}
                  style={{ background: c, borderRadius: 0 }} />
              ))}
            </div>

            {/* Burnout Shield Warning */}
            {isOverloaded && (
              <div className="bg-primary/10 border border-primary/20 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest">Strategic Overload Risk</p>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">
                  Total daily load: <span className="text-primary font-bold">{Math.floor(totalLoad / 60)}h {totalLoad % 60}m</span>. 
                  MOM suggests capping this mission at <span className="text-white">{(480 - cumulativeLoad)}m</span> or scaling back intensity.
                </p>
              </div>
            )}

            <button type="submit"
              className="w-full py-3 bg-gradient-to-r from-primary to-primary/80 text-black text-xs font-black uppercase tracking-widest btn-press"
              style={{ borderRadius: 0 }}>
              <Zap size={12} className="inline mr-2" />
              GENERATE ROADMAP WITH AI
            </button>
          </form>
        )}

        {step === 'generating' && (
          <div className="text-center py-10 space-y-4">
            <div className="w-12 h-12 mx-auto border-2 border-primary border-t-transparent animate-spin" style={{ borderRadius: 0 }} />
            <p className="text-on-surface-variant text-sm">Azure OpenAI is planning your roadmap...</p>
            <p className="text-on-surface-variant/60 text-xs">This may take up to 10 seconds</p>
          </div>
        )}

        {step === 'preview' && roadmapData && (
          <div className="space-y-4">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">
              {roadmapData.days.length} days · {roadmapData.days.reduce((s, d) => s + d.tasks.length, 0)} tasks generated
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {roadmapData.days.slice(0, 5).map((d) => (
                <div key={d.day_number} className="bg-surface-high px-3 py-2">
                  <p className="text-[10px] font-bold text-primary uppercase">Day {d.day_number}</p>
                  {d.tasks.map((t, i) => (
                    <p key={i} className="text-xs text-on-surface truncate">{t.title} <span className="text-on-surface-variant/60">~{t.estimated_minutes}m</span></p>
                  ))}
                </div>
              ))}
              {roadmapData.days.length > 5 && (
                <p className="text-[10px] text-on-surface-variant text-center">+{roadmapData.days.length - 5} more days...</p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('form')} className="flex-1 py-2 border border-outline-variant text-on-surface-variant text-xs uppercase tracking-widest btn-press" style={{ borderRadius: 0 }}>
                REGENERATE
              </button>
              <button onClick={handleConfirm} className="flex-1 py-2 bg-primary text-black text-xs font-black uppercase tracking-widest btn-press" style={{ borderRadius: 0 }}>
                CONFIRM
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function GoalsPage() {
  const { user } = useAuthStore()
  const { goals, fetchGoals, isLoading } = useGoalsStore()
  const { addToast } = useUIStore()
  const [showNewGoal, setShowNewGoal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<any | null>(null)
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null)
  const [intelInput, setIntelInput] = useState<Record<string, string>>({})
  const [isUpdatingIntel, setIsUpdatingIntel] = useState<string | null>(null)

  const load = useCallback(() => {
    if (user) fetchGoals(user.id)
  }, [user, fetchGoals])

  useEffect(() => { load() }, [load])

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-on-surface">MISSIONS</h2>
          <button
            onClick={() => setShowNewGoal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-black text-[10px] font-black uppercase tracking-widest btn-press"
            style={{ borderRadius: 0 }}>
            <Plus size={12} /> NEW
          </button>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent mt-3" />
      </header>

      <div className="flex-1 px-5 pt-4 pb-24">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-surface-high animate-pulse" />)}
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-16">
            <Target size={36} className="mx-auto text-on-surface-variant/40 mb-4" />
            <p className="text-on-surface-variant text-sm">No active missions.</p>
            <p className="text-on-surface-variant/60 text-xs mt-1">Create your first goal to begin.</p>
          </div>
        ) : (
          <div className="space-y-2 animate-fade-in">
            {goals.map((goal) => (
              <div key={goal.id} className="bg-surface-high overflow-hidden border border-outline-variant/10">
                <button
                  className="w-full flex items-center gap-3 px-4 py-4 text-left"
                  onClick={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}>
                  <div className="w-1.5 h-10 flex-shrink-0 shadow-sm" style={{ background: goal.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{goal.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant">{goal.category}</span>
                      <span className="flex items-center gap-0.5 text-[10px] text-on-surface-variant/60">
                        <Calendar size={9} />
                        {format(new Date(goal.deadline), 'dd MMM yyyy')}
                      </span>
                    </div>
                  </div>
                  {expandedGoal === goal.id ? <ChevronUp size={14} className="text-on-surface-variant" /> : <ChevronDown size={14} className="text-on-surface-variant" />}
                </button>
                {expandedGoal === goal.id && (
                  <div className="px-5 pb-5 bg-surface-low animate-slide-up border-t border-outline-variant/10 space-y-6">
                    {/* Mission Intelligence */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-primary">Tactical Intelligence</p>
                      </div>
                      <div className="bg-surface-highest/50 p-4 border-l-2 border-primary/30 space-y-3">
                        {goal.description ? (
                          <p className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap font-medium">
                            {goal.description}
                          </p>
                        ) : (
                          <p className="text-[10px] text-on-surface-variant/40 italic">Waiting for field operations metadata...</p>
                        )}
                        
                        <div className="flex gap-2 pt-2 border-t border-outline-variant/5">
                          <input 
                            placeholder="Append field intel..."
                            className="flex-1 bg-surface-high border-none text-[10px] px-2 py-1.5 focus:ring-1 focus:ring-primary text-on-surface"
                            value={intelInput[goal.id] || ''}
                            onChange={(e) => setIntelInput({ ...intelInput, [goal.id]: e.target.value })}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                const note = intelInput[goal.id];
                                if (!note || !user) return;
                                setIsUpdatingIntel(goal.id);
                                const newDesc = (goal.description ? goal.description + '\n---\n' : '') + `[INTEL ${format(new Date(), 'HH:mm')}]: ` + note;
                                await supabase.from('goals').update({ description: newDesc }).eq('id', goal.id);
                                setIntelInput({ ...intelInput, [goal.id]: '' });
                                await fetchGoals(user.id);
                                setIsUpdatingIntel(null);
                                addToast('Mission dossier updated.', 'success');
                              }
                            }}
                          />
                          <button 
                            disabled={isUpdatingIntel === goal.id}
                            className="text-[9px] font-black uppercase text-primary hover:text-white transition-colors"
                          >
                           {isUpdatingIntel === goal.id ? 'SYNCING...' : 'COMMIT'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Operational Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-surface-highest p-3 border border-outline-variant/10 shadow-sm">
                        <p className="text-[9px] uppercase font-bold text-on-surface-variant/60 tracking-widest mb-1">Time Allocation</p>
                        <p className="text-sm font-black text-on-surface">{goal.daily_budget_minutes}m<span className="text-[10px] font-normal text-on-surface-variant ml-1">per day</span></p>
                      </div>
                      <div className="bg-surface-highest p-3 border border-outline-variant/10 shadow-sm">
                        <p className="text-[9px] uppercase font-bold text-on-surface-variant/60 tracking-widest mb-1">Operational Window</p>
                        <p className="text-sm font-black text-primary">
                          {Math.max(0, differenceInDays(new Date(goal.deadline), new Date()))}
                          <span className="text-[10px] font-normal text-on-surface-variant ml-1">days remaining</span>
                        </p>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingGoal(goal);
                          setShowNewGoal(true);
                        }}
                        className="flex-1 py-2.5 bg-surface-highest border border-outline-variant/20 text-[10px] font-black uppercase tracking-widest text-on-surface hover:bg-surface-high transition-colors btn-press"
                      >
                        Modify Strategy
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm('Decommission mission? All intelligence will be archived.') && user) {
                            await supabase.from('goals').update({ status: 'archived' }).eq('id', goal.id);
                            fetchGoals(user.id);
                          }
                        }}
                        className="px-4 py-2.5 bg-warning/10 border border-warning/20 text-[10px] font-black uppercase tracking-widest text-warning hover:bg-warning/20 transition-colors btn-press"
                      >
                        Decommission
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showNewGoal && (
        <NewGoalModal 
          onClose={() => {
            setShowNewGoal(false);
            setEditingGoal(null);
          }} 
          onCreated={load} 
          initialGoal={editingGoal}
          goals={goals}
        />
      )}
    </div>
  )
}
