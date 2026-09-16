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

export type SightSet = {
  id: string
  label: string
  color: string
  words: string[]
}

export const SIGHT_SETS: SightSet[] = [
  { id: 'A', label: 'Set A', color: '#ff8fab', words: ['I', 'a', 'the', 'to', 'and'] },
  { id: 'B', label: 'Set B', color: '#80ed99', words: ['you', 'is', 'it', 'in', 'at'] },
  { id: 'C', label: 'Set C', color: '#72ddf7', words: ['me', 'my', 'we', 'go', 'see'] },
  { id: 'D', label: 'Set D', color: '#ffd166', words: ['can', 'look', 'like', 'for', 'on'] },
  { id: 'E', label: 'Set E', color: '#c77dff', words: ['he', 'she', 'said', 'come', 'here'] },
]

export const ALL_SIGHT_WORDS = SIGHT_SETS.flatMap((set) => set.words)

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

export function displayName(name: string) {
  const trimmed = name.trim()
  return trimmed.length > 0 ? trimmed : 'Friend'
}

export function speakSightWord(word: string) {
  const lower = word.toLowerCase()
  if (lower === 'a') return 'uh'
  if (lower === 'i') return 'eye'
  if (lower === 'the') return 'thuh'
  return word
}
