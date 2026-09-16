import { MASTERY_NEEDED, SIGHT_SETS } from './data'

export type Progress = {
  name: string
  stars: number
  letterCorrect: Record<string, number>
  wordCorrect: Record<string, number>
  lettersMastered: string[]
  wordsMastered: string[]
  unlockedSets: string[]
  muted: boolean
  bestStreak: number
}

const KEY = 'star-letters-progress-v1'

export function defaultProgress(): Progress {
  return {
    name: '',
    stars: 0,
    letterCorrect: {},
    wordCorrect: {},
    lettersMastered: [],
    wordsMastered: [],
    unlockedSets: ['A'],
    muted: false,
    bestStreak: 0,
  }
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultProgress()
    const parsed = JSON.parse(raw) as Partial<Progress>
    return { ...defaultProgress(), ...parsed, unlockedSets: parsed.unlockedSets?.length ? parsed.unlockedSets : ['A'] }
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(progress: Progress) {
  localStorage.setItem(KEY, JSON.stringify(progress))
}

function unique(items: string[]) {
  return [...new Set(items)]
}

function withMasteryUnlocks(progress: Progress): Progress {
  const unlocked = new Set(progress.unlockedSets)
  unlocked.add('A')
  for (let i = 0; i < SIGHT_SETS.length - 1; i++) {
    const set = SIGHT_SETS[i]
    const mastered = set.words.every((word) => progress.wordsMastered.includes(word))
    if (mastered) unlocked.add(SIGHT_SETS[i + 1].id)
    else break
  }
  return { ...progress, unlockedSets: unique([...unlocked]).sort() }
}

export function recordLetterCorrect(progress: Progress, letter: string): Progress {
  const key = letter.toUpperCase()
  const count = (progress.letterCorrect[key] ?? 0) + 1
  const lettersMastered = progress.lettersMastered.includes(key)
    ? progress.lettersMastered
    : count >= MASTERY_NEEDED
      ? [...progress.lettersMastered, key]
      : progress.lettersMastered
  return {
    ...progress,
    stars: progress.stars + 1,
    letterCorrect: { ...progress.letterCorrect, [key]: count },
    lettersMastered,
  }
}

export function recordWordCorrect(progress: Progress, word: string): Progress {
  const count = (progress.wordCorrect[word] ?? 0) + 1
  const wordsMastered = progress.wordsMastered.includes(word)
    ? progress.wordsMastered
    : count >= MASTERY_NEEDED
      ? [...progress.wordsMastered, word]
      : progress.wordsMastered
  return withMasteryUnlocks({
    ...progress,
    stars: progress.stars + 1,
    wordCorrect: { ...progress.wordCorrect, [word]: count },
    wordsMastered,
  })
}

export function recordStarOnly(progress: Progress): Progress {
  return { ...progress, stars: progress.stars + 1 }
}

export function recordBestStreak(progress: Progress, streak: number): Progress {
  if (streak <= progress.bestStreak) return progress
  return { ...progress, bestStreak: streak }
}

export function unlockNextSet(progress: Progress): Progress {
  const order = SIGHT_SETS.map((set) => set.id)
  const next = order.find((id) => !progress.unlockedSets.includes(id))
  if (!next) return progress
  return { ...progress, unlockedSets: unique([...progress.unlockedSets, next]).sort() }
}

export function unlockAllSets(progress: Progress): Progress {
  return { ...progress, unlockedSets: SIGHT_SETS.map((set) => set.id) }
}

export function resetProgress(name: string, muted: boolean): Progress {
  return { ...defaultProgress(), name, muted }
}
