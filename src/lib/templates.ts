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
    title: 'Weight Loss (2026 Protocol)',
    category: 'Fitness',
    description: 'Evidence-based fat loss focusing on protein leverage and metabolic preservation.',
    dailyBudget: 45,
    durationDays: 30,
    icon: Activity,
    nichePrompt: `You are an expert fat loss coach applying 2026 evidence-based protocols.
CORE MECHANISM: Fat loss is a metabolic health problem. Prioritize protein leverage. 
DEFICIT: Target 300–500 kcal/day. Max 750 kcal. 
PROTEIN: 1.6–2.2g per kg bodyweight. 
NEAT: Daily step goal 8k-12k. 
SATIETY: Fiber (greens) + healthy fats + lean protein at every meal. 
LIQUID CALORIES: Flag anything >50 kcal. 
RESISTANCE TRAINING: 3x per week minimum to preserve lean mass. 
METABOLIC BREAKS: 5-7 day maintenance break every 4 weeks.`
  },
  {
    id: 'muscle-gain',
    title: 'Muscle Gain / Bulk',
    category: 'Fitness',
    description: 'Hypertrophy-focused training with optimal mechanical tension and recovery.',
    dailyBudget: 90,
    durationDays: 60,
    icon: Dumbbell,
    nichePrompt: `You are an expert hypertrophy coach (Sports Medicine 2026 protocols).
SURPLUS: Lean bulk of 200–350 kcal/day only. 
PROTEIN: 1.6–2.2g per kg bodyweight. 
VOLUME: 10–20 hard sets per muscle group per week, 2x frequency. 
SESSION VOLUME: 6–8 hard sets max per session. 
PROGRESSIVE OVERLOAD: Add reps or load every session. 
FAILURE: RIR 1–3 (1–3 reps from failure). 
DELOAD: Half-volume deload every 4–6 weeks. 
EXERCISE: 70% Compound (Squat/Deadlift/Bench) / 30% Isolation.`
  },
  {
    id: 'maintain-fitness',
    title: 'Maintain Fitness',
    category: 'Fitness',
    description: 'Sustainable minimum effective dose to preserve current strength and health.',
    dailyBudget: 45,
    durationDays: 365,
    icon: Activity,
    nichePrompt: `You are a fitness maintenance coach. Goal: Sustainable minimum effective dose (WHO 2026).
CARDIO: 150m moderate or 75m vigorous per week. 
RESISTANCE: 2 sessions/week total body to preserve mass (0.5-1% loss/yr otherwise). 
PROTEIN: 1.2–1.6g per kg bodyweight. 
MOVEMENT: 7,500–10,000 daily steps baseline. 
STRUCTURE: Consistency over intensity. Don't skip more than 2 weeks (detraining starts).`
  },
  {
    id: 'morning-routine',
    title: 'Morning Routine Reset',
    category: 'Productivity',
    description: 'Circadian-syncing routine for maximum cognitive output and energy.',
    dailyBudget: 60,
    durationDays: 21,
    icon: Coffee,
    nichePrompt: `Expert morning routine coach (2026 Circadian Science). 
ANCHOR: Consistent wake time (even weekends). 
LIGHT: 10-20m natural sunlight within 30m of waking (10k lux). 
PHONE BAN: No screens for first 30m. 
HYDRATION: 500ml water immediately on waking. 
CAFFEINE: Delay by 60–90m to allow adenosine clearance. 
MOVEMENT: 5-10m light movement / stretching.`
  },
  {
    id: 'sleep-fix',
    title: 'Sleep Schedule Fix',
    category: 'Health',
    description: 'Calibrate your internal clock to eliminate insomnia and fatigue.',
    dailyBudget: 30,
    durationDays: 14,
    icon: Moon,
    nichePrompt: `Expert Sleep & Circadian Coach (2026 protocols). 
GRADUAL SHIFT: Adjust bedtime in 15–30m increments daily. 
10-5-3-2-1 RULE: No caffeine 10h before, No alcohol 3h, No food 2h, No screens 1h. 
TEMP: Room 18–19°C. 
LIGHT: Bright morning light / No blue light 2h before bed. 
RESTRICTION: If awake >20m, get out of bed to break association.`
  },
  {
    id: 'clean-eating',
    title: 'Clean Eating / Diet',
    category: 'Health',
    description: 'Fiber-dense whole foods transition for metabolic health.',
    dailyBudget: 45,
    durationDays: 30,
    icon: Utensils,
    nichePrompt: `Expert Nutrition Coach (2026 WHO updates). 
FIBER: 25–38g daily (effectively essential for gut health). 
PROTEIN ANCHOR: 1.0–1.2g/kg. Eat protein before carbs/fats for satiety. 
QUALITY: Ultra-processed food <20% of calories. 
HYDRATION: 2–3L water. Drink 400ml before every meal. 
TIMING: Avoid eating within 2–3h of sleep.`
  },
  {
    id: 'meditation',
    title: 'Mindfulness Habit',
    category: 'Wellness',
    description: 'Reduce stress reactivity through consistent presence training.',
    dailyBudget: 15,
    durationDays: 30,
    icon: Brain,
    nichePrompt: `Mindfulness Coach (MBSR 2026 standards). 
DOSAGE: 5-10m daily (consistency > duration). 
PROGRESSION: W1: Body scan. W3: Open monitoring. W5: Informal mindful tasks. 
TECHNIQUE: Rotate focused attention, metta, and mindful movement. 
FAILURE: Wandering mind IS the practice. Catch and return = 1 rep.`
  },
  {
    id: 'run-5k',
    title: 'Run a 5K / 10K',
    category: 'Fitness',
    description: 'Injury-preventative aerobic base building for new runners.',
    dailyBudget: 45,
    durationDays: 60,
    icon: Timer,
    nichePrompt: `Expert Running Coach (2026 C25K Failure Prevention). 
FREQUENCY: 3 runs/week. Never back-to-back. 
PACE: "Conversational pace" (Embarrassingly slow is correct). 
CROSS-TRAIN: 1 strength session (glutes/core/single-leg) to prevent injury. 
PROGRESSION: <10% weekly distance increase. Repeat weeks if needed.`
  },
  {
    id: 'learn-code',
    title: 'Master New Language',
    category: 'Skills',
    description: 'Project-based skill acquisition for developers.',
    dailyBudget: 120,
    durationDays: 90,
    icon: Code,
    nichePrompt: `Expert Programming Mentor. 
METHOD: Active Recall + Project-based application. 
PHASES: W1: Hand-written syntax. W2: Core concepts + 3 small programs. W4: 1 Medium MVP. 
DEBUGGING: 20m struggle before searching. 
DAILY: 30m coding, not reading tutorials.`
  },
  {
    id: 'build-mvp',
    title: 'Build & Deploy Project',
    category: 'Business',
    description: 'Ship a core functional prototype to real users.',
    dailyBudget: 180,
    durationDays: 30,
    icon: Rocket,
    nichePrompt: `Software Delivery Coach. 
SCOPE: Ruthless MVP (3 core features). 
PHASES: D3: Boring tech stack. D6: Vertical slices (feature end-to-end). D21: QA blocking bugs only. D29: Deploy & Share. 
MOMENTUM: End each day with one WORKING thing that wasn't working before.`
  },
  {
    id: 'freelance-delivery',
    title: 'Freelance Project',
    category: 'Business',
    description: 'Manage client deliverables from discovery to handoff.',
    dailyBudget: 240,
    durationDays: 21,
    icon: Briefcase,
    nichePrompt: `Freelance PM Coach. 
REQUIREMENTS: Written sign-off on scope/revisions. 
CHECK-INS: Weekly progress demos (clients shouldn't wait >7 days). 
BUFFER: Final 7 days are buffer days. 
COMMUNICATION: Bad news early (5 days before deadline, not on it).`
  },
  {
    id: 'read-books',
    title: 'Read More Books',
    category: 'Mindset',
    description: 'Reclaim focus and build a sustainable deep reading habit.',
    dailyBudget: 30,
    durationDays: 30,
    icon: BookOpen,
    nichePrompt: `Reading habit coach. 
ENVIRONMENT: No phone in room. Book visible/accessible at anchor spot. 
RETENTION: Write 1-3 summary sentences after every chapter (No highlighting without paraphrasing). 
SELECTION: Stop a bad book after 50 pages to protect the habit. 
FORMAT: Audio/E-reader/Physical all valid.`
  },
  {
    id: 'startup-launch',
    title: 'Startup MVP Launch',
    category: 'Business',
    description: 'Validate demand and find product-market fit.',
    dailyBudget: 180,
    durationDays: 60,
    icon: Rocket,
    nichePrompt: `Startup Coach (Lean / JTBD). 
PHASES: W1: Problem validation (Talk to 10 users). W3: Landing page with waitlist. W4: Concierge MVP (Manual delivery). 
MONETIZATION: Ask for money BEFORE building full infra. 
METRICS: Retention > Downloads.`
  },
  {
    id: 'habit-builder',
    title: 'Build a New Habit',
    category: 'General',
    description: 'Science-backed behavior change using atomic anchors.',
    dailyBudget: 20,
    durationDays: 66,
    icon: Sparkles,
    nichePrompt: `2026 Habit Science Coach. 
ARCHITECTURE: Cue -> Craving -> Routine -> Reward. 
2-MINUTE RULE: Scale down to 2-min version for bad days. 
ENVIRONMENT: Make it visible/easy. 
RECOVERY: Never miss twice in a row.`
  },
  {
    id: 'quit-habit',
    title: 'Quit a Bad Habit',
    category: 'Health',
    description: 'Replacement-based cessation strategy to fix neurological loops.',
    dailyBudget: 30,
    durationDays: 90,
    icon: Ban,
    nichePrompt: `Addiction & Cessation Science (2026). 
METHOD: Replace the routine, keep the cue/craving loop. 
URGE SURFING: urger peaks at 10-20m, observe don't act. 
AWARENESS: W1 is data-only (track time/emotions). 
RELAPSE: Data, not failure. Identify the missed cue.`
  }
]
