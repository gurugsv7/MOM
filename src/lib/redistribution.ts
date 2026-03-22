/**
 * Redistribution Algorithm — core missed-day logic.
 * Pure / testable — no side effects, no imports from Supabase.
 */

export interface Task {
  id: string
  goal_day_id: string
  user_id: string
  title: string
  description: string | null
  estimated_minutes: number
  status: 'pending' | 'done' | 'skipped'
  redistributed: boolean
  original_day_number: number | null
  display_order: number
}

export interface GoalDay {
  id: string
  goal_id: string
  user_id: string
  day_number: number
  scheduled_date: string
  status: 'pending' | 'completed' | 'missed' | 'partial'
  tasks?: Task[]
}

export interface RedistributionResult {
  updatedDays: Array<{ dayId: string; tasks: Partial<Task>[] }>
  overloadWarning: boolean
  overloadedDayNumbers: number[]
}

export function redistribute(
  missedDayNumber: number,
  missedTasks: Task[],
  remainingDays: GoalDay[],
  dailyBudgetMinutes: number
): RedistributionResult {
  if (missedTasks.length === 0) {
    return { updatedDays: [], overloadWarning: false, overloadedDayNumbers: [] }
  }

  const futureDays = remainingDays.filter((d) => d.day_number > missedDayNumber)

  if (futureDays.length === 0) {
    return { updatedDays: [], overloadWarning: true, overloadedDayNumbers: [] }
  }

  // Front-weighted distribution: earlier days get more tasks
  const weights = futureDays.map((_, i) => futureDays.length - i)
  const totalWeight = weights.reduce((a, b) => a + b, 0)

  const taskSlots: Task[][] = futureDays.map(() => [])
  let taskQueue = [...missedTasks]

  futureDays.forEach((_day, i) => {
    const share = Math.round((weights[i] / totalWeight) * missedTasks.length)
    taskSlots[i] = taskQueue.splice(0, share)
  })

  // Assign any remainder to first day
  if (taskQueue.length > 0) taskSlots[0].push(...taskQueue)

  const overloadedDayNumbers: number[] = []
  const updatedDays = futureDays.map((day, i) => {
    const existingMinutes = (day.tasks ?? [])
      .filter((t) => t.status === 'pending')
      .reduce((sum, t) => sum + t.estimated_minutes, 0)
    const addedMinutes = taskSlots[i].reduce((sum, t) => sum + t.estimated_minutes, 0)

    if (existingMinutes + addedMinutes > dailyBudgetMinutes * 1.5) {
      overloadedDayNumbers.push(day.day_number)
    }

    return {
      dayId: day.id,
      tasks: taskSlots[i].map((t) => ({
        ...t,
        redistributed: true,
        original_day_number: missedDayNumber,
      })),
    }
  })

  return {
    updatedDays,
    overloadWarning: overloadedDayNumbers.length > 0,
    overloadedDayNumbers,
  }
}
