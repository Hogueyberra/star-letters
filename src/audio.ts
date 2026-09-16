let voicesReady = false
let audioCtx: AudioContext | null = null
let chosenVoiceURI = ''
let chosenVoiceName = ''

export type VoiceOption = {
  voiceURI: string
  name: string
  lang: string
  localService: boolean
}

function getVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
  return window.speechSynthesis.getVoices()
}

export function setVoiceChoice(voiceURI: string, voiceName: string) {
  chosenVoiceURI = voiceURI
  chosenVoiceName = voiceName
}

function scoreVoice(voice: SpeechSynthesisVoice) {
  const name = voice.name.toLowerCase()
  const lang = voice.lang.toLowerCase()
  let score = 0
  if (voice.localService) score += 8
  if (lang.startsWith('en')) score += 10
  if (lang === 'en-us') score += 6
  if (lang === 'en-gb') score += 3
  if (/google us english|samantha|karen|moira|tessa|salli|zira|samantha/.test(name)) score += 12
  if (/google uk english female|google/.test(name)) score += 7
  if (/female|woman|girl|samantha|karen|moira/.test(name)) score += 4
  if (/premium|enhanced|neural|natural/.test(name)) score += 3
  if (/compact|novelty|whisper|bad news|good news|bells|boing|bubbles|cellos|zarvox|trinoids/.test(name)) score -= 8
  return score
}

export function preferredDefaultVoice() {
  const voices = getVoices()
  if (voices.length === 0) return null
  const ranked = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a))
  return ranked[0] ?? null
}

export function resolveVoice(voiceURI = chosenVoiceURI, voiceName = chosenVoiceName) {
  const voices = getVoices()
  if (voices.length === 0) return null
  if (voiceURI) {
    const byUri = voices.find((voice) => voice.voiceURI === voiceURI)
    if (byUri) return byUri
  }
  if (voiceName) {
    const byName = voices.find((voice) => voice.name === voiceName)
    if (byName) return byName
  }
  return preferredDefaultVoice()
}

export function listPlayableVoices(): VoiceOption[] {
  const all = getVoices()
  const english = all.filter((voice) => voice.lang.toLowerCase().startsWith('en'))
  const pool = english.length > 0 && all.length > 6 ? english : english.length > 0 ? english : all
  return [...pool]
    .sort((a, b) => scoreVoice(b) - scoreVoice(a))
    .map((voice) => ({
      voiceURI: voice.voiceURI,
      name: voice.name,
      lang: voice.lang,
      localService: voice.localService,
    }))
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

export function onVoicesChanged(listener: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return () => {}
  window.speechSynthesis.addEventListener('voiceschanged', listener)
  return () => window.speechSynthesis.removeEventListener('voiceschanged', listener)
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

export function speak(text: string, muted: boolean, rate = 0.92, ignoreMute = false) {
  if ((!ignoreMute && muted) || !text.trim()) return
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = rate
  utterance.pitch = 1.12
  const applyVoice = (voice: SpeechSynthesisVoice | null) => {
    if (!voice) {
      utterance.lang = 'en-US'
      return
    }
    utterance.voice = voice
    utterance.lang = voice.lang || 'en-US'
  }
  applyVoice(resolveVoice())
  if (!voicesReady) {
    window.speechSynthesis.addEventListener(
      'voiceschanged',
      () => {
        applyVoice(resolveVoice())
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
