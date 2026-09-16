import {
  ALL_PHRASES,
  ALL_WORDS,
  LETTERS,
  LETTER_NAMES,
  LETTER_SOUNDS,
  LOOKALIKES,
  QUESTIONS_PER_ROUND,
  SOUND_LETTERS,
  UNITS,
  WORD_UNITS,
  speakItem,
  unitById,
  type Unit,
} from './data'
import type { Progress } from './storage'

export type DisplayKind = 'letter-upper' | 'letter-lower' | 'word' | 'phrase' | 'speaker'

export type Question = {
  id: string
  skill: 'letter' | 'sound' | 'word' | 'phrase'
  target: string
  prompt: string
  speak: string
  speakRate?: number
  display: string
  displayKind: DisplayKind
  choices: string[]
  answer: string
  style: 'choice' | 'flash'
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = next[i]
    const b = next[j]
    if (a === undefined || b === undefined) continue
    next[i] = b
    next[j] = a
  }
  return next
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function decoyLetters(correct: string, count: number) {
  const upper = correct.toUpperCase()
  const similar = (LOOKALIKES[upper] ?? []).filter((letter) => letter !== upper)
  const pool = shuffle([...similar, ...shuffle(LETTERS.filter((letter) => letter !== upper))]).filter(
    (letter, index, arr) => arr.indexOf(letter) === index,
  )
  return pool.slice(0, count)
}

function letterChoices(correct: string, asCase: 'upper' | 'lower', count = 4) {
  const decoys = decoyLetters(correct, count - 1)
  const styled = [correct, ...decoys].map((letter) => (asCase === 'upper' ? letter.toUpperCase() : letter.toLowerCase()))
  return shuffle(styled)
}

function shakyLetters(progress: Progress) {
  const shaky = LETTERS.filter((letter) => (progress.letterCorrect[letter] ?? 0) < 3)
  return shaky.length > 0 ? shaky : LETTERS
}

function shakySounds(progress: Progress) {
  const shaky = SOUND_LETTERS.filter((letter) => (progress.letterCorrect[letter] ?? 0) < 3)
  return shaky.length > 0 ? shaky : SOUND_LETTERS
}

export function buildLetterNameQuestions(progress: Progress): Question[] {
  const pool = shuffle(shakyLetters(progress))
  const letters = [...pool]
  while (letters.length < QUESTIONS_PER_ROUND) {
    letters.push(...shuffle(LETTERS))
  }

  return letters.slice(0, QUESTIONS_PER_ROUND).map((letter, index) => {
    const useLower = index % 2 === 1
    const shown = useLower ? letter.toLowerCase() : letter
    const choiceCase: 'upper' | 'lower' = useLower ? 'upper' : 'lower'
    const name = LETTER_NAMES[letter] ?? letter
    const variant = index % 3

    if (variant === 0) {
      const answer = choiceCase === 'upper' ? letter : letter.toLowerCase()
      return {
        id: uid(),
        skill: 'letter',
        target: letter,
        prompt: useLower ? 'Tap the big letter' : 'Tap the little letter',
        speak: `This is the letter ${name}. Tap the matching letter.`,
        display: shown,
        displayKind: useLower ? 'letter-lower' : 'letter-upper',
        choices: letterChoices(letter, choiceCase),
        answer,
        style: 'choice',
      }
    }

    if (variant === 1) {
      const answer = shown
      return {
        id: uid(),
        skill: 'letter',
        target: letter,
        prompt: 'Find the letter',
        speak: `Find the letter ${name}.`,
        display: '',
        displayKind: 'speaker',
        choices: letterChoices(letter, useLower ? 'lower' : 'upper'),
        answer,
        style: 'choice',
      }
    }

    const answer = shown
    return {
      id: uid(),
      skill: 'letter',
      target: letter,
      prompt: 'Tap the same letter',
      speak: `This is ${name}. Tap ${name}.`,
      display: shown,
      displayKind: useLower ? 'letter-lower' : 'letter-upper',
      choices: letterChoices(letter, useLower ? 'lower' : 'upper'),
      answer,
      style: 'choice',
    }
  })
}

export function buildLetterSoundQuestions(progress: Progress): Question[] {
  const pool = shuffle(shakySounds(progress))
  const letters = [...pool]
  while (letters.length < QUESTIONS_PER_ROUND) {
    letters.push(...shuffle(SOUND_LETTERS))
  }

  return letters.slice(0, QUESTIONS_PER_ROUND).map((letter, index) => {
    const sound = LETTER_SOUNDS[letter]
    const useLower = index % 2 === 1
    const shown = useLower ? letter.toLowerCase() : letter
    const answer = shown
    const speakSound = sound?.speak ?? letter.toLowerCase()
    const hint = sound?.hint ?? letter

    if (index % 2 === 0) {
      return {
        id: uid(),
        skill: 'sound',
        target: letter,
        prompt: 'Which letter makes that sound?',
        speak: `Which letter says ${speakSound}? Like ${hint}.`,
        speakRate: 0.82,
        display: '',
        displayKind: 'speaker',
        choices: letterChoices(letter, useLower ? 'lower' : 'upper'),
        answer,
        style: 'choice',
      }
    }

    return {
      id: uid(),
      skill: 'sound',
      target: letter,
      prompt: 'Tap the letter that makes this sound',
      speak: `This letter says ${speakSound}. Tap ${speakSound}.`,
      speakRate: 0.82,
      display: shown,
      displayKind: useLower ? 'letter-lower' : 'letter-upper',
      choices: letterChoices(letter, useLower ? 'lower' : 'upper'),
      answer,
      style: 'choice',
    }
  })
}

function itemDecoys(correct: string, sameUnit: string[], extra: string[], count: number) {
  const pool = shuffle([...sameUnit.filter((item) => item !== correct), ...extra]).filter(
    (item, index, arr) => item !== correct && arr.indexOf(item) === index,
  )
  return pool.slice(0, count)
}

function fillItems(items: string[], count: number) {
  const filled = [...shuffle(items)]
  while (filled.length < count) {
    filled.push(...shuffle(items))
  }
  return filled.slice(0, count)
}

export function buildWordQuestions(unitId: string): Question[] {
  const unit = unitById(unitId)
  const words = unit.items
  const extra = ALL_WORDS
  const sequence: Array<'flash' | 'match' | 'find'> = shuffle([
    'flash',
    'flash',
    'match',
    'match',
    'match',
    'find',
    'find',
    'find',
  ])
  const picked = fillItems(words, sequence.length)

  return sequence.map((kind, index) => {
    const word = picked[index] ?? 'the'
    if (kind === 'flash') {
      return {
        id: uid(),
        skill: 'word' as const,
        target: word,
        prompt: 'Look · listen · tap',
        speak: speakItem(word),
        display: word,
        displayKind: 'word' as const,
        choices: [],
        answer: word,
        style: 'flash' as const,
      }
    }
    if (kind === 'match') {
      return {
        id: uid(),
        skill: 'word' as const,
        target: word,
        prompt: 'Tap the word you hear',
        speak: `Tap the word ${speakItem(word)}.`,
        display: '',
        displayKind: 'speaker' as const,
        choices: shuffle([word, ...itemDecoys(word, words, extra, 3)]),
        answer: word,
        style: 'choice' as const,
      }
    }
    return {
      id: uid(),
      skill: 'word' as const,
      target: word,
      prompt: 'Find this word',
      speak: `Find the word ${speakItem(word)}.`,
      display: word,
      displayKind: 'word' as const,
      choices: shuffle([word, ...itemDecoys(word, words, extra, 5)]),
      answer: word,
      style: 'choice' as const,
    }
  })
}

export function buildPhraseQuestions(unitId: string): Question[] {
  const unit = unitById(unitId)
  const phrases = unit.items
  const extra = ALL_PHRASES
  const sequence: Array<'flash' | 'match'> = shuffle([
    'flash',
    'flash',
    'match',
    'match',
    'match',
    'match',
    'match',
    'match',
  ])
  const picked = fillItems(phrases, sequence.length)

  return sequence.map((kind, index) => {
    const phrase = picked[index] ?? 'I go'
    if (kind === 'flash') {
      return {
        id: uid(),
        skill: 'phrase' as const,
        target: phrase,
        prompt: 'Look · listen · tap',
        speak: speakItem(phrase),
        speakRate: 0.84,
        display: phrase,
        displayKind: 'phrase' as const,
        choices: [],
        answer: phrase,
        style: 'flash' as const,
      }
    }
    return {
      id: uid(),
      skill: 'phrase' as const,
      target: phrase,
      prompt: 'Tap the phrase you hear',
      speak: `Tap ${speakItem(phrase)}.`,
      speakRate: 0.84,
      display: '',
      displayKind: 'speaker' as const,
      choices: shuffle([phrase, ...itemDecoys(phrase, phrases, extra, 3)]),
      answer: phrase,
      style: 'choice' as const,
    }
  })
}

function unlockedItems(progress: Progress, kind: Unit['kind']) {
  const units = UNITS.filter((unit) => unit.kind === kind && progress.unlockedUnits.includes(unit.id))
  const items = units.flatMap((unit) => unit.items)
  const unique = items.filter((item, index) => items.indexOf(item) === index)
  return unique
}

export function buildMixQuestions(progress: Progress): Question[] {
  const letterQs = buildLetterNameQuestions(progress).slice(0, 2)
  const soundQs = buildLetterSoundQuestions(progress).slice(0, 2)
  const words = unlockedItems(progress, 'words')
  const phrases = unlockedItems(progress, 'phrases')
  const wordPool = words.length > 0 ? words : (WORD_UNITS[0]?.items ?? ['I', 'a', 'the'])
  const extraWords = ALL_WORDS
  const extraPhrases = ALL_PHRASES

  const wordCount = phrases.length > 0 ? 2 : 4
  const wordQs: Question[] = shuffle(wordPool)
    .slice(0, wordCount)
    .map((word, index) => {
      if (index % 2 === 0) {
        return {
          id: uid(),
          skill: 'word' as const,
          target: word,
          prompt: 'Tap the word you hear',
          speak: `Tap the word ${speakItem(word)}.`,
          display: '',
          displayKind: 'speaker' as const,
          choices: shuffle([word, ...itemDecoys(word, wordPool, extraWords, 3)]),
          answer: word,
          style: 'choice' as const,
        }
      }
      return {
        id: uid(),
        skill: 'word' as const,
        target: word,
        prompt: 'Find this word',
        speak: `Find the word ${speakItem(word)}.`,
        display: word,
        displayKind: 'word' as const,
        choices: shuffle([word, ...itemDecoys(word, wordPool, extraWords, 3)]),
        answer: word,
        style: 'choice' as const,
      }
    })

  const phraseQs: Question[] =
    phrases.length === 0
      ? []
      : shuffle(phrases)
          .slice(0, 2)
          .map((phrase) => ({
            id: uid(),
            skill: 'phrase' as const,
            target: phrase,
            prompt: 'Tap the phrase you hear',
            speak: `Tap ${speakItem(phrase)}.`,
            speakRate: 0.84,
            display: '',
            displayKind: 'speaker' as const,
            choices: shuffle([phrase, ...itemDecoys(phrase, phrases, extraPhrases, 3)]),
            answer: phrase,
            style: 'choice' as const,
          }))

  return shuffle([...letterQs, ...soundQs, ...wordQs, ...phraseQs]).slice(0, QUESTIONS_PER_ROUND)
}

export function buildUnitQuestions(unitId: string) {
  const unit = unitById(unitId)
  return unit.kind === 'phrases' ? buildPhraseQuestions(unitId) : buildWordQuestions(unitId)
}
