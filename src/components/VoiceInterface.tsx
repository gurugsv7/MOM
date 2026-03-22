import { useState } from 'react'
import { voice } from '@/lib/voice'
import { useGoalsStore } from '@/stores/goalsStore'
import { useAuthStore } from '@/stores/authStore'
import { useVaultStore } from '@/stores/vaultStore'
import { useUIStore } from '@/stores/uiStore'
import { Mic, MicOff, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'

export function VoiceInterface() {
  const [listening, setListening] = useState(false)
  const { user, cryptoKey } = useAuthStore()
  const { todayTasks, updateTaskStatus, skipTask } = useGoalsStore()
  const { entries } = useVaultStore()
  const { addToast } = useUIStore()

  const handleIntent = async (transcript: string) => {
    const text = transcript.toLowerCase()
    console.log('Voice Intent:', text)

    // 1. Vault Lookup
    if (text.includes('password') || text.includes('vault') || text.includes('login')) {
      if (!cryptoKey) {
        voice.speak("The vault is currently locked. Please sign in to provide the master key.")
        return
      }

      const match = entries.find(e => text.includes(e.plaintext.site.toLowerCase()))
      if (match) {
        voice.speak(`Accessing ${match.plaintext.site}. Your username is ${match.plaintext.username}. The password is: ${match.plaintext.password.split('').join(' ')}. Be aware of your surroundings.`)
        addToast(`Voice: Retrieved ${match.plaintext.site} credentials`, 'success')
      } else {
        voice.speak("I couldn't find a matching entry in your encrypted vault. Please verify the site name.")
      }
      return
    }

    // 2. "Today's Tasks"
    if (text.includes('today') || text.includes('tasks') || text.includes('plate')) {
      if (todayTasks.length === 0) {
        voice.speak("Your plate is clean. No tasks scheduled for today.")
      } else {
        const pending = todayTasks.filter(t => t.status === 'pending')
        voice.speak(`You have ${pending.length} tasks remaining. First up is: ${pending[0].title}`)
      }
      return
    }

    // 3. "Mark Done"
    if (text.includes('done') || text.includes('complete') || text.includes('finished')) {
      const match = todayTasks.find(t => text.includes(t.title.toLowerCase()))
      if (match) {
        await updateTaskStatus(match.id, 'done')
        voice.speak(`Excellent. ${match.title} is marked as complete.`)
        addToast(`Voice: Completed ${match.title}`, 'success')
      } else {
        voice.speak("I couldn't identify which task you finished. Please specify the title.")
      }
      return
    }

    // 4. "Skip / Later"
    if (text.includes('skip') || text.includes('later') || text.includes('tomorrow')) {
      const match = todayTasks.find(t => text.includes(t.title.toLowerCase()))
      if (match && user) {
        await skipTask(match.id, user.id)
        voice.speak(`Understood. ${match.title} has been moved to a future day.`)
        addToast(`Voice: Redistributed ${match.title}`, 'info')
      } else {
        voice.speak("I'm not sure which task to move. Could you repeat the name?")
      }
      return
    }

    // Default Fallback
    voice.speak("I'm listening, but I didn't recognize that command.")
  }

  const toggleMic = async () => {
    if (listening) {
      voice.stop()
      setListening(false)
      return
    }

    if (!voice.isSupported()) {
      addToast('Voice recognition not supported in this browser.', 'error')
      return
    }

    setListening(true)
    try {
      const result = await voice.listen()
      await handleIntent(result.transcript)
    } catch (err: any) {
      if (err !== 'no-speech') {
        addToast(`Voice error: ${err}`, 'error')
      }
    } finally {
      setListening(false)
    }
  }

  return (
    <>
      {/* Listening Overlay */}
      {listening && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-6">
          <div className="flex flex-col items-center gap-8 max-w-xs text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-[#6366f1]/30 rounded-full animate-ping" />
              <div className="relative w-24 h-24 rounded-full bg-[#1A1A24] border-2 border-[#6366f1] flex items-center justify-center">
                <Mic className="text-[#6366f1] animate-pulse" size={40} />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-[#f9f5fd] tracking-wide">MOM is Listening...</h2>
              <div className="flex items-center justify-center gap-2 text-[#6366f1] text-[10px] uppercase tracking-[0.2em] animate-pulse">
                <Terminal size={12} />
                <span>Intent Detection Active</span>
              </div>
              <p className="text-sm text-[#76747b] italic font-serif">
                "What's on my plate?" or "Mark [task] as done."
              </p>
            </div>
            <button 
              onClick={() => setListening(false)}
              className="mt-4 px-6 py-2 rounded-full border border-[#48474d] text-[#acaab1] text-xs uppercase tracking-widest hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Mic Floating Button */}
      <button
        onClick={toggleMic}
        className={cn(
          "fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 btn-press",
          listening 
            ? "bg-[#ef4444] animate-pulse scale-110" 
            : "glass-card bg-[#1A1A24]/90 border border-[#6366f1]/30 hover:shadow-[#6366f1]/20 hover:scale-105"
        )}
      >
        {listening ? (
          <MicOff className="text-white" size={24} />
        ) : (
          <Mic className="text-[#6366f1]" size={24} />
        )}
      </button>
    </>
  )
}
