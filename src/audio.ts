import manifest from './audio-manifest.json'

type ManifestEntry = { path: string; text: string }
const CLIPS = manifest as Record<string, ManifestEntry>

let voicesReady = false
let audioCtx: AudioContext | null = null
let chosenVoiceURI = ''
let chosenVoiceName = ''
let currentClip: HTMLAudioElement | null = null
let greeted = false

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
  if (/google us english|samantha|karen|moira|tessa|salli|zira/.test(name)) score += 12
  if (/female|woman|samantha|karen/.test(name)) score += 4
  if (/compact|novelty|whisper|zarvox|trinoids|boing|bubbles/.test(name)) score -= 8
  return score
}

export function preferredDefaultVoice() {
  const voices = getVoices()
  if (voices.length === 0) return null
  return [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] ?? null
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
  const pool = english.length > 0 ? english : all
  return [...pool]
    .sort((a, b) => scoreVoice(b) - scoreVoice(a))
    .map((voice) => ({
      voiceURI: voice.voiceURI,
      name: voice.name,
      lang: voice.lang,
      localService: voice.localService,
    }))
}

function clipUrl(path: string) {
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`
  return `${base}audio/${path}`
}

export function slugPhrase(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

export function clipKeyFor(skill: 'letter' | 'sound' | 'word' | 'phrase', target: string) {
  if (skill === 'letter') return `letters.${target.toUpperCase()}`
  if (skill === 'sound') return `sounds.${target.toLowerCase()}`
  if (skill === 'word') {
    if (target === 'I') return 'words.I'
    if (target === 'a') return 'words.a'
    return `words.${target.toLowerCase()}`
  }
  return `phrases.${slugPhrase(target)}`
}

const UI_BY_TEXT: Record<string, string> = {
  'hi goldie!': 'ui.hi_goldie',
  'hi goldie': 'ui.hi_goldie',
  'you got it!': 'ui.you_got_it',
  'you got it': 'ui.you_got_it',
  'super star!': 'ui.super_star',
  'super star': 'ui.super_star',
  "let's learn!": 'ui.lets_learn',
  "let's learn": 'ui.lets_learn',
  'nice try!': 'ui.nice_try',
  'nice try': 'ui.nice_try',
}

function speakTts(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.92
  utterance.pitch = 1.12
  const voice = resolveVoice()
  if (voice) {
    utterance.voice = voice
    utterance.lang = voice.lang || 'en-US'
  } else {
    utterance.lang = 'en-US'
  }
  if (!voicesReady) {
    window.speechSynthesis.addEventListener(
      'voiceschanged',
      () => {
        const late = resolveVoice()
        if (late) {
          utterance.voice = late
          utterance.lang = late.lang || 'en-US'
        }
      },
      { once: true },
    )
  }
  window.speechSynthesis.speak(utterance)
}

function stopClip() {
  if (!currentClip) return
  currentClip.onended = null
  currentClip.onerror = null
  currentClip.pause()
  currentClip.src = ''
  currentClip = null
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  stopClip()
}

function playUrl(url: string, fallbackText: string): Promise<void> {
  stopSpeech()
  return new Promise((resolve) => {
    const audio = new Audio(url)
    currentClip = audio
    const finish = () => {
      if (currentClip === audio) currentClip = null
      resolve()
    }
    audio.onended = finish
    audio.onerror = () => {
      finish()
      speakTts(fallbackText)
    }
    void audio.play().catch(() => {
      finish()
      speakTts(fallbackText)
    })
  })
}

export function speakClip(key: string, muted: boolean, fallbackText = '', ignoreMute = false) {
  if (!ignoreMute && muted) return
  const entry = CLIPS[key]
  if (!entry) {
    if (fallbackText) speakTts(fallbackText)
    return
  }
  void playUrl(clipUrl(entry.path), fallbackText || entry.text)
}

export function speakSkill(
  skill: 'letter' | 'sound' | 'word' | 'phrase',
  target: string,
  muted: boolean,
  ignoreMute = false,
) {
  const key = clipKeyFor(skill, target)
  const entry = CLIPS[key]
  speakClip(key, muted, entry?.text ?? target, ignoreMute)
}

export function speak(text: string, muted: boolean, _rate = 0.92, ignoreMute = false) {
  if ((!ignoreMute && muted) || !text.trim()) return
  const trimmed = text.trim()
  const uiKey = UI_BY_TEXT[trimmed.toLowerCase()]
  if (uiKey) {
    speakClip(uiKey, muted, trimmed, ignoreMute)
    return
  }
  if (trimmed === 'I' && CLIPS['words.I']) {
    speakClip('words.I', muted, 'I', ignoreMute)
    return
  }
  if (trimmed === 'a' && CLIPS['words.a']) {
    speakClip('words.a', muted, 'a', ignoreMute)
    return
  }
  const wordKey = `words.${trimmed.toLowerCase()}`
  if (CLIPS[wordKey]) {
    speakClip(wordKey, muted, trimmed, ignoreMute)
    return
  }
  const phraseKey = `phrases.${slugPhrase(trimmed)}`
  if (CLIPS[phraseKey]) {
    speakClip(phraseKey, muted, trimmed, ignoreMute)
    return
  }
  speakTts(trimmed)
}

export function playPreview() {
  unlockAudio()
  const keys = ['ui.hi_goldie', 'ui.lets_learn', 'words.see']
  let chain = Promise.resolve()
  for (const key of keys) {
    const entry = CLIPS[key]
    if (!entry) continue
    chain = chain.then(() => playUrl(clipUrl(entry.path), entry.text))
  }
  void chain
}

export function greetGoldie(muted: boolean) {
  if (greeted || muted) return
  greeted = true
  speakClip('ui.hi_goldie', muted, 'Hi Goldie!')
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
