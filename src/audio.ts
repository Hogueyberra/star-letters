import manifest from './audio-manifest.json'

type ManifestEntry = { path: string; text: string }
const CLIPS = manifest as Record<string, ManifestEntry>

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

// One-sample silent WAV. Playing this inside a tap unlocks later HTMLAudio autoplay on iOS.
const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'

let htmlAudioUnlocked = false
let unlockWork: Promise<boolean> | null = null
let playSeq = 0
let currentFinish: ((ok: boolean) => void) | null = null

const SOUND_PROMPT_KEY = 'ui.what_letter_makes_the_sound'
const SOUND_GAP_MS = 250

function makeAudio() {
  const audio = new Audio()
  audio.setAttribute('playsinline', 'true')
  audio.setAttribute('webkit-playsinline', 'true')
  audio.preload = 'auto'
  return audio
}

function isAutoplayBlocked(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const name = 'name' in error ? String(error.name) : ''
  const message = 'message' in error ? String(error.message) : ''
  return name === 'NotAllowedError' || /not allowed|user (didn't|did not) interact|user gesture/i.test(message)
}

function silenceBrowserVoice() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

function stopClip() {
  const finish = currentFinish
  currentFinish = null
  if (currentClip) {
    const audio = currentClip
    currentClip = null
    audio.onended = null
    audio.onerror = null
    audio.pause()
    audio.removeAttribute('src')
    try {
      audio.load()
    } catch {
      // Resetting a torn-down element can throw on iOS.
    }
  }
  finish?.(false)
}

export function stopSpeech() {
  playSeq += 1
  silenceBrowserVoice()
  stopClip()
}

export function isAudioUnlocked() {
  return htmlAudioUnlocked
}

export function whenAudioUnlocked() {
  if (htmlAudioUnlocked) return Promise.resolve(true)
  return unlockWork ?? Promise.resolve(false)
}

function playUrl(url: string): Promise<boolean> {
  silenceBrowserVoice()
  stopClip()
  if (typeof window === 'undefined') return Promise.resolve(false)
  const audio = makeAudio()
  currentClip = audio
  audio.src = url
  return new Promise((resolve) => {
    let settled = false
    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      if (currentFinish === finish) currentFinish = null
      if (currentClip === audio) currentClip = null
      resolve(ok)
    }
    currentFinish = finish
    audio.onended = () => finish(true)
    audio.onerror = () => finish(false)
    void audio
      .play()
      .then(() => {
        htmlAudioUnlocked = true
      })
      .catch((error: unknown) => {
        if (isAutoplayBlocked(error)) htmlAudioUnlocked = false
        finish(false)
      })
  })
}

export function speakClip(key: string, muted: boolean, ignoreMute = false): Promise<boolean> {
  if (!ignoreMute && muted) return Promise.resolve(false)
  const entry = CLIPS[key]
  if (!entry) return Promise.resolve(false)
  return playUrl(clipUrl(entry.path))
}

export function speakSkill(
  skill: 'letter' | 'sound' | 'word' | 'phrase',
  target: string,
  muted: boolean,
  ignoreMute = false,
): Promise<boolean> {
  if (skill === 'sound') return speakSoundQuestion(target, muted, ignoreMute)
  return speakClip(clipKeyFor(skill, target), muted, ignoreMute)
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export async function speakSoundQuestion(
  letter: string,
  muted: boolean,
  ignoreMute = false,
): Promise<boolean> {
  if (!ignoreMute && muted) return false
  const seq = (playSeq += 1)
  const prompted = await speakClip(SOUND_PROMPT_KEY, muted, ignoreMute)
  if (seq !== playSeq) return false
  if (prompted) await wait(SOUND_GAP_MS)
  if (seq !== playSeq) return false
  return speakClip(clipKeyFor('sound', letter), muted, ignoreMute)
}

export function speak(text: string, muted: boolean, _rate = 0.92, ignoreMute = false): Promise<boolean> {
  if ((!ignoreMute && muted) || !text.trim()) return Promise.resolve(false)
  const trimmed = text.trim()
  const uiKey = UI_BY_TEXT[trimmed.toLowerCase()]
  if (uiKey) return speakClip(uiKey, muted, ignoreMute)
  if (trimmed === 'I') return speakClip('words.I', muted, ignoreMute)
  if (trimmed === 'a') return speakClip('words.a', muted, ignoreMute)
  const wordKey = `words.${trimmed.toLowerCase()}`
  if (CLIPS[wordKey]) return speakClip(wordKey, muted, ignoreMute)
  const phraseKey = `phrases.${slugPhrase(trimmed)}`
  if (CLIPS[phraseKey]) return speakClip(phraseKey, muted, ignoreMute)
  return Promise.resolve(false)
}

export function playPreview() {
  resumeAudioContext()
  const keys = ['ui.hi_goldie', 'ui.lets_learn', 'words.see']
  let chain = Promise.resolve<boolean | void>(undefined)
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
  void speakClip('ui.hi_goldie', muted)
}

export function initAudio() {
  if (typeof window === 'undefined') return
  if ('speechSynthesis' in window) {
    getVoices()
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
  silenceBrowserVoice()
  resumeAudioContext()
  if (htmlAudioUnlocked) return Promise.resolve(true)
  if (unlockWork) return unlockWork

  const audio = makeAudio()
  audio.volume = 0.01
  audio.src = SILENT_WAV
  unlockWork = audio
    .play()
    .then(() => {
      htmlAudioUnlocked = true
      audio.pause()
      audio.removeAttribute('src')
      try {
        audio.load()
      } catch {
        // ignore
      }
      return true
    })
    .catch(() => false)
    .finally(() => {
      unlockWork = null
    })

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
