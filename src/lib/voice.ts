/**
 * MOM Voice Engine — Web Speech API Wrapper
 */

export interface VoiceResult {
  transcript: string
  confidence: number
}

class VoiceEngine {
  private recognition: any = null
  private synthesis: SpeechSynthesis = window.speechSynthesis
  private isListening: boolean = false

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition()
      this.recognition.continuous = false
      this.recognition.interimResults = false
      this.recognition.lang = 'en-US'
    }
  }

  public isSupported(): boolean {
    return !!this.recognition
  }

  public speak(text: string): void {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 0.9 // Slightly deeper, "managerial" tone
    this.synthesis.speak(utterance)
  }

  public listen(): Promise<VoiceResult> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) return reject('Speech recognition not supported')
      if (this.isListening) return

      this.isListening = true
      this.recognition.start()

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        const confidence = event.results[0][0].confidence
        this.isListening = false
        resolve({ transcript, confidence })
      }

      this.recognition.onerror = (event: any) => {
        this.isListening = false
        reject(event.error)
      }

      this.recognition.onend = () => {
        this.isListening = false
      }
    })
  }

  public stop(): void {
    if (this.recognition) this.recognition.stop()
    this.isListening = false
  }
}

export const voice = new VoiceEngine()
