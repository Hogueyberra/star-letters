import { useCallback, useEffect, useRef, useState } from 'react'
import {
  playBoop,
  playFanfare,
  playSparkle,
  speakClip,
  speakSkill,
  stopSpeech,
  unlockAudio,
  whenAudioUnlocked,
} from '../audio'
import { displayName, PRAISE } from '../data'
import type { Question } from '../quiz'
import {
  recordBestStreak,
  recordLetterCorrect,
  recordStarOnly,
  recordItemCorrect,
  type Progress,
} from '../storage'
import { Confetti, MuteButton, StarMascot } from './Chrome'

function pickPhrase(list: string[]) {
  return list[Math.floor(Math.random() * list.length)] ?? list[0] ?? ''
}

export function PlayRound({
  title,
  questions,
  primedId,
  progress,
  onProgress,
  onMute,
  onHome,
  onAgain,
}: {
  title: string
  questions: Question[]
  primedId?: string
  progress: Progress
  onProgress: (next: Progress) => void
  onMute: () => void
  onHome: () => void
  onAgain: () => void
}) {
  const [index, setIndex] = useState(0)
  const [wrongPicks, setWrongPicks] = useState<string[]>([])
  const [status, setStatus] = useState<'playing' | 'correct' | 'done'>('playing')
  const [praise, setPraise] = useState('Nice!')
  const [streak, setStreak] = useState(0)
  const [burstId, setBurstId] = useState(0)
  const [earned, setEarned] = useState(0)
  const [shake, setShake] = useState<string | null>(null)
  const [mood, setMood] = useState<'idle' | 'happy' | 'oops' | 'cheer'>('idle')
  const [tapToHear, setTapToHear] = useState(false)
  const progressRef = useRef(progress)
  progressRef.current = progress
  const spokenRef = useRef<string | null>(primedId ?? null)
  const indexRef = useRef(0)
  indexRef.current = index

  const question = questions[index]
  const done = status === 'done' || !question

  const speakQuestion = useCallback((q: Question, muted: boolean) => {
    spokenRef.current = q.id
    return speakSkill(q.skill, q.target, muted).then((played) => {
      if (!played) setTapToHear(true)
      return played
    })
  }, [])

  const hearQuestion = useCallback(
    (q: Question, muted: boolean) => {
      void unlockAudio()
      stopSpeech()
      setTapToHear(false)
      void speakQuestion(q, muted)
    },
    [speakQuestion],
  )

  useEffect(() => {
    if (!question || status !== 'playing') return
    if (spokenRef.current === question.id) return
    setTapToHear(false)
    let cancelled = false
    const timer = window.setTimeout(() => {
      void whenAudioUnlocked().then((ok) => {
        if (cancelled || progressRef.current.muted) return
        if (spokenRef.current === question.id) return
        if (!ok) {
          setTapToHear(true)
          return
        }
        void speakQuestion(question, progressRef.current.muted).then((played) => {
          if (!cancelled && !played && spokenRef.current !== question.id) setTapToHear(true)
        })
      })
    }, 280)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [question, status, speakQuestion])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        stopSpeech()
        onHome()
        return
      }
      if (!question || status !== 'playing') return
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        if (question.style === 'flash') {
          completeFlash()
        } else {
          hearQuestion(question, progressRef.current.muted)
        }
        return
      }
      const num = Number(event.key)
      if (num >= 1 && num <= question.choices.length) {
        const choice = question.choices[num - 1]
        if (choice) pickChoice(choice)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [question, status, onHome, speakQuestion, wrongPicks, streak])

  function advanceAndSpeakNext() {
    const nextIndex = indexRef.current + 1
    const nextQuestion = questions[nextIndex]
    if (!nextQuestion) {
      setStatus('done')
      setMood('cheer')
      playFanfare(progressRef.current.muted)
      void speakClip('ui.super_star', progressRef.current.muted)
      return
    }
    setIndex(nextIndex)
    setWrongPicks([])
    setStatus('playing')
    setMood('idle')
    setTapToHear(false)
    void speakQuestion(nextQuestion, progressRef.current.muted)
  }

  function award(nextProgress: Progress, nextStreak: number) {
    void unlockAudio()
    const withStreak = recordBestStreak(nextProgress, nextStreak)
    onProgress(withStreak)
    setEarned((count) => count + 1)
    setStreak(nextStreak)
    const superStar = nextStreak > 0 && nextStreak % 3 === 0
    const line = superStar ? 'Super star!' : nextStreak === 1 ? 'You got it!' : pickPhrase(PRAISE)
    setPraise(line)
    setMood(nextStreak >= 3 ? 'cheer' : 'happy')
    setStatus('correct')
    setBurstId((id) => (superStar ? id + 1 : id))
    playSparkle(withStreak.muted)
    const praiseKey = superStar ? 'ui.super_star' : nextStreak === 1 ? 'ui.you_got_it' : null
    if (superStar) playFanfare(withStreak.muted)
    if (praiseKey && !withStreak.muted) {
      void speakClip(praiseKey, withStreak.muted).then(() => {
        advanceAndSpeakNext()
      })
      return
    }
    advanceAndSpeakNext()
  }

  function completeFlash() {
    if (!question || status !== 'playing') return
    const nextProgress = recordStarOnly(progressRef.current)
    award(nextProgress, streak + 1)
  }

  function pickChoice(choice: string) {
    if (!question || status !== 'playing') return
    void unlockAudio()
    if (wrongPicks.includes(choice)) return
    const correct = choice === question.answer
    if (correct) {
      let nextProgress = progressRef.current
      if (question.skill === 'word' || question.skill === 'phrase') {
        nextProgress = recordItemCorrect(nextProgress, question.target)
      } else {
        nextProgress = recordLetterCorrect(nextProgress, question.target)
      }
      award(nextProgress, streak + 1)
      return
    }

    playBoop(progressRef.current.muted)
    setMood('oops')
    setShake(choice)
    setWrongPicks((picks) => [...picks, choice])
    setStreak(0)
    void speakClip('ui.nice_try', progressRef.current.muted)
    window.setTimeout(() => setShake(null), 420)
    window.setTimeout(() => setMood('idle'), 700)
  }

  if (done || !question) {
    return (
      <section className="game">
        <header className="topbar">
          <button type="button" className="icon-btn" onClick={onHome} aria-label="Back home">
            ←
          </button>
          <h1 className="screen-title">{title}</h1>
          <div className="top-actions">
            <span className="star-mini">⭐ {progress.stars}</span>
            <MuteButton muted={progress.muted} onToggle={onMute} />
          </div>
        </header>
        <div className="complete-card">
          <StarMascot mood="cheer" size={120} />
          <h2>Amazing work, {displayName(progress.name)}!</h2>
          <p className="complete-stars">⭐ {earned} stars this round</p>
          <div className="complete-actions">
            <button type="button" className="choice-btn play-again" onClick={onAgain}>
              Play again
            </button>
            <button type="button" className="choice-btn home-again" onClick={onHome}>
              Home
            </button>
          </div>
        </div>
        <Confetti burstId={Math.max(burstId, 1)} />
      </section>
    )
  }

  const showHint = wrongPicks.length >= 2
  const phraseChoices = question.skill === 'phrase' || question.choices.some((choice) => choice.includes(' '))
  const choiceClass = [
    'choices',
    question.choices.length > 4 ? 'choices-wide' : '',
    phraseChoices ? 'choices-phrase' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className="game">
      <header className="topbar">
        <button type="button" className="icon-btn" onClick={onHome} aria-label="Back home">
          ←
        </button>
        <h1 className="screen-title">{title}</h1>
        <div className="top-actions">
          <span className="star-mini">⭐ {progress.stars}</span>
          <MuteButton muted={progress.muted} onToggle={onMute} />
        </div>
      </header>

      <div className="round-dots" aria-label={`Question ${index + 1} of ${questions.length}`}>
        {questions.map((item, i) => (
          <span key={item.id} className={`dot ${i < index ? 'done' : ''} ${i === index ? 'now' : ''}`} />
        ))}
      </div>

      <div className="prompt-row">
        <StarMascot mood={mood} size={72} />
        <p className="prompt">{question.prompt}</p>
        {streak >= 2 && (
          <span className="streak-pill" aria-label={`Streak ${streak}`}>
            🔥 {streak}
          </span>
        )}
      </div>

      <div className={`stage ${status === 'correct' ? 'stage-win' : ''}`}>
        {question.displayKind === 'speaker' ? (
          <button
            type="button"
            className="hear-giant"
            onClick={() => hearQuestion(question, progress.muted)}
            aria-label="Hear the question again"
          >
            🔊
          </button>
        ) : (
          <button
            type="button"
            className={`big-display ${question.displayKind}`}
            onClick={() => hearQuestion(question, progress.muted)}
            aria-label={`Shown: ${question.display}. Hear it again.`}
          >
            {question.display}
          </button>
        )}
        <button
          type="button"
          className="hear-again"
          onClick={() => hearQuestion(question, progress.muted)}
        >
          Hear again
        </button>
        {tapToHear && <p className="hear-hint">Tap Hear again if it’s quiet</p>}
      </div>

      {question.style === 'flash' ? (
        <button type="button" className="choice-btn next-flash" onClick={completeFlash}>
          I heard it! ⭐
        </button>
      ) : (
        <div className={choiceClass}>
          {question.choices.map((choice) => {
            const isWrong = wrongPicks.includes(choice)
            const isAnswer = choice === question.answer
            return (
              <button
                key={choice}
                type="button"
                className={[
                  'choice-btn',
                  phraseChoices ? 'phrase-choice' : '',
                  shake === choice ? 'shake' : '',
                  isWrong ? 'wrong' : '',
                  showHint && isAnswer ? 'hint' : '',
                  status === 'correct' && isAnswer ? 'correct' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => pickChoice(choice)}
                disabled={isWrong || status !== 'playing'}
              >
                {choice}
              </button>
            )
          })}
        </div>
      )}

      {status === 'correct' && <p className="praise">{praise}</p>}
      <Confetti burstId={burstId} />
    </section>
  )
}
