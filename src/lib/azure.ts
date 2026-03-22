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
    scheduled_time: string // e.g. "07:00 AM" or "Afternoon"
  }>
}

export interface RoadmapResponse {
  days: RoadmapDay[]
}

function buildUrl(path: string) {
  return `${ENDPOINT}/openai/deployments/${DEPLOYMENT}/${path}?api-version=${API_VERSION}`
}

async function azureChat(
  messages: Array<{ role: string; content: string | any[] }>,
  jsonMode: boolean = false,
  imageBase64?: string
): Promise<string> {
  if (!ENDPOINT || !API_KEY) {
    throw new Error('Azure OpenAI credentials not configured. Add VITE_AZURE_OPENAI_ENDPOINT and VITE_AZURE_OPENAI_API_KEY to .env')
  }

  const body: any = { messages, temperature: 1 }
  if (jsonMode) {
    body.response_format = { type: 'json_object' }
  }

  // If image provided, convert last user message to vision format
  const processedMessages = imageBase64
    ? messages.map((m, i) => {
        if (i === messages.length - 1 && m.role === 'user') {
          return {
            role: 'user',
            content: [
              { type: 'text', text: m.content as string },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'high' }
              }
            ]
          }
        }
        return m
      })
    : messages

  const res = await fetch(buildUrl('chat/completions'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': API_KEY,
    },
    body: JSON.stringify({ ...body, messages: processedMessages }),
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
  dailyBudgetMinutes: number,
  momentum: 'normal' | 'simplify' | 'accelerate' = 'normal',
  unavailability: Array<{ dayOfWeek: string; start: string; end: string; title: string }> = [],
  nichePrompt?: string
): Promise<RoadmapResponse> {
  const cappedDays = Math.min(daysTotal || 14, 14)
  const system = `You are MOM, your friendly and supportive personal manager. 
  
  NICHE EXPERTISE:
  ${nichePrompt || 'Generate a standard tactical roadmap.'}

  ADAPTIVE CALIBRATION:
  - Phase: ${momentum.toUpperCase()}
  - Simplify: If users are struggling, break tasks into 'micro-steps' to build momentum.
  - Accelerate: If users are crushing it, increase challenge and intensity.

  SCHEDULING PROTOCOL:
  - Operator Unavailability: ${JSON.stringify(unavailability)}
  - Rule: Assign a specific 'scheduled_time' (HH:MM AM/PM) for each task.
  - Rule: NEVER assign tasks during unavailable windows.
  - Rule: Space tasks realistically based on the Daily Budget (${dailyBudgetMinutes} mins).

  Respond ONLY with valid JSON matching this schema: { "days": [{ "day_number": 1, "tasks": [{ "title": "...", "description": "...", "estimated_minutes": 30, "scheduled_time": "08:00 AM" }] }] }`

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

export async function processChatIntent(
  userMessage: string,
  context: { todayTasks: any[], vaultSites: string[], activeGoals: { id: string, title: string }[], memorySummary: string },
  history: Array<{ role: string, content: string }> = [],
  imageBase64?: string
) {
  // Extract recent context from history to prevent repeats
  const recentDialogue = history.slice(-6).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')

  const prompt = `
    Analyze user input for the MOM (My Own Manager) Tactical OS.
    
    Operator Terminal Memory:
    ${context.memorySummary || "FIRST INITIALIZATION. NO PRIOR DATA."}

    Recent Conversation History:
    ${recentDialogue || "NO RECENT HISTORY."}

    Active Missions (Goals): ${JSON.stringify(context.activeGoals)}
    Today's Tasks: ${JSON.stringify(context.todayTasks.map(t => ({ id: t.id, title: t.title, goalId: t.goal_day_id })))}
    Vault Sites: ${JSON.stringify(context.vaultSites)}
    
    Current User Message: "${userMessage}"
    
    Return ONLY a raw JSON object (no markdown):
    {
      "intent": "ADD_GOAL" | "ADD_TASK" | "ADD_VAULT_ENTRY" | "BATCH_VAULT_ENTRIES" | "VAULT_LOOKUP" | "SKIP_TASK" | "STATUS_CHECK" | "CHAT" | "DISAMBIGUATE",
      "params": { ... },
      "momResponse": "Your response: Friendly, supportive, and extremely helpful. Keep it concise."
    }

    --- VAULT DOCTRINE ---
    - The vault is organized by Platform Folders (e.g. Vercel, GitHub, Netlify, Supabase).
    - Rule: NEVER assume a username or account (e.g. 'Shomesh007' or email) if not explicitly stated in the message or visible in the image.
    - Rule: If you identified a project name (site) in a previous message, DO NOT ask for it again. Use the Recent Conversation History.
    - Rule: 'category' MUST be the platform/service name.
    - Rule: 'username' = the actual account name or email. If unsure, ask.

    --- IMAGE ANALYSIS DOCTRINE ---
    When user sends an image:
    - Carefully read ALL visible text.
    - **FIDELITY CHECK**: If a project name, account name (username), or platform is not 100% clear, DO NOT save it.
    - **AMBIGUITY GATE**: If you see a project but not the account, or vice versa, set intent to "CHAT" or "DISAMBIGUATE" and ask: "I've identified the project [Name], but which account (email/username) should I store this under?"
    - **MOM RESPONSE**: Summarize what was found. If skipping something due to ambiguity, explain exactly what is missing.

    --- MISSION DOCTRINE (Rules for ADD_GOAL) ---
    MOM does not plan generic missions. Before setting 'intent' to ADD_GOAL, you MUST conduct a Discovery Phase.
    You need 4 Pillars of Intel:
    1. OBJECTIVE & MOTIVATION: What is the end-state? Why does the operator want this?
    2. CONSTRAINTS: Any physical limits, equipment availability (e.g. gym?), or specific roadblocks?
    3. EXPERIENCE LEVEL: Is the operator a novice or expert in this domain?
    4. TEMPORAL PARAMETERS: A clear deadline (YYYY-MM-DD) and a realistic daily time budget (mins).

    CRITICAL RULES:
    - If any Pilllar is missing or vague, DO NOT return ADD_GOAL.
    - Instead, use intent: "CHAT" and ask 1 or 2 targeted questions to fill the gaps.
    - ONLY trigger ADD_GOAL when you have enough high-fidelity context.
    - params for ADD_GOAL: { title, category, description, deadline, totalDays, dailyBudgetMins }.

    --- OTHER INTENTS ---
    - [ADD TASK] If user explicitly asks to schedule a daily task.
    - [SECURITY] Never ask for passwords. Use the secure widget for vault entries.
    - [VAULT STORE] If user says "store my password" or similar, use ADD_VAULT_ENTRY with site/username.
    - [VAULT LOOKUP] If user asks for an existing password, set intent to VAULT_LOOKUP and provide the 'site' in params.
    - [UX TONE] Friendly Personal Manager. Be supportive and warm. avoid heavy military or tactical jargon.
    - **CRITICAL**: NEVER use asterisks (**) for bolding. It looks awkward in the terminal.
    - **HIGHLIGHTS**: To emphasize a word or phrase, wrap it in carets like ^this^. MOM will render these as premium colored highlights.
    - **LISTS**: Use capitalized headers and clean bullet points.
  `

  const userContent = userMessage || (imageBase64 ? 'Analyze this screenshot and extract all visible project/account information for the vault.' : '')
  const result = await azureChat([
    { role: 'system', content: 'You are MOM, a friendly and helpful personal manager assistant. You have access to recent history to prevent asking redundant questions.' },
    { role: 'user', content: prompt + `\n\nUser Message: "${userContent}"` }
  ], true, imageBase64)

  return JSON.parse(result)
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
