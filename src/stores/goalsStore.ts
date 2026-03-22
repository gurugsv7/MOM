import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { redistribute } from '@/lib/redistribution'
import { generateRoadmap } from '@/lib/azure'
import type { Database } from '@/types/supabase'

type Goal = Database['public']['Tables']['goals']['Row']
type Task = Database['public']['Tables']['tasks']['Row']
type GoalDay = Database['public']['Tables']['goal_days']['Row']

interface GoalsState {
  goals: Goal[]
  todayTasks: Array<Task & { goal: Goal }>
  isLoading: boolean
  fetchGoals: (userId: string) => Promise<void>
  fetchTodayTasks: (userId: string) => Promise<void>
  updateTaskStatus: (taskId: string, status: 'done' | 'skipped' | 'pending') => Promise<void>
  skipTask: (taskId: string, userId: string) => Promise<void>
  rescheduleTask: (taskId: string, newTime: string) => Promise<void>
  redistributeMissedTasks: (userId: string) => Promise<boolean>
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  todayTasks: [],
  isLoading: false,

  rescheduleTask: async (taskId: string, newTime: string) => {
    try {
      await supabase.from('tasks').update({ scheduled_time: newTime }).eq('id', taskId)
      set((state) => ({
        todayTasks: state.todayTasks.map(t => 
          t.id === taskId ? { ...t, scheduled_time: newTime } : t
        )
      }))
    } catch (error) {
      console.error('Error rescheduling task:', error)
    }
  },

  fetchGoals: async (userId: string) => {
    set({ isLoading: true })
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (!error && data) set({ goals: data })
    set({ isLoading: false })
  },

  fetchTodayTasks: async (userId: string) => {
    // 1. Detect and handle missed days first
    const shifted = await get().redistributeMissedTasks(userId)
    if (shifted) {
      // Accessing UI store to notify user
      const { useUIStore } = await import('@/stores/uiStore')
      useUIStore.getState().addToast('Yesterday session missed. Roadmap updated! 🚀', 'info')
    }

    const today = new Date().toISOString().split('T')[0]

    const { data: dayData } = await supabase
      .from('goal_days')
      .select('id, goal_id')
      .eq('user_id', userId)
      .eq('scheduled_date', today)

    if (!dayData || dayData.length === 0) {
      set({ todayTasks: [] })
      return
    }

    const dayIds = dayData.map((d: any) => d.id)
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .in('goal_day_id', dayIds)
      .eq('user_id', userId)
      .order('display_order')

    const { goals } = get()
    const goalMap = new Map(goals.map((g: any) => [g.id, g]))
    const goalIdMap = new Map(dayData.map((d: any) => [d.id, d.goal_id]))

    const enriched = (tasks ?? []).map((t: any) => ({
      ...t,
      goal: goalMap.get(goalIdMap.get(t.goal_day_id) ?? '') ?? ({} as Goal),
    }))

    set({ todayTasks: enriched as any })
  },

  updateTaskStatus: async (taskId: string, status: 'done' | 'skipped' | 'pending') => {
    // 1. Update task in DB
    await supabase.from('tasks').update({ status }).eq('id', taskId)

    // Momentum shift: Success = +5, Failure/Undo = adjustment
    if (status === 'done') {
      const task = get().todayTasks.find(t => t.id === taskId)
      const goal = get().goals.find((g: any) => g.id === (task as any)?.goal?.id)
      if (goal) {
        await supabase.rpc('increment_momentum', { goal_id: goal.id, amount: 5 })
      }
    }
    
    // 2. Local state update
    set((state) => ({
      todayTasks: state.todayTasks.map((t) =>
        t.id === taskId ? { ...t, status } : t
      ),
    }))

    // 3. Goal Day update (completed/partial)
    const task = get().todayTasks.find(t => t.id === taskId)
    if (task) {
      const dayTasks = get().todayTasks.filter(t => t.goal_day_id === task.goal_day_id)
      const allDone = dayTasks.every(t => t.status === 'done' || t.status === 'skipped')
      const someDone = dayTasks.some(t => t.status === 'done')
      
      const dayStatus = allDone ? 'completed' : (someDone ? 'partial' : 'pending')
      await supabase.from('goal_days').update({ status: dayStatus }).eq('id', task.goal_day_id)
    }
  },

  skipTask: async (taskId: string, userId: string) => {
    // 1. Fetch task and its current day
    const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single()
    if (!task) return

    const { data: currentDay } = await supabase.from('goal_days').select('*').eq('id', task.goal_day_id).single()
    if (!currentDay) return

    // 2. Fetch future days for this goal
    const { data: futureDays } = await supabase
      .from('goal_days')
      .select('*, tasks(*)')
      .eq('goal_id', task.goal_id)
      .gt('day_number', currentDay.day_number)
      .order('day_number', { ascending: true })

    if (!futureDays || futureDays.length === 0) {
      // No future days? Just mark skipped
      await get().updateTaskStatus(taskId, 'skipped')
      return
    }

    // 3. Redistribute this single task into future days
    const result = redistribute(currentDay.day_number, [task], futureDays as any, 180)

    // 4. Update the DB: original task is 'skipped'
    await supabase.from('tasks').update({ status: 'skipped' }).eq('id', taskId)

    // 5. Create new tasks in future days
    for (const update of result.updatedDays) {
      if (update.tasks.length > 0) {
        for (const t of update.tasks) {
          const { id, ...newTask } = t as any
          await supabase.from('tasks').insert({
            ...newTask,
            title: `[DELAYED] ${newTask.title}`, // AI context would go here
            goal_day_id: update.dayId,
            user_id: userId,
            status: 'pending',
            redistributed: true,
            original_day_number: currentDay.day_number
          })
        }
      }
    }

    await get().fetchTodayTasks(userId)
  },

  redistributeMissedTasks: async (userId: string) => {
    const today = new Date().toISOString().split('T')[0]
    let shifted = false

    // 1. Fetch missed days (pending days in the past)
    const { data: missedDays } = await supabase
      .from('goal_days')
      .select('*, tasks(*)')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lt('scheduled_date', today)
      .order('scheduled_date', { ascending: true })

    if (!missedDays || missedDays.length === 0) return false

    for (const day of missedDays) {
      const pendingTasks = (day.tasks ?? []).filter((t: any) => t.status === 'pending')
      
      if (pendingTasks.length > 0) {
        // Fetch future days for AI context
        const { data: futureDays } = await supabase
          .from('goal_days')
          .select('id, day_number, scheduled_date')
          .eq('goal_id', day.goal_id)
          .gt('scheduled_date', today)
          .order('day_number', { ascending: true })

        if (futureDays && futureDays.length > 0) {
          const { data: goal } = await supabase.from('goals').select('*').eq('id', day.goal_id).single()
          const { data: profile } = await supabase.from('profiles').select('unavailability_schedule').eq('id', userId).single()
          
          if (goal) {
            shifted = true;
            const tone = goal.momentum_score < 70 ? 'simplify' : (goal.momentum_score > 130 ? 'accelerate' : 'normal')

            // AI Regeneration of the remaining roadmap
            const roadmap = await generateRoadmap(
              goal.title, goal.category, 
              `ADAPTIVE SHIFT: User missed Day ${day.day_number}. REBUILD the plan for the remaining ${futureDays.length} days. Momentum is ${tone.toUpperCase()}. If simplify, make tasks significantly easier to rebuild confidence.`,
              goal.deadline, futureDays.length, goal.daily_budget_minutes,
              tone, profile?.unavailability_schedule || []
            )

            // Clear old future tasks to prevent duplicates
            const futureDayIds = futureDays.map((d: any) => d.id)
            await supabase.from('tasks').delete().in('goal_day_id', futureDayIds)

            for (let i = 0; i < roadmap.days.length; i++) {
              const aiDay = roadmap.days[i]
              const dbDayId = futureDays[i]?.id
              if (!dbDayId) continue

              await supabase.from('tasks').insert(aiDay.tasks.map((t: any, idx: number) => ({
                goal_day_id: dbDayId, user_id: userId,
                title: t.title, description: t.description,
                estimated_minutes: t.estimated_minutes,
                scheduled_time: t.scheduled_time || 'TBD',
                status: 'pending', redistributed: true,
                original_day_number: day.day_number, display_order: idx
              })))
            }
            await supabase.rpc('increment_momentum', { goal_id: day.goal_id, amount: -15 })
          }
        }
        
        // Mark pending tasks in missed day as 'skipped' so they don't reappear
        await supabase.from('tasks').update({ status: 'skipped' }).eq('goal_day_id', day.id).eq('status', 'pending')
      }

      // Mark day as 'missed'
      await supabase.from('goal_days').update({ status: 'missed' }).eq('id', day.id)
    }
    return shifted
  }
}))
