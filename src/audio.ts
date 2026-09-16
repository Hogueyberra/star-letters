let voicesReady = false
let audioCtx: AudioContext | null = null

function getVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
  return window.speechSynthesis.getVoices()
}

function pickVoice() {
  const voices = getVoices()
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'))
  const preferred =
    english.find((voice) => /samantha|google us english|female|karen|moira|tessa|salli|zira/i.test(voice.name)) ??
    english.find((voice) => voice.lang.toLowerCase() === 'en-us') ??
    english[0]
  return preferred ?? null
}

export function initAudio() {
  if (typeof window === 'undefined') return
  if ('speechSynthesis' in window) {
    getVoices()
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      voicesReady = true
    })
    voicesReady = getVoices().length > 0
  }
}

export function unlockAudio() {
  if (typeof window === 'undefined') return
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const warm = new SpeechSynthesisUtterance(' ')
    warm.volume = 0
    window.speechSynthesis.speak(warm)
    window.speechSynthesis.cancel()
  }
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (Ctx) audioCtx = new Ctx()
  }
  void audioCtx?.resume()
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

export function speak(text: string, muted: boolean, rate = 0.92) {
  if (muted || !text.trim()) return
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = rate
  utterance.pitch = 1.12
  utterance.lang = 'en-US'
  const voice = pickVoice()
  if (voice) utterance.voice = voice
  if (!voicesReady) {
    window.speechSynthesis.addEventListener(
      'voiceschanged',
      () => {
        const lateVoice = pickVoice()
        if (lateVoice) utterance.voice = lateVoice
      },
      { once: true },
    )
  }
  window.speechSynthesis.speak(utterance)
}

function tone(frequency: number, start: number, duration: number, type: OscillatorType, gain = 0.07) {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    audioCtx = new Ctx()
  }
  const osc = audioCtx.createOscillator()
  const g = audioCtx.createGain()
  osc.type = type
  osc.frequency.value = frequency
  g.gain.setValueAtTime(gain, audioCtx.currentTime + start)
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + start + duration)
  osc.connect(g).connect(audioCtx.destination)
  osc.start(audioCtx.currentTime + start)
  osc.stop(audioCtx.currentTime + start + duration + 0.02)
}

export function playSparkle(muted: boolean) {
  if (muted) return
  void audioCtx?.resume()
  tone(523.25, 0, 0.16, 'sine', 0.06)
  tone(659.25, 0.07, 0.16, 'sine', 0.06)
  tone(783.99, 0.14, 0.22, 'triangle', 0.05)
}

export function playBoop(muted: boolean) {
  if (muted) return
  void audioCtx?.resume()
  tone(240, 0, 0.12, 'sine', 0.04)
}

export function playFanfare(muted: boolean) {
  if (muted) return
  void audioCtx?.resume()
  tone(392, 0, 0.18, 'triangle', 0.05)
  tone(523.25, 0.12, 0.18, 'triangle', 0.05)
  tone(659.25, 0.24, 0.28, 'triangle', 0.06)
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}
