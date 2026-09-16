import { useCallback, useEffect, useRef, useState } from 'react'
import { playBoop, playFanfare, playSparkle, speakClip, speakSkill, stopSpeech } from '../audio'
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
  makeQuestions,
  progress,
  onProgress,
  onMute,
  onHome,
  onAgain,
}: {
  title: string
  makeQuestions: () => Question[]
  progress: Progress
  onProgress: (next: Progress) => void
  onMute: () => void
  onHome: () => void
  onAgain: () => void
}) {
  const [questions] = useState(makeQuestions)
  const [index, setIndex] = useState(0)
  const [wrongPicks, setWrongPicks] = useState<string[]>([])
  const [status, setStatus] = useState<'playing' | 'correct' | 'done'>('playing')
  const [praise, setPraise] = useState('Nice!')
  const [streak, setStreak] = useState(0)
  const [burstId, setBurstId] = useState(0)
  const [earned, setEarned] = useState(0)
  const [shake, setShake] = useState<string | null>(null)
  const [mood, setMood] = useState<'idle' | 'happy' | 'oops' | 'cheer'>('idle')
  const progressRef = useRef(progress)
  progressRef.current = progress

  const question = questions[index]
  const done = status === 'done' || !question

  const speakQuestion = useCallback((q: Question, muted: boolean) => {
    speakSkill(q.skill, q.target, muted)
  }, [])

  useEffect(() => {
    if (!question || status !== 'playing') return
    const timer = window.setTimeout(() => speakQuestion(question, progressRef.current.muted), 280)
    return () => window.clearTimeout(timer)
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
          speakQuestion(question, progressRef.current.muted)
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

  function award(nextProgress: Progress, nextStreak: number) {
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
    if (superStar) {
      playFanfare(withStreak.muted)
      speakClip('ui.super_star', withStreak.muted, 'Super star!')
    } else if (nextStreak === 1) {
      speakClip('ui.you_got_it', withStreak.muted, 'You got it!')
    }
  }

  function completeFlash() {
    if (!question || status !== 'playing') return
    const nextProgress = recordStarOnly(progressRef.current)
    award(nextProgress, streak + 1)
  }

  function pickChoice(choice: string) {
    if (!question || status !== 'playing') return
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
    speakClip('ui.nice_try', progressRef.current.muted, 'Nice try!')
    window.setTimeout(() => setShake(null), 420)
    window.setTimeout(() => setMood('idle'), 700)
  }

  function goNext() {
    stopSpeech()
    const nextIndex = index + 1
    if (nextIndex >= questions.length) {
      setStatus('done')
      setMood('cheer')
      playFanfare(progressRef.current.muted)
      speakClip('ui.super_star', progressRef.current.muted, 'Super star!')
      return
    }
    setIndex(nextIndex)
    setWrongPicks([])
    setStatus('playing')
    setMood('idle')
  }

  useEffect(() => {
    if (status !== 'correct') return
    const timer = window.setTimeout(goNext, 1150)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

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
            onClick={() => speakQuestion(question, progress.muted)}
            aria-label="Hear the question again"
          >
            🔊
          </button>
        ) : (
          <button
            type="button"
            className={`big-display ${question.displayKind}`}
            onClick={() => speakQuestion(question, progress.muted)}
            aria-label={`Shown: ${question.display}. Hear it again.`}
          >
            {question.display}
          </button>
        )}
        <button
          type="button"
          className="hear-again"
          onClick={() => speakQuestion(question, progress.muted)}
        >
          Hear again
        </button>
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
