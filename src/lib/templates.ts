import { 
  Dumbbell, 
  Moon, 
  Coffee, 
  Utensils, 
  Brain, 
  Timer, 
  Code, 
  Rocket, 
  Briefcase, 
  BookOpen, 
  Sparkles, 
  Ban, 
  Activity,
  Milestone
} from 'lucide-react'

export interface GoalTemplate {
  id: string
  title: string
  category: string
  description: string
  dailyBudget: number
  durationDays: number
  icon: any
  nichePrompt: string
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: 'weight-loss',
    title: 'Science-Based Weight Loss',
    category: 'Diet',
    description: 'A sustainable, evidence-led approach to fat loss. Focuses on nutrition and steady progress without the burnout.',
    dailyBudget: 45,
    durationDays: 84, // 12 weeks
    icon: Activity,
    nichePrompt: `
      COACHING FOCUS: Health-First Weight Loss.
      PRIORITY: Sustainable habits and metabolic health.
      - Focus on high-protein meals for satiety (1.6g-2.2g per kg).
      - Encourage daily movement (walking/NEAT) over high-intensity cardio.
      - Plan for 3 resistance sessions to keep muscles strong.
      - Suggest flexible weekend strategies.
      - Tone: Supportive, realistic, and expert.
    `
  },
  {
    id: 'muscle-gain',
    title: 'Strength & Muscle Build',
    category: 'Fitness',
    description: 'Build a stronger, more resilient body with smart lifting and optimal recovery.',
    dailyBudget: 75,
    durationDays: 90,
    icon: Dumbbell,
    nichePrompt: `
      COACHING FOCUS: Muscle Growth & Strength.
      PRIORITY: Safe lifting and consistent progress.
      - Prioritize compound movements like squats and presses.
      - Focus on form quality and steady overload (more reps or slightly more weight).
      - Include recovery weeks every 4-5 weeks.
      - Tone: Motivating, technical but clear, and steady.
    `
  },
  {
    id: 'maintain-fitness',
    title: 'Stay Fit & Healthy',
    category: 'Fitness',
    description: 'Keep your momentum going. A balanced plan to maintain your current fitness during busy weeks.',
    dailyBudget: 30,
    durationDays: 30,
    icon: Activity,
    nichePrompt: `
      COACHING FOCUS: Long-term Fitness Sustainability.
      PRIORITY: Consistency over intensity.
      - Focus on the 'Minimum Effective Dose' to stay healthy.
      - Daily movement targets and basic strength maintenance.
      - Tone: Practical and encouraging.
    `
  },
  {
    id: 'morning-routine',
    title: 'Perfect Morning Routine',
    category: 'Habit',
    description: 'Start your day with clarity and focus. Align your internal clock for natural energy throughout the day.',
    dailyBudget: 45,
    durationDays: 21,
    icon: Coffee,
    nichePrompt: `
      COACHING FOCUS: Energy and Focus Management.
      PRIORITY: Morning sunlight, hydration, and deep work priming.
      - Suggest early light exposure to wake up the brain.
      - Guide them to do their hardest task first.
      - Tone: Calm, focused, and guiding.
    `
  },
  {
    id: 'programming',
    title: 'Master a New Language',
    category: 'Skills',
    description: 'Learn to code by building. Move from syntax to a working project with hands-on exercises.',
    dailyBudget: 120,
    durationDays: 45,
    icon: Code,
    nichePrompt: `
      MENTOR FOCUS: Practical Coding Skills.
      PRIORITY: Building real things quickly.
      - Focus 80% on coding and 20% on tutorials.
      - Suggest small wins and daily commits.
      - Tone: Encouraging, logical, and project-oriented.
    `
  },
  {
    id: 'startup',
    title: 'Build Your Startup MVP',
    category: 'Business',
    description: 'Turn your idea into a working reality. A surgical focus on core features and user feedback.',
    dailyBudget: 180,
    durationDays: 42,
    icon: Rocket,
    nichePrompt: `
      ADVISOR FOCUS: Lean Startup & Launch.
      PRIORITY: Speed to value and user feedback.
      - Focus on the single most important feature (The Happy Path).
      - Avoid over-engineering. 'Done is better than perfect.'
      - Tone: Dynamic, focused, and strategic.
    `
  },
  {
    id: 'read-books',
    title: 'Reading Habit Master',
    category: 'Mindset',
    description: 'Reclaim your focus and read more books. Build a deep reading habit that lasts.',
    dailyBudget: 30,
    durationDays: 30,
    icon: BookOpen,
    nichePrompt: `
      COACHING FOCUS: Deep Focus & Literacy.
      PRIORITY: Consistent page counts and distraction-free time.
      - Suggest 'Digital Detox' windows for reading.
      - Tone: Reflective, steady, and insightful.
    `
  },
  {
    id: 'sleep-fix',
    title: 'Perfect Sleep Fix',
    category: 'Health',
    description: 'Fix your sleep schedule and wake up refreshed. Calibrate your body clock for better rest.',
    dailyBudget: 20,
    durationDays: 14,
    icon: Moon,
    nichePrompt: `
      COACHING FOCUS: Sleep Quality & Circadian Rhythm.
      PRIORITY: Wind-down rituals and consistent sleep windows.
      - Focus on evening environment (light/temperature).
      - Tone: Soothing, science-backed but gentle.
    `
  }
]
