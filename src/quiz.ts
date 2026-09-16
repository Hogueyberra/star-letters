import {
  ALL_SIGHT_WORDS,
  LETTERS,
  LETTER_NAMES,
  LETTER_SOUNDS,
  LOOKALIKES,
  QUESTIONS_PER_ROUND,
  SIGHT_SETS,
  SOUND_LETTERS,
  speakSightWord,
} from './data'
import type { Progress } from './storage'

export type DisplayKind = 'letter-upper' | 'letter-lower' | 'word' | 'speaker'

export type Question = {
  id: string
  skill: 'letter' | 'sound' | 'word'
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

function wordDecoys(correct: string, extra: string[], count: number) {
  const pool = shuffle([...extra, ...ALL_SIGHT_WORDS]).filter(
    (word, index, arr) => word !== correct && arr.indexOf(word) === index,
  )
  return pool.slice(0, count)
}

export function buildSightQuestions(setId: string): Question[] {
  const set = SIGHT_SETS.find((item) => item.id === setId) ?? SIGHT_SETS[0]
  const words = set?.words ?? ['I', 'a', 'the', 'to', 'and']
  const extra = SIGHT_SETS.filter((item) => item.id !== setId).flatMap((item) => item.words)
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

  return sequence.map((kind, index) => {
    const word = words[index % words.length] ?? 'the'
    if (kind === 'flash') {
      return {
        id: uid(),
        skill: 'word',
        target: word,
        prompt: 'Look · listen · tap',
        speak: speakSightWord(word),
        display: word,
        displayKind: 'word',
        choices: [],
        answer: word,
        style: 'flash',
      }
    }
    if (kind === 'match') {
      return {
        id: uid(),
        skill: 'word',
        target: word,
        prompt: 'Tap the word you hear',
        speak: `Tap the word ${speakSightWord(word)}.`,
        display: '',
        displayKind: 'speaker',
        choices: shuffle([word, ...wordDecoys(word, extra, 3)]),
        answer: word,
        style: 'choice',
      }
    }
    return {
      id: uid(),
      skill: 'word',
      target: word,
      prompt: 'Find this word',
      speak: `Find the word ${speakSightWord(word)}.`,
      display: word,
      displayKind: 'word',
      choices: shuffle([word, ...wordDecoys(word, extra, 5)]),
      answer: word,
      style: 'choice',
    }
  })
}

export function buildMixQuestions(progress: Progress): Question[] {
  const letterQs = buildLetterNameQuestions(progress).slice(0, 2)
  const soundQs = buildLetterSoundQuestions(progress).slice(0, 2)

  const unlockedWords = SIGHT_SETS.filter((set) => progress.unlockedSets.includes(set.id)).flatMap((set) => set.words)
  const learned = progress.wordsMastered.length > 0 ? progress.wordsMastered : unlockedWords
  const wordPool = learned.length > 0 ? learned : (SIGHT_SETS[0]?.words ?? ['I', 'a', 'the'])
  const extra = ALL_SIGHT_WORDS
  const wordQs: Question[] = shuffle(wordPool)
    .slice(0, 4)
    .map((word, index) => {
      if (index % 2 === 0) {
        return {
          id: uid(),
          skill: 'word' as const,
          target: word,
          prompt: 'Tap the word you hear',
          speak: `Tap the word ${speakSightWord(word)}.`,
          display: '',
          displayKind: 'speaker' as const,
          choices: shuffle([word, ...wordDecoys(word, extra, 3)]),
          answer: word,
          style: 'choice' as const,
        }
      }
      return {
        id: uid(),
        skill: 'word' as const,
        target: word,
        prompt: 'Find this word',
        speak: `Find the word ${speakSightWord(word)}.`,
        display: word,
        displayKind: 'word' as const,
        choices: shuffle([word, ...wordDecoys(word, extra, 3)]),
        answer: word,
        style: 'choice' as const,
      }
    })

  return shuffle([...letterQs, ...soundQs, ...wordQs]).slice(0, QUESTIONS_PER_ROUND)
}
