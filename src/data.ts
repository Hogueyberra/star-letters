export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export const LETTER_NAMES: Record<string, string> = {
  A: 'ay',
  B: 'bee',
  C: 'see',
  D: 'dee',
  E: 'ee',
  F: 'eff',
  G: 'jee',
  H: 'aych',
  I: 'eye',
  J: 'jay',
  K: 'kay',
  L: 'ell',
  M: 'em',
  N: 'en',
  O: 'oh',
  P: 'pee',
  Q: 'cue',
  R: 'ar',
  S: 'ess',
  T: 'tee',
  U: 'you',
  V: 'vee',
  W: 'double you',
  X: 'ex',
  Y: 'why',
  Z: 'zee',
}

/** Short vowels and common consonant sounds — skip tricky Q and X. */
export const SOUND_LETTERS = LETTERS.filter((letter) => letter !== 'Q' && letter !== 'X')

export const LETTER_SOUNDS: Record<string, { speak: string; hint: string }> = {
  A: { speak: 'aaa', hint: 'apple' },
  B: { speak: 'buh', hint: 'ball' },
  C: { speak: 'kuh', hint: 'cat' },
  D: { speak: 'duh', hint: 'dog' },
  E: { speak: 'eh', hint: 'egg' },
  F: { speak: 'fff', hint: 'fish' },
  G: { speak: 'guh', hint: 'goat' },
  H: { speak: 'huh', hint: 'hat' },
  I: { speak: 'ih', hint: 'igloo' },
  J: { speak: 'juh', hint: 'jam' },
  K: { speak: 'kuh', hint: 'kite' },
  L: { speak: 'lll', hint: 'leaf' },
  M: { speak: 'mmm', hint: 'moon' },
  N: { speak: 'nnn', hint: 'nest' },
  O: { speak: 'ah', hint: 'octopus' },
  P: { speak: 'puh', hint: 'pig' },
  R: { speak: 'rrr', hint: 'rain' },
  S: { speak: 'sss', hint: 'sun' },
  T: { speak: 'tuh', hint: 'top' },
  U: { speak: 'uh', hint: 'umbrella' },
  V: { speak: 'vvv', hint: 'van' },
  W: { speak: 'wuh', hint: 'web' },
  Y: { speak: 'yuh', hint: 'yellow' },
  Z: { speak: 'zzz', hint: 'zoo' },
}

export type UnitKind = 'words' | 'phrases'

export type Unit = {
  id: string
  label: string
  short: string
  kind: UnitKind
  color: string
  items: string[]
}

/** Fountain Valley School District kindergarten lists (2022). Unlock in this order. */
export const UNITS: Unit[] = [
  {
    id: 'words-1',
    label: 'Words 1',
    short: 'W1',
    kind: 'words',
    color: '#ff8fab',
    items: ['I', 'a', 'go', 'see', 'the', 'to', 'is', 'and', 'in', 'can'],
  },
  {
    id: 'phrases-1',
    label: 'Phrases 1',
    short: 'P1',
    kind: 'phrases',
    color: '#ffb4c8',
    items: ['I go', 'a can', 'go in', 'I see', 'I see the', 'go to', 'is the', 'and see', 'in the', 'can see'],
  },
  {
    id: 'words-2',
    label: 'Words 2',
    short: 'W2',
    kind: 'words',
    color: '#80ed99',
    items: ['you', 'he', 'like', 'we', 'it', 'up', 'no', 'at', 'my', 'an'],
  },
  {
    id: 'phrases-2',
    label: 'Phrases 2',
    short: 'P2',
    kind: 'phrases',
    color: '#b5f5c8',
    items: ['you can', 'he is', 'I like', 'we can', 'it is', 'up to', 'no go', 'at the', 'can my', 'see an'],
  },
  {
    id: 'words-3',
    label: 'Words 3',
    short: 'W3',
    kind: 'words',
    color: '#72ddf7',
    items: ['me', 'do', 'on', 'am', 'so', 'come', 'was', 'are', 'as', 'his'],
  },
  {
    id: 'phrases-3',
    label: 'Phrases 3',
    short: 'P3',
    kind: 'phrases',
    color: '#a8e8ff',
    items: ['like me', 'can do it', 'is on', 'I am', 'so you can', 'come to', 'it was', 'you are', 'as I go', 'I see his'],
  },
  {
    id: 'words-4',
    label: 'Words 4',
    short: 'W4',
    kind: 'words',
    color: '#ffd166',
    items: ['they', 'be', 'have', 'from', 'or', 'one', 'by', 'she', 'has', 'for'],
  },
  {
    id: 'phrases-4',
    label: 'Phrases 4',
    short: 'P4',
    kind: 'phrases',
    color: '#ffe29a',
    items: ['they like to', 'it can be', 'I have', 'from the', 'you or', 'the one', 'by his', 'she has', 'I can go', 'for his'],
  },
  {
    id: 'words-5',
    label: 'Words 5',
    short: 'W5',
    kind: 'words',
    color: '#c77dff',
    items: ['of', 'what', 'your', 'said', 'how', 'out', 'her', 'into', 'look', 'two'],
  },
  {
    id: 'phrases-5',
    label: 'Phrases 5',
    short: 'P5',
    kind: 'phrases',
    color: '#e0b0ff',
    items: [
      'out of the',
      'What is it',
      'I see your',
      'he said no',
      'how do I',
      'he is out',
      'it was her',
      'into the can',
      'look for the',
      'he is two',
    ],
  },
  {
    id: 'review-words',
    label: 'Review Words',
    short: 'R',
    kind: 'words',
    color: '#ffc078',
    items: ['you', 'come', 'are', 'was', 'they', 'have', 'from', 'what', 'said', 'how'],
  },
]

export const WORD_UNITS = UNITS.filter((unit) => unit.kind === 'words')
export const PHRASE_UNITS = UNITS.filter((unit) => unit.kind === 'phrases')
export const ALL_WORDS = WORD_UNITS.flatMap((unit) => unit.items)
export const ALL_PHRASES = PHRASE_UNITS.flatMap((unit) => unit.items)

export const PRAISE = [
  'Nice!',
  'You got it!',
  'Super star!',
  'Wow!',
  'Fantastic!',
  'Yes!',
  'Great job!',
  'Sparkly!',
  'Amazing!',
]

export const RETRY_PHRASES = ['Almost! Try again.', 'So close!', "Let's try once more!"]

export const LOOKALIKES: Record<string, string[]> = {
  A: ['H', 'R', 'V'],
  B: ['D', 'P', 'R'],
  C: ['G', 'O', 'Q'],
  D: ['B', 'P', 'O'],
  E: ['F', 'B', 'P'],
  F: ['E', 'P', 'T'],
  G: ['C', 'O', 'Q'],
  H: ['M', 'N', 'K'],
  I: ['L', 'J', 'T'],
  J: ['I', 'L', 'G'],
  K: ['H', 'R', 'X'],
  L: ['I', 'J', 'T'],
  M: ['N', 'W', 'H'],
  N: ['M', 'H', 'U'],
  O: ['C', 'Q', 'D'],
  P: ['B', 'D', 'R'],
  Q: ['O', 'G', 'C'],
  R: ['P', 'B', 'K'],
  S: ['Z', 'C', 'G'],
  T: ['I', 'L', 'F'],
  U: ['V', 'N', 'W'],
  V: ['U', 'Y', 'W'],
  W: ['M', 'V', 'U'],
  X: ['K', 'Y', 'Z'],
  Y: ['V', 'X', 'U'],
  Z: ['S', 'N', 'X'],
}

export const QUESTIONS_PER_ROUND = 8
export const MASTERY_NEEDED = 3
export const UNLOCK_RATIO = 0.8
export const DEFAULT_NAME = 'Goldie'

export function displayName(name: string) {
  const trimmed = name.trim()
  return trimmed.length > 0 ? trimmed : DEFAULT_NAME
}

export function speakItem(text: string) {
  return text.replace(/\bI\b/g, 'eye').replace(/\ba\b/g, 'uh').replace(/\bthe\b/gi, 'thuh')
}

export function unitById(id: string) {
  return UNITS.find((unit) => unit.id === id) ?? UNITS[0]!
}

export function unlockThreshold(unit: Unit) {
  return Math.ceil(unit.items.length * UNLOCK_RATIO)
}
