/**
 * Azure OpenAI client — all AI calls go through here.
 */

const ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT as string
const API_KEY = import.meta.env.VITE_AZURE_OPENAI_API_KEY as string
const DEPLOYMENT = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT as string
const API_VERSION = import.meta.env.VITE_AZURE_OPENAI_API_VERSION as string || '2024-12-01-preview'

export interface RoadmapDay {
  day_number: number
  tasks: Array<{
    title: string
    description: string
    estimated_minutes: number
  }>
}

export interface RoadmapResponse {
  days: RoadmapDay[]
}

function buildUrl(path: string) {
  return `${ENDPOINT}/openai/deployments/${DEPLOYMENT}/${path}?api-version=${API_VERSION}`
}

async function azureChat(
  messages: Array<{ role: string; content: string }>,
  jsonMode: boolean = false
): Promise<string> {
  if (!ENDPOINT || !API_KEY) {
    throw new Error('Azure OpenAI credentials not configured. Add VITE_AZURE_OPENAI_ENDPOINT and VITE_AZURE_OPENAI_API_KEY to .env')
  }

  const body: any = { messages, temperature: 1 }
  if (jsonMode) {
    body.response_format = { type: 'json_object' }
  }

  const res = await fetch(buildUrl('chat/completions'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': API_KEY,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Azure OpenAI Error Response:', err)
    throw new Error(`Azure OpenAI error ${res.status}: ${err}`)
  }

  const data = await res.json()
  if (!data.choices?.[0]?.message?.content) {
    console.error('Invalid Azure OpenAI Response Format:', data)
    throw new Error('Invalid response format from Azure OpenAI')
  }

  return data.choices[0].message.content as string
}

/** Generate a full day-by-day roadmap for a goal */
export async function generateRoadmap(
  title: string,
  category: string,
  description: string,
  deadline: string,
  daysTotal: number,
  dailyBudgetMinutes: number
): Promise<RoadmapResponse> {
  const cappedDays = Math.min(daysTotal || 14, 14)
  const system = `You are MOM, your friendly and supportive personal manager. 
  Generate a realistic, high-fidelity day-by-day tactical roadmap based on the operator's specific constraints, experience level, and motivation.
  Avoid generic advice. Tailor every task to the provided context.
  Respond ONLY with valid JSON matching this schema: { "days": [{ "day_number": 1, "tasks": [{ "title": "...", "description": "...", "estimated_minutes": 30 }] }] }`

  const user = `MISSION: ${title}
CATEGORY: ${category}
CONTEXT/CONSTRAINTS: ${description}
TIMEFRAME: ${daysTotal} days (Target: ${deadline})
OPERATOR DAILY ALLOCATION: ${dailyBudgetMinutes} minutes

Provision a complete roadmap for the first ${cappedDays} days. 
Each day must have 1-3 tasks that directly advance the mission while respecting the daily balance. 
Ensure the tasks are progressive and actionable.`

  const content = await azureChat([
    { role: 'system', content: system },
    { role: 'user', content: user },
  ], true)

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Invalid AI response — no JSON found')
  return JSON.parse(jsonMatch[0]) as RoadmapResponse
}

/** Re-describe redistributed tasks to fit naturally into new day context */
export async function regenerateTaskDescriptions(
  missedDay: number,
  newDay: number,
  redistributedTasks: Array<{ title: string; description: string }>,
  existingTasksSummary: string
): Promise<typeof redistributedTasks> {
  const system = `You are a personal planning assistant. Rewrite redistributed tasks to fit naturally into the new day's context. Preserve intent, adjust framing. Respond ONLY with valid JSON: { "tasks": [{ "title": "...", "description": "..." }] }`

  const user = `These tasks were missed on day ${missedDay} and redistributed to day ${newDay}:
${JSON.stringify(redistributedTasks)}
Day ${newDay} context: ${existingTasksSummary}
Rewrite each task title and description to flow naturally with the day's other tasks.`

  const content = await azureChat([
    { role: 'system', content: system },
    { role: 'user', content: user },
  ], true)

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return redistributedTasks
  const parsed = JSON.parse(jsonMatch[0])
  return parsed.tasks ?? redistributedTasks
}

export async function processChatIntent(userMessage: string, context: { todayTasks: any[], vaultSites: string[], activeGoals: { id: string, title: string }[], memorySummary: string }) {
  const prompt = `
    Analyze user input for the MOM (My Own Manager) Tactical OS.
    
    Operator Terminal Memory:
    ${context.memorySummary || "FIRST INITIALIZATION. NO PRIOR DATA."}

    Active Missions (Goals): ${JSON.stringify(context.activeGoals)}
    Today's Tasks: ${JSON.stringify(context.todayTasks.map(t => ({ id: t.id, title: t.title, goalId: t.goal_day_id })))}
    Vault Sites: ${JSON.stringify(context.vaultSites)}
    
    User Message: "${userMessage}"
    
    Return ONLY a raw JSON object (no markdown):
    {
      "intent": "ADD_GOAL" | "ADD_TASK" | "ADD_VAULT_ENTRY" | "VAULT_LOOKUP" | "SKIP_TASK" | "STATUS_CHECK" | "CHAT" | "DISAMBIGUATE",
      "params": { ... },
      "momResponse": "Your response: Friendly, supportive, and extremely helpful. Keep it concise."
    }

    --- VAULT DOCTRINE ---
    The vault is organized by Platform Folders. Each platform (e.g. Vercel, GitHub, Netlify, Supabase) is a folder.
    Inside each folder, entries store: Project Name → site, Account Name → username, optional password, notes for context.

    RULES:
    - 'category' MUST be the platform/service name (e.g. 'Vercel', 'GitHub', 'Netlify', 'Supabase', 'AWS'). NEVER use 'MOM Project' or 'Personal' for hosting/dev tools.
    - 'site' = the project name (e.g. 'MOM', 'Portfolio Site')
    - 'username' = the account name or email used on that platform (e.g. 'gurugsv7', 'user@gmail.com')
    - 'notes' = any relevant context (e.g. 'GitHub OAuth login, deployed via gurugsv7 account')

    EXAMPLES:
    - "MOM is deployed on Vercel using GitHub account gurugsv7"
      → category: 'Vercel', site: 'MOM', username: 'gurugsv7', notes: 'Deployed via GitHub OAuth'
    - "My Netlify account is guru@email.com"
      → category: 'Netlify', site: 'General', username: 'guru@email.com'
    - "Supabase project key is xyz for portfolio"
      → category: 'Supabase', site: 'Portfolio', username: 'guru@email.com', password: 'xyz'

    - params for ADD_VAULT_ENTRY: { site, username, password, category, notes }.

    --- MISSION DOCTRINE (Rules for ADD_GOAL) ---
    MOM does not plan generic missions. Before setting 'intent' to ADD_GOAL, you MUST conduct a Discovery Phase.
    You need 4 Pillars of Intel:
    1. OBJECTIVE & MOTIVATION: What is the end-state? Why does the operator want this?
    2. CONSTRAINTS: Any physical limits, equipment availability (e.g., gym access?), or specific dietary/lifestyle roadblocks?
    3. EXPERIENCE LEVEL: Is the operator a novice or expert in this domain?
    4. TEMPORAL PARAMETERS: A clear deadline (YYYY-MM-DD) and a realistic daily time budget (mins).

    CRITICAL RULES:
    - If any Pilllar is missing or vague (e.g., "workout for 2 months"), DO NOT return ADD_GOAL.
    - Instead, use intent: "CHAT" and ask 1 or 2 targeted questions to fill the gaps.
    - Be proactive. Instead of just "What equipment?", say "Got the schedule. Do you have a full gym, or are we planning for bodyweight/home exercises? Also, what's your current fitness level?"
    - ONLY trigger ADD_GOAL when you have enough high-fidelity context to build a custom, non-generic roadmap.
    - params for ADD_GOAL: { title, category, description, deadline, totalDays, dailyBudgetMins }.
    - description should summarize all gathered Pillars (motivation, level, equipment, etc).

    --- OTHER INTENTS ---
    - [ADD TASK] If user explicitly asks to schedule a daily task.
    - [SECURITY] Never ask for passwords. Use the secure widget for vault entries.
    - [VAULT STORE] If user says "store my password" or similar, use ADD_VAULT_ENTRY with site/username.
    - [VAULT LOOKUP] If user asks for an existing password, set intent to VAULT_LOOKUP and provide the 'site' in params.
    - [UX TONE] Friendly Personal Manager. Be supportive and warm. avoid heavy military or tactical jargon. No excessive use of bold (**). Be brief but clear.
  `

  const content = await azureChat([
    { role: 'system', content: 'You are MOM, a friendly and helpful personal manager assistant.' },
    { role: 'user', content: prompt }
  ], true)

  return JSON.parse(content)
}

export async function generateMemoryUpdate(oldSummary: string, interaction: string) {
  const prompt = `
    You are the Memory Subsystem for MOM (My Own Manager).
    Review the current Memory Summary and the Recent Interaction.
    Extract ONLY permanent facts (dates, preferences, goal context, project hosting/account details). 
    IGNORE casual chat, one-off questions, or technical commands.
    
    Current Memory:
    "${oldSummary || "NULL"}"
    
    Recent Interaction:
    "${interaction}"
    
    Return a UPDATED, CONCISE, bullet-pointed Memory Summary (Max 200 words).
    Keep it formal and technical (e.g. 'MOM App is hosted on Netlify (guru@gmail.com).', 'Supabase link via Google Sigin-in.').
  `

  const content = await azureChat([
    { role: 'system', content: 'You are MOM Memory Processor.' },
    { role: 'user', content: prompt }
  ])

  return content
}

export async function pruneMemorySummary(summary: string, activeGoals: { title: string }[]) {
  const today = new Date().toISOString().split('T')[0]
  const prompt = `
    MOM Memory Garbage Collection Protocol.
    Today's Date: ${today}
    Active Missions (Contextual Guard): ${JSON.stringify(activeGoals.map(g => g.title))}
    
    Review the following Memory Summary:
    "${summary}"
    
    Instructions:
    - REMOVE any facts that are time-expired (e.g. deadlines that have passed).
    - EXCEPTION: Do not prune facts that relate significantly to any of the Active Missions listed above, even if the date is past. 
    - REMOVE redundant or duplicate information.
    - KEEP persistent operator preferences.
    
    Return the CLEANED, OPTIMIZED bullet points. No conversational filler.
  `

  const content = await azureChat([
    { role: 'system', content: 'You are MOM Memory Optimizer.' },
    { role: 'user', content: prompt }
  ])

  return content
}
