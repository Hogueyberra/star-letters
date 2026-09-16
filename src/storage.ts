import { DEFAULT_NAME, MASTERY_NEEDED, UNITS, unlockThreshold, type Unit } from './data'

export type Progress = {
  name: string
  stars: number
  letterCorrect: Record<string, number>
  itemCorrect: Record<string, number>
  lettersMastered: string[]
  itemsMastered: string[]
  unlockedUnits: string[]
  muted: boolean
  bestStreak: number
}

const KEY = 'star-letters-goldie-fvsd-v1'
const FIRST_UNIT = UNITS[0]?.id ?? 'words-1'

export function defaultProgress(): Progress {
  return {
    name: DEFAULT_NAME,
    stars: 0,
    letterCorrect: {},
    itemCorrect: {},
    lettersMastered: [],
    itemsMastered: [],
    unlockedUnits: [FIRST_UNIT],
    muted: false,
    bestStreak: 0,
  }
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultProgress()
    const parsed = JSON.parse(raw) as Partial<Progress>
    const unlocked = parsed.unlockedUnits?.length ? parsed.unlockedUnits : [FIRST_UNIT]
    return {
      ...defaultProgress(),
      ...parsed,
      name: parsed.name ?? DEFAULT_NAME,
      unlockedUnits: unlocked.includes(FIRST_UNIT) ? unlocked : [FIRST_UNIT, ...unlocked],
    }
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(progress: Progress) {
  localStorage.setItem(KEY, JSON.stringify(progress))
}

export function masteredInUnit(unit: Unit, progress: Progress) {
  return unit.items.filter((item) => progress.itemsMastered.includes(item)).length
}

export function unitIsReady(unit: Unit, progress: Progress) {
  return masteredInUnit(unit, progress) >= unlockThreshold(unit)
}

function withMasteryUnlocks(progress: Progress): Progress {
  const unlocked = new Set(progress.unlockedUnits)
  unlocked.add(FIRST_UNIT)
  for (let i = 0; i < UNITS.length - 1; i++) {
    const unit = UNITS[i]
    const next = UNITS[i + 1]
    if (!unit || !next) continue
    if (!unlocked.has(unit.id)) break
    if (unitIsReady(unit, progress)) unlocked.add(next.id)
  }
  return {
    ...progress,
    unlockedUnits: UNITS.map((unit) => unit.id).filter((id) => unlocked.has(id)),
  }
}

export type FocusStatus = {
  unit: Unit
  mastered: number
  needed: number
  total: number
  allDone: boolean
}

export function focusStatus(progress: Progress): FocusStatus {
  const fallback: Unit = UNITS[0] ?? {
    id: 'words-1',
    label: 'Words 1',
    short: 'W1',
    kind: 'words',
    color: '#ff8fab',
    items: ['I', 'a', 'go', 'see', 'the', 'to', 'is', 'and', 'in', 'can'],
  }

  for (const unit of UNITS) {
    if (!progress.unlockedUnits.includes(unit.id)) {
      return {
        unit,
        mastered: masteredInUnit(unit, progress),
        needed: unlockThreshold(unit),
        total: unit.items.length,
        allDone: false,
      }
    }
    if (!unitIsReady(unit, progress)) {
      return {
        unit,
        mastered: masteredInUnit(unit, progress),
        needed: unlockThreshold(unit),
        total: unit.items.length,
        allDone: false,
      }
    }
  }

  const last = UNITS[UNITS.length - 1] ?? fallback
  return {
    unit: last,
    mastered: masteredInUnit(last, progress),
    needed: unlockThreshold(last),
    total: last.items.length,
    allDone: true,
  }
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

export function recordItemCorrect(progress: Progress, item: string): Progress {
  const count = (progress.itemCorrect[item] ?? 0) + 1
  const itemsMastered = progress.itemsMastered.includes(item)
    ? progress.itemsMastered
    : count >= MASTERY_NEEDED
      ? [...progress.itemsMastered, item]
      : progress.itemsMastered
  return withMasteryUnlocks({
    ...progress,
    stars: progress.stars + 1,
    itemCorrect: { ...progress.itemCorrect, [item]: count },
    itemsMastered,
  })
}

export function recordStarOnly(progress: Progress): Progress {
  return { ...progress, stars: progress.stars + 1 }
}

export function recordBestStreak(progress: Progress, streak: number): Progress {
  if (streak <= progress.bestStreak) return progress
  return { ...progress, bestStreak: streak }
}

export function unlockNextUnit(progress: Progress): Progress {
  const next = UNITS.find((unit) => !progress.unlockedUnits.includes(unit.id))
  if (!next) return progress
  return {
    ...progress,
    unlockedUnits: UNITS.map((unit) => unit.id).filter(
      (id) => progress.unlockedUnits.includes(id) || id === next.id,
    ),
  }
}

export function unlockAllUnits(progress: Progress): Progress {
  return { ...progress, unlockedUnits: UNITS.map((unit) => unit.id) }
}

export function resetProgress(name: string, muted: boolean): Progress {
  return { ...defaultProgress(), name: name.trim() ? name : DEFAULT_NAME, muted }
}

export function canUnlockMore(progress: Progress) {
  return UNITS.some((unit) => !progress.unlockedUnits.includes(unit.id))
}
