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
    title: 'Precision Weight Loss',
    category: 'Fitness',
    description: 'A strategy focused on calorie deficit, progressive cardio, and consistent movement.',
    dailyBudget: 45,
    durationDays: 30,
    icon: Activity,
    nichePrompt: 'Focus on calorie-burning activities, HIIT, and tracking nutritional consistency. Avoid high-stress resistance training early on.'
  },
  {
    id: 'muscle-gain',
    title: 'Hypertrophy / Bulk',
    category: 'Fitness',
    description: 'Mechanical tension and volume-based training to build functional muscle mass.',
    dailyBudget: 75,
    durationDays: 60,
    icon: Dumbbell,
    nichePrompt: 'Focus on compound lifts, progressive overload (weights/reps), and protein-centric recovery windows.'
  },
  {
    id: 'sleep-fix',
    title: 'Sleep Schedule Reset',
    category: 'Health',
    description: 'Circadian rhythm calibration to fix your internal clock and morning energy.',
    dailyBudget: 30,
    durationDays: 14,
    icon: Moon,
    nichePrompt: 'Focus on blue-light exclusion zones, magnesium-rich routines, and consistent morning sun exposure.'
  },
  {
    id: 'morning-routine',
    title: 'Standard Morning Routine',
    category: 'Productivity',
    description: 'Build a solid start to your day with hydration, movement, and deep work prep.',
    dailyBudget: 60,
    durationDays: 21,
    icon: Coffee,
    nichePrompt: 'Focus on non-negotiable anchors like hydration, stretching, and removing phone usage for the first 90 minutes.'
  },
  {
    id: 'clean-eating',
    title: 'Clean Eating / Meal Prep',
    category: 'Health',
    description: 'Transition to whole foods and master the art of weekly meal preparation.',
    dailyBudget: 40,
    durationDays: 28,
    icon: Utensils,
    nichePrompt: 'Focus on eliminating processed sugars, ingredient transparency, and bulk-cooking efficiency.'
  },
  {
    id: 'meditation',
    title: 'Mindfulness & Meditation',
    category: 'Wellness',
    description: 'Develop daily mental clarity through guided practice and presence training.',
    dailyBudget: 15,
    durationDays: 21,
    icon: Brain,
    nichePrompt: 'Focus on breathwork variants, progressive duration, and non-judgmental awareness exercises.'
  },
  {
    id: 'run-5k',
    title: 'Run a 5K / 10K',
    category: 'Fitness',
    description: 'From zero to race-ready using a structured aerobic base-building protocol.',
    dailyBudget: 40,
    durationDays: 45,
    icon: Timer,
    nichePrompt: 'Focus on the Couch-to-5K interval method, zone 2 aerobic base building, and joint stability drills.'
  },
  {
    id: 'learn-code',
    title: 'Learn Code (JS/TS)',
    category: 'Skills',
    description: 'Master modern full-stack development through project-based learning.',
    dailyBudget: 120,
    durationDays: 90,
    icon: Code,
    nichePrompt: 'Focus on syntax fundamentals, logic exercises, and building minimal feature prototypes every week.'
  },
  {
    id: 'build-mvp',
    title: 'Startup MVP Launch',
    category: 'Business',
    description: 'Ship your core feature to users and validate your product-market fit.',
    dailyBudget: 180,
    durationDays: 30,
    icon: Rocket,
    nichePrompt: 'Focus on "Boring Tech," core user flow completion, and removing all non-essential features.'
  },
  {
    id: 'freelance-delivery',
    title: 'Freelance Project Sync',
    category: 'Business',
    description: 'Managing a client project from discovery to final handoff.',
    dailyBudget: 240,
    durationDays: 14,
    icon: Briefcase,
    nichePrompt: 'Focus on milestone clarity, communication buffers, and polish before delivery.'
  },
  {
    id: 'read-books',
    title: 'Deep Reading (Habit)',
    category: 'Mindset',
    description: 'Reclaim your focus and finish those 12 books you bought this year.',
    dailyBudget: 30,
    durationDays: 30,
    icon: BookOpen,
    nichePrompt: 'Focus on environment design (dark room/no distraction), note-taking methods, and page-count targets.'
  },
  {
    id: 'habit-builder',
    title: 'Generic Habit Stack',
    category: 'General',
    description: 'Building a new neural pathway using atomic habits and clear cues.',
    dailyBudget: 20,
    durationDays: 66,
    icon: Sparkles,
    nichePrompt: 'Focus on cue identification, friction reduction, and immediate reward association.'
  },
  {
    id: 'quit-habit',
    title: 'Quit Bad Habit',
    category: 'Health',
    description: 'A scientifically backed method to remove dependency and replace friction.',
    dailyBudget: 30,
    durationDays: 90,
    icon: Ban,
    nichePrompt: 'Focus on trigger auditing, replacement habits, and environment-level friction (temptation removal).'
  }
]
