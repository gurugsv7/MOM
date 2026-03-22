import { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { Mic, Plus, Terminal, Send, Zap, Loader2, ShieldCheck, Copy, Eye, EyeOff, Paperclip, X, Edit2, Trash2, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useGoalsStore } from '@/stores/goalsStore'
import { useChatStore } from '@/stores/chatStore'
import type { Message } from '@/stores/chatStore'
import { useVaultStore } from '@/stores/vaultStore'
import { useUIStore } from '@/stores/uiStore'
import { processChatIntent, generateMemoryUpdate, pruneMemorySummary } from '@/lib/azure'
import { voice } from '@/lib/voice'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

function BatchVaultWidget({
  entries,
  onComplete
}: {
  entries: Array<{ site: string; username?: string; category?: string; notes?: string }>;
  onComplete: (finalEntries: Array<{ site: string; username: string; category: string; notes: string }>) => void
}) {
  const [list, setList] = useState(entries.map(e => ({ ...e, id: Math.random().toString(36).slice(2) })))
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleUpdate = (id: string, field: string, val: string) => {
    setList(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item))
  }

  const handleRemove = (id: string) => {
    setList(prev => prev.filter(item => item.id !== id))
  }

  return (
    <div className="mt-4 p-4 bg-[#0e0e13] border-l-2 border-[#6366f1] space-y-4 glass-morphism shadow-2xl">
      <div className="flex items-center gap-2 text-[10px] text-[#a3a6ff] font-bold uppercase tracking-widest">
        <Loader2 size={12} className="animate-spin" /> 
        NEURAL EXTRACTION REVIEW ({list.length} ITEMS)
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {list.map((item) => (
          <div key={item.id} className="p-2 bg-[#131319] border border-[#a3a6ff]/10 hover:border-[#a3a6ff]/30 transition-all group relative">
            {editingId === item.id ? (
              <div className="space-y-2">
                <input 
                  className="w-full bg-[#1c1c26] text-xs py-1 px-2 border-none focus:ring-1 focus:ring-[#6366f1]"
                  value={item.site}
                  onChange={(e) => handleUpdate(item.id, 'site', e.target.value)}
                  placeholder="Project Name"
                />
                <div className="flex gap-2">
                  <input 
                    className="flex-1 bg-[#1c1c26] text-[10px] py-1 px-2 border-none"
                    value={item.username || ''}
                    onChange={(e) => handleUpdate(item.id, 'username', e.target.value)}
                    placeholder="Account/User"
                  />
                  <input 
                    className="w-24 bg-[#1c1c26] text-[10px] py-1 px-2 border-none"
                    value={item.category || ''}
                    onChange={(e) => handleUpdate(item.id, 'category', e.target.value)}
                    placeholder="Platform"
                  />
                </div>
                <button 
                  onClick={() => setEditingId(null)}
                  className="w-full bg-[#6366f1]/20 text-[#a3a6ff] text-[9px] py-1 font-bold uppercase hover:bg-[#6366f1]/40 transition-colors"
                >
                  Confirm Edits
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#f9f5fd]">{item.site}</div>
                  <div className="text-[9px] text-[#a3a6ff]/70 font-mono">
                    {item.category?.toUpperCase() || 'OTHER'} | {item.username || 'NO ACCOUNT'}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingId(item.id)} className="p-1 text-[#a3a6ff] hover:text-[#f9f5fd]">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleRemove(item.id)} className="p-1 text-[#ff4d4d] hover:text-[#ff0000]">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button 
        disabled={list.length === 0}
        onClick={() => onComplete(list.map(({ id, ...rest }) => ({
          site: rest.site,
          username: rest.username || '',
          category: rest.category || 'Other',
          notes: rest.notes || ''
        })))}
        className="w-full bg-[#6366f1] text-black text-[11px] font-black py-2 hover:bg-[#a3a6ff] transition-all disabled:opacity-20 flex items-center justify-center gap-2"
      >
        <CheckCircle2 size={14} /> COMMIT {list.length} ENTRIES TO VAULT
      </button>
      
      <p className="text-[9px] text-[#a3a6ff]/40 text-center italic">
        "Trust but verify. Confirm that no sensitive data is misaligned before encryption."
      </p>
    </div>
  )
}

function VaultActionWidget({ 
  site, 
  username, 
  category,
  notes,
  onComplete 
}: { 
  site: string; 
  username?: string; 
  category?: string;
  notes?: string;
  onComplete: (pass: string, category?: string, notes?: string) => void 
}) {
  const [pass, setPass] = useState('')
  return (
    <div className="mt-3 p-3 bg-[#000000] border border-[#6366f1]/40 space-y-3">
      <div className="flex items-center gap-2 text-[10px] text-[#6366f1] font-bold uppercase tracking-wider">
        <ShieldCheck size={12} /> SECURE INPUT: {site.toUpperCase()}
      </div>
      <div className="space-y-1">
        <input 
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="w-full bg-[#131319] border-none text-xs py-1.5 focus:ring-1 focus:ring-[#6366f1] text-[#a3a6ff]"
          placeholder="Password (optional)..."
        />
        <div className="flex items-center justify-between">
          <p className="text-[9px] text-[#6366f1]/60">Leave blank if no password to store</p>
          <button
            onClick={() => onComplete('', category, notes)}
            className="text-[9px] text-[#a3a6ff]/60 hover:text-[#a3a6ff] underline transition-colors"
          >
            No password, just save info
          </button>
        </div>
      </div>
      <button 
        onClick={() => onComplete(pass, category, notes)}
        className="w-full bg-[#6366f1] text-black text-[10px] font-black py-1.5 hover:bg-[#a3a6ff] transition-all"
      >
        SAVE TO {category ? category.toUpperCase() : 'VAULT'}
      </button>
    </div>
  )
}

function VaultLookupWidget({ 
  msgId,
  site, 
  username, 
  password 
}: { 
  msgId: string;
  site: string; 
  username: string; 
  password?: string;
}) {
  const [show, setShow] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      useChatStore.getState().removePendingAction(msgId)
    }, 30000)
    return () => clearTimeout(timer)
  }, [msgId])

  const copyToClipboard = () => {
    if (password) navigator.clipboard.writeText(password)
  }

  return (
    <div className="mt-3 p-3 bg-[#0e0e13] border border-[#a3a6ff]/40 space-y-3 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#a3a6ff] to-transparent opacity-50" />
      
      <div className="flex items-center gap-2 text-[10px] text-[#a3a6ff] font-bold uppercase tracking-wider">
        <ShieldCheck size={12} /> DECRYPTED PAYLOAD: {site}
      </div>
      
      <div className="text-xs text-[#f9f5fd] font-medium tracking-wide">
        User: <span className="text-[#a3a6ff]">{username}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <input 
          type={show ? "text" : "password"}
          value={password || ''}
          readOnly
          className="flex-1 bg-[#19191f] border border-[#48474d]/50 text-xs py-1.5 px-2 text-[#f9f5fd] focus:outline-none"
        />
        <button 
          onClick={() => setShow(!show)} 
          className="p-1.5 bg-[#25252d] hover:bg-[#48474d] text-[#a3a6ff] transition-colors border border-[#48474d]/50"
          title={show ? "Hide Payload" : "Reveal Payload"}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button 
          onClick={copyToClipboard} 
          className="p-1.5 bg-[#25252d] hover:bg-[#48474d] text-[#6366f1] transition-colors border border-[#48474d]/50"
          title="Copy Payload"
        >
          <Copy size={14} />
        </button>
      </div>

      <div className="flex items-center justify-end gap-2 text-[9px] font-bold tracking-widest uppercase mt-2">
        <span className="text-[#ff4d4d] animate-pulse">AUTO-PURGE IN T-30s</span>
      </div>
    </div>
  )
}

function NeuralMessage({ content, isMom }: { content: string; isMom: boolean }) {
  if (!isMom) return <>{content}</>

  // 1. Clean up any accidental or legacy markdown bolding **text**
  const cleanContent = content.replace(/\*\*(.*?)\*\*/g, '$1')

  // 2. Parse the custom ^highlight^ syntax
  const parts = cleanContent.split(/(\^.*?\^)/g)

  return (
    <span className={cn(isMom && "font-inter font-medium")}>
      {parts.map((part, index) => {
        if (part.startsWith('^') && part.endsWith('^')) {
          const text = part.slice(1, -1)
          return (
            <span 
              key={index} 
              className="inline-block px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary font-black tracking-tight"
              style={{ 
                textShadow: '0 0 10px rgba(99, 102, 241, 0.3)',
                letterSpacing: '-0.01em'
              }}
            >
              {text}
            </span>
          )
        }
        return part
      })}
    </span>
  )
}

export function ChatPage() {
  const { user, cryptoKey } = useAuthStore()
  const { todayTasks, fetchTodayTasks, skipTask } = useGoalsStore()
  const { messages, addMessage, isTyping, setTyping } = useChatStore()
  const { entries, addEntry, fetchAndDecrypt } = useVaultStore()
  const { addToast } = useUIStore()
  
  const [input, setInput] = useState('')
  const [memorySummary, setMemorySummary] = useState('')
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      // extract pure base64 (strip data:image/...;base64, prefix)
      const base64 = dataUrl.split(',')[1]
      setImageBase64(base64)
      setImagePreviewUrl(dataUrl)
    }
    reader.readAsDataURL(file)
    // reset input so same file can be re-selected
    e.target.value = ''
  }

  const clearImage = () => {
    setImageBase64(null)
    setImagePreviewUrl(null)
  }

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Load data
  useEffect(() => {
    const initData = async () => {
      if (user && cryptoKey) {
        fetchTodayTasks(user.id)
        fetchAndDecrypt(user.id, cryptoKey)
        
        // Fetch Memory Summary
        const { data: profile } = await supabase
          .from('profiles')
          .select('memory_summary')
          .eq('id', user.id)
          .maybeSingle()
        if (profile?.memory_summary) {
          setMemorySummary(profile.memory_summary)
        }
      }
    }
    initData()
  }, [user, cryptoKey, fetchTodayTasks, fetchAndDecrypt])

  const handleCommand = async (text: string, source: 'text' | 'voice' = 'text', imgBase64?: string) => {
    if (!text.trim() && !imgBase64) return
    if (!user) return

    setInput('')
    clearImage()
    // Show image inline in chat if sent
    const displayText = text.trim() || '📷 Screenshot sent for Vault analysis'
    addMessage('user', displayText, undefined, imagePreviewUrl || undefined)
    setTyping(true)

    try {
      const context = {
        todayTasks,
        vaultSites: entries.map(v => v.search_hint || ''),
        activeGoals: useGoalsStore.getState().goals.map(g => ({ id: g.id, title: g.title })),
        memorySummary
      }

      const historyContext = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const result = await processChatIntent(text, context, historyContext, imgBase64 || undefined)
      
      let pendingAction: Message['pendingAction'] | undefined = undefined

      // Execute side effects based on intent
      if (result.intent === 'ADD_GOAL' && result.params?.title && result.params?.deadline) {
        addToast(`MOM is architecting your roadmap...`, 'info')
        try {
          console.log("MOM Intent Match: ADD_GOAL", result.params)
          const roadmapFn = await import('@/lib/azure').then(m => m.generateRoadmap);
          const roadmap = await roadmapFn(
            result.params.title,
            result.params.category || 'WORK',
            result.params.description || '',
            result.params.deadline,
            result.params.totalDays || 14,
            result.params.dailyBudgetMins || 60
          )
          
          console.log("Roadmap Generated:", roadmap)

          const { data: goal, error: gErr } = await supabase.from('goals').insert({
            user_id: user.id,
            title: result.params.title,
            category: result.params.category || 'WORK',
            description: result.params.description || '',
            deadline: result.params.deadline,
            daily_budget_minutes: result.params.dailyBudgetMins || 60,
            status: 'active',
            color: '#6366f1' // Mandatory Indigo default
          }).select().single()

          if (gErr) throw gErr
          if (!goal) throw new Error("Goal creation failed - No data returned")

          console.log("Goal Record Created:", goal.id)

          // Parallelize Day/Task expansion for higher throughput
          await Promise.all(roadmap.days.map(async (day) => {
            const scheduledDate = new Date()
            scheduledDate.setDate(scheduledDate.getDate() + day.day_number - 1)
            
            const { data: gDay, error: dErr } = await supabase.from('goal_days').insert({
              goal_id: goal.id, 
              user_id: user.id, 
              day_number: day.day_number, 
              scheduled_date: format(scheduledDate, 'yyyy-MM-dd'), 
              status: 'pending'
            }).select().single()

            if (dErr) {
              console.warn(`Day ${day.day_number} insert failed:`, dErr)
              return
            }

            if (gDay && day.tasks?.length > 0) {
              const { error: tErr } = await supabase.from('tasks').insert(
                day.tasks.map((t, i) => ({
                  goal_day_id: gDay.id, 
                  user_id: user.id, 
                  title: t.title, 
                  description: t.description,
                  estimated_minutes: t.estimated_minutes, 
                  status: 'pending', 
                  redistributed: false,
                  original_day_number: null, 
                  display_order: i
                }))
              )
              if (tErr) console.warn(`Tasks for Day ${day.day_number} failed:`, tErr)
            }
          }))

          console.log("Mission Sequence Provisioning Complete.")
          await useGoalsStore.getState().fetchGoals(user.id)
          await fetchTodayTasks(user.id)
          addToast(`Mission ${result.params.title} sequence initialized.`, 'success')
        } catch (err) {
          console.error("MOM Execution Failure:", err)
          addToast('Neural link failed to provision roadmap. Check console.', 'error')
        }
      } else if (result.intent === 'ADD_TASK' && result.params?.title) {
        const targetGoalId = result.params.goalId || (context.activeGoals.length > 0 ? context.activeGoals[0].id : null)
        if (targetGoalId) {
          const { data: day } = await supabase.from('goal_days').select('id').eq('goal_id', targetGoalId).eq('scheduled_date', format(new Date(), 'yyyy-MM-dd')).maybeSingle()
          if (day) {
            await supabase.from('tasks').insert({ goal_day_id: day.id, user_id: user.id, title: result.params.title, description: 'Created via MOM Chat', estimated_minutes: result.params.estimated_minutes || 30, status: 'pending' })
            fetchTodayTasks(user.id)
          }
        }
      } else if (result.intent === 'ADD_VAULT_ENTRY' && result.params?.site) {
        pendingAction = {
          type: 'ADD_VAULT_ENTRY',
          site: result.params.site,
          username: result.params.username,
          category: result.params.category,
          notes: result.params.notes
        }
      } else if (result.intent === 'BATCH_VAULT_ENTRIES' && result.params?.entries?.length) {
        // Switch to Review mode instead of auto-saving directly
        pendingAction = {
          type: 'BATCH_VAULT_REVIEW',
          entries: result.params.entries
        }
      } else if (result.intent === 'VAULT_LOOKUP' && result.params?.site) {
        const query = result.params.site.toLowerCase()
        const entry = entries.find(e => e.search_hint?.toLowerCase().includes(query))
        
        if (entry) {
          result.momResponse = `Secure lookup authorized. Decrypting ${entry.plaintext.site} credentials locally.`
          pendingAction = {
            type: 'VAULT_LOOKUP',
            site: entry.plaintext.site,
            username: entry.plaintext.username,
            password: entry.plaintext.password
          }
        } else {
          result.momResponse = `I could not locate any encrypted records matching "${result.params.site}".`
        }
      } else if (result.intent === 'SKIP_TASK' && result.params?.taskId) {
        await skipTask(result.params.taskId, user.id)
        fetchTodayTasks(user.id)
      } else if (result.intent === 'STATUS_CHECK') {
        fetchTodayTasks(user.id)
      }

      // MOM Response with optional interactive widget
      addMessage('mom', result.momResponse, pendingAction)
      
      if (source === 'voice') {
        voice.speak(result.momResponse)
      }

      // BACKGROUND: Update long-term memory summary (Non-blocking)
      (async () => {
        try {
          let newSummary = await generateMemoryUpdate(memorySummary, `User: ${text}\nMOM: ${result.momResponse}`)
          if (newSummary && newSummary.length > 1000) {
            newSummary = await pruneMemorySummary(newSummary, context.activeGoals)
          }
          if (newSummary && newSummary !== memorySummary) {
            setMemorySummary(newSummary)
            await supabase.from('profiles').update({ memory_summary: newSummary }).eq('id', user.id)
          }
        } catch (err) {
          console.warn('Memory background update failed:', err)
        }
      })()

    } catch (error) {
      console.error('MOM Command Error:', error)
      addMessage('mom', 'SYSTEM ERROR: Neural link unstable.')
    } finally {
      setTyping(false)
    }
  }

  const completeVaultAction = async (msgId: string, pass: string, category?: string, notes?: string) => {
    const msg = useChatStore.getState().messages.find(m => m.id === msgId)
    const action = msg?.pendingAction
    if (!action || action.type !== 'ADD_VAULT_ENTRY') return
    
    if (!user || !cryptoKey) {
      addToast('Vault key not available. Please log out and log back in.', 'error')
      return
    }

    try {
      await addEntry({
        site: action.site,
        username: action.username || '',
        password: pass,
        category: category || action.category || 'Other',
        notes: notes || action.notes || 'Saved from Chat'
      }, user.id, cryptoKey)

      addToast(`Saved to Vault: ${action.site}`, 'success')
      useChatStore.setState(state => ({
        messages: state.messages.map(m => m.id === msgId ? { ...m, pendingAction: undefined } : m)
      }))
    } catch (err) {
      console.error('Vault save error:', err)
      addToast('Failed to save to Vault. Try again.', 'error')
    }
  }

  const completeBatchAction = async (msgId: string, finalEntries: any[]) => {
    if (!user || !cryptoKey) return
    try {
      let savedCount = 0
      for (const entry of finalEntries) {
        await addEntry(entry, user.id, cryptoKey)
        savedCount++
      }
      addToast(`Successfully encrypted and vault-locked ${savedCount} projects.`, 'success')
      useChatStore.setState(state => ({
        messages: state.messages.map(m => m.id === msgId ? { ...m, pendingAction: undefined } : m)
      }))
    } catch (err) {
      console.error('Batch save error:', err)
      addToast('Neural commit failed. Check logs.', 'error')
    }
  }

  const startVoiceInput = async () => {
    try {
      const res = await voice.listen()
      if (res.transcript) {
        handleCommand(res.transcript, 'voice')
      }
    } catch (err) {
      addToast('Microphone access denied or error.', 'error')
    }
  }

  const doneCount = todayTasks.filter(t => t.status === 'done').length
  const totalCount = todayTasks.length
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div className="flex flex-col h-full bg-[#0e0e13] text-[#f9f5fd] overflow-hidden font-inter">
      {/* Header: MOM Command Center */}
      <header className="flex-shrink-0 bg-[#0e0e13] border-b border-[#6366f1]/20 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-[#a3a6ff]" />
            <span className="text-sm font-black tracking-tighter uppercase">MOM</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-none">
            <span className="w-1.5 h-1.5 bg-[#a3a6ff] animate-pulse" />
            <span className="text-[9px] font-bold tracking-[0.1em] text-[#a3a6ff]">MOM: ONLINE</span>
          </div>
        </div>
        
        {/* System Efficiency Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-[#ac8aff]">
            <span>DAILY GOALS</span>
            <span>{doneCount}/{totalCount} DONE</span>
          </div>
          <div className="h-1 bg-[#25252d] rounded-none overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#6366f1] to-[#a3a6ff] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* Chat Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={cn(
              "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2",
              msg.role === 'user' ? "ml-auto items-end" : "items-start"
            )}
          >
            <div className={cn(
              "p-3 text-sm leading-relaxed shadow-sm",
              msg.role === 'mom' 
                ? "bg-surface-high border-l-2 border-primary relative glass-morphism text-on-surface"
                : "bg-surface-highest text-on-surface border-r-2 border-secondary text-right"
            )}>
              {msg.role === 'mom' && (
                <div className="absolute -top-1.5 -left-1.5">
                  <ShieldCheck size={12} className="text-primary" />
                </div>
              )}
              <NeuralMessage content={msg.content} isMom={msg.role === 'mom'} />

              {msg.imageUrl && (
                <div className="mt-2 rounded overflow-hidden border border-outline-variant/30 max-w-sm">
                  <img src={msg.imageUrl} alt="User attachment" className="w-full h-auto object-contain" />
                </div>
              )}

              {/* Interactive Action Widget */}
              {(() => {
                const action = msg.pendingAction
                if (!action) return null

                if (action.type === 'ADD_VAULT_ENTRY') {
                  return (
                    <VaultActionWidget 
                      site={action.site}
                      username={action.username}
                      category={action.category}
                      notes={action.notes}
                      onComplete={(pass, cat, n) => completeVaultAction(msg.id, pass, cat, n)}
                    />
                  )
                }
                if (action.type === 'BATCH_VAULT_REVIEW') {
                  return (
                    <BatchVaultWidget 
                      entries={action.entries}
                      onComplete={(final) => completeBatchAction(msg.id, final)}
                    />
                  )
                }
                if (action.type === 'VAULT_LOOKUP') {
                  return (
                    <VaultLookupWidget 
                      msgId={msg.id}
                      site={action.site}
                      username={action.username}
                      password={action.password}
                    />
                  )
                }
                return null
              })()}
            </div>
            <span className="text-[9px] uppercase tracking-tighter text-on-surface-variant mt-1 opacity-50">
              [{format(new Date(msg.timestamp), 'HH:mm:ss')}]
            </span>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-center gap-2 text-[10px] text-primary font-bold animate-pulse">
            <Zap size={10} />
            MOM IS ANALYZING...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-surface border-t border-outline-variant/30 relative z-20">
        {/* Image Preview */}
        {imagePreviewUrl && (
          <div className="relative inline-block mb-2">
            <img
              src={imagePreviewUrl}
              alt="Preview"
              className="h-16 w-auto rounded border border-primary/40 object-cover"
            />
            <button
              onClick={clearImage}
              className="absolute -top-1.5 -right-1.5 bg-surface-highest border border-outline-variant rounded-full p-0.5 text-on-surface-variant hover:text-on-surface"
            >
              <X size={10} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 bg-surface-low border border-outline-variant/50 focus-within:border-primary transition-colors p-1 shadow-inner">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          {/* Image attach button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'p-2 transition-colors',
              imageBase64
                ? 'text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
            title="Attach screenshot"
          >
            <Paperclip size={18} />
          </button>
          <input 
            type="text"
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 placeholder:text-on-surface-variant/40 text-on-surface font-inter"
            placeholder={imageBase64 ? 'Add a note or just send the image...' : 'Type command or speak...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCommand(input, 'text', imageBase64 || undefined)}
          />
          <button 
            onClick={startVoiceInput}
            className="p-2 bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/30"
          >
            <Mic size={18} />
          </button>
          <button 
            onClick={() => handleCommand(input, 'text', imageBase64 || undefined)}
            disabled={!input.trim() && !imageBase64}
            className="p-2 bg-primary text-on-primary hover:bg-primary/80 transition-all disabled:opacity-50 disabled:bg-surface-highest"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
