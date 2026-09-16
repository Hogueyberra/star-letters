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

// One-sample silent WAV. Playing this inside a tap unlocks HTMLAudio on iOS Safari
// so later in-session auto-plays of Jessica clips are allowed.
const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'

let sharedAudio: HTMLAudioElement | null = null
let htmlAudioUnlocked = false
let unlockWork: Promise<boolean> | null = null

function getSharedAudio() {
  if (typeof window === 'undefined') return null
  if (!sharedAudio) {
    sharedAudio = new Audio()
    sharedAudio.setAttribute('playsinline', 'true')
    sharedAudio.setAttribute('webkit-playsinline', 'true')
    sharedAudio.preload = 'auto'
  }
  return sharedAudio
}

function isAutoplayBlocked(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const name = 'name' in error ? String(error.name) : ''
  const message = 'message' in error ? String(error.message) : ''
  return name === 'NotAllowedError' || /not allowed|user (didn't|did not) interact|user gesture/i.test(message)
}

function stopClip() {
  if (!currentClip) return
  currentClip.onended = null
  currentClip.onerror = null
  currentClip.pause()
  try {
    currentClip.currentTime = 0
  } catch {
    // iOS can throw if currentTime is set before metadata.
  }
  currentClip = null
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  stopClip()
}

export function isAudioUnlocked() {
  return htmlAudioUnlocked
}

export function whenAudioUnlocked() {
  if (htmlAudioUnlocked) return Promise.resolve(true)
  return unlockWork ?? Promise.resolve(false)
}

function playUrl(url: string): Promise<void> {
  stopSpeech()
  const audio = getSharedAudio()
  if (!audio) return Promise.resolve()
  currentClip = audio
  return new Promise((resolve) => {
    const finish = () => {
      if (currentClip === audio) currentClip = null
      resolve()
    }
    audio.onended = finish
    audio.onerror = finish
    audio.volume = 1
    audio.src = url
    try {
      audio.load()
    } catch {
      // load() is best-effort; play() still runs.
    }
    void audio
      .play()
      .then(() => {
        htmlAudioUnlocked = true
      })
      .catch((error: unknown) => {
        if (isAutoplayBlocked(error)) htmlAudioUnlocked = false
        finish()
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
  void playUrl(clipUrl(entry.path))
}

export function speakSkill(
  skill: 'letter' | 'sound' | 'word' | 'phrase',
  target: string,
  muted: boolean,
  ignoreMute = false,
) {
  const key = clipKeyFor(skill, target)
  if (!CLIPS[key]) {
    if ((!ignoreMute && muted) || !target.trim()) return
    speakTts(target)
    return
  }
  speakClip(key, muted, '', ignoreMute)
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
  resumeAudioContext()
  const keys = ['ui.hi_goldie', 'ui.lets_learn', 'words.see']
  let chain = Promise.resolve()
  for (const key of keys) {
    const entry = CLIPS[key]
    if (!entry) continue
    chain = chain.then(() => playUrl(clipUrl(entry.path)))
  }
  void chain
}

export function greetGoldie(muted: boolean) {
  if (greeted || muted) return
  greeted = true
  speakClip('ui.hi_goldie', muted)
}

export function initAudio() {
  if (typeof window === 'undefined') return
  getSharedAudio()
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

function resumeAudioContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (Ctx) audioCtx = new Ctx()
  }
  void audioCtx?.resume()
  if (!audioCtx) return
  try {
    const buffer = audioCtx.createBuffer(1, 1, audioCtx.sampleRate || 22050)
    const source = audioCtx.createBufferSource()
    source.buffer = buffer
    source.connect(audioCtx.destination)
    source.start(0)
  } catch {
    // Web Audio prime is optional; HTMLAudio unlock is what iOS needs.
  }
}

export function unlockAudio() {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const warm = new SpeechSynthesisUtterance(' ')
    warm.volume = 0
    window.speechSynthesis.speak(warm)
    window.speechSynthesis.cancel()
  }
  resumeAudioContext()
  if (htmlAudioUnlocked && sharedAudio) return Promise.resolve(true)
  if (unlockWork) return unlockWork

  const audio = getSharedAudio()
  if (!audio) return Promise.resolve(false)

  unlockWork = (async () => {
    const previous = currentClip
    try {
      audio.onended = null
      audio.onerror = null
      audio.volume = 0.01
      audio.src = SILENT_WAV
      try {
        audio.load()
      } catch {
        // ignore
      }
      await audio.play()
      audio.pause()
      try {
        audio.currentTime = 0
      } catch {
        // ignore
      }
      htmlAudioUnlocked = true
      return true
    } catch {
      if (audio.src.startsWith('data:')) htmlAudioUnlocked = false
      return htmlAudioUnlocked
    } finally {
      audio.volume = 1
      if (currentClip === previous) currentClip = null
      unlockWork = null
    }
  })()

  return unlockWork
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
