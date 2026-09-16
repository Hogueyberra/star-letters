import { useEffect } from 'react'
import { greetGoldie, unlockAudio } from '../audio'
import { displayName, PHRASE_UNITS, UNITS, WORD_UNITS, type UnitKind } from '../data'
import { focusStatus, masteredInUnit, type Progress } from '../storage'
import { MuteButton, StarMascot } from './Chrome'

type Mode = 'letters' | 'sounds' | 'words' | 'phrases' | 'mix'

export function HomeScreen({
  progress,
  onName,
  onMute,
  onOpenTips,
  onPlay,
}: {
  progress: Progress
  onName: (name: string) => void
  onMute: () => void
  onOpenTips: () => void
  onPlay: (mode: Mode) => void
}) {
  const hello = displayName(progress.name)
  const focus = focusStatus(progress)
  const percent = Math.round((focus.mastered / focus.total) * 100)

  useEffect(() => {
    const helloOnce = () => {
      void unlockAudio()
      greetGoldie(progress.muted)
    }
    window.addEventListener('pointerdown', helloOnce, { once: true })
    return () => window.removeEventListener('pointerdown', helloOnce)
  }, [progress.muted])

  return (
    <section className="home">
      <header className="topbar">
        <div className="brand">
          <img src="/logo.svg" width={48} height={48} alt="" className="brand-logo" />
          <div>
            <p className="eyebrow">Let’s play</p>
            <h1>Star Letters</h1>
          </div>
        </div>
        <div className="top-actions">
          <MuteButton muted={progress.muted} onToggle={onMute} />
          <button type="button" className="text-link" onClick={onOpenTips}>
            Tips
          </button>
        </div>
      </header>

      <div className="hello-card">
        <StarMascot mood="idle" size={92} />
        <div className="hello-copy">
          <label className="name-label" htmlFor="kid-name">
            What’s your name?
          </label>
          <input
            id="kid-name"
            className="name-input"
            value={progress.name}
            placeholder="Goldie"
            maxLength={18}
            autoComplete="nickname"
            onChange={(event) => onName(event.target.value)}
          />
          <p className="hello-line">
            Hi, <span>{hello}</span>!
          </p>
        </div>
        <div className="star-pill" aria-label={`${progress.stars} stars`}>
          <span aria-hidden="true">⭐</span>
          <strong>{progress.stars}</strong>
          <span>stars</span>
        </div>
      </div>

      <div className="unit-banner">
        {focus.allDone ? (
          <p>
            You finished the FVSD list, <span>{hello}</span>! Keep playing Review Words.
          </p>
        ) : (
          <p>
            Now: <strong>{focus.unit.label}</strong>
            <span className="unit-count">
              {' '}
              · {focus.mastered}/{focus.total} mastered ({focus.needed} unlocks the next unit)
            </span>
          </p>
        )}
        <div className="unit-meter" aria-hidden="true">
          <span style={{ width: `${Math.min(100, percent)}%` }} />
        </div>
      </div>

      <div className="mode-grid">
        <button type="button" className="mode-card coral" onClick={() => onPlay('letters')}>
          <span className="mode-glyph">Aa</span>
          <span className="mode-title">Letters</span>
          <span className="mode-sub">Names of letters</span>
        </button>
        <button type="button" className="mode-card mint" onClick={() => onPlay('sounds')}>
          <span className="mode-glyph">🔊</span>
          <span className="mode-title">Sounds</span>
          <span className="mode-sub">What letters say</span>
        </button>
        <button type="button" className="mode-card lavender" onClick={() => onPlay('words')}>
          <span className="mode-glyph">the</span>
          <span className="mode-title">Words</span>
          <span className="mode-sub">FVSD sight words</span>
        </button>
        <button type="button" className="mode-card peach" onClick={() => onPlay('phrases')}>
          <span className="mode-glyph">I go</span>
          <span className="mode-title">Phrases</span>
          <span className="mode-sub">Flash, hear, match</span>
        </button>
        <button type="button" className="mode-card sun wide" onClick={() => onPlay('mix')}>
          <span className="mode-glyph">★</span>
          <span className="mode-copy">
            <span className="mode-title">Mix Review</span>
            <span className="mode-sub">Letters, words, and phrases together</span>
          </span>
        </button>
      </div>

      {(progress.lettersMastered.length > 0 || progress.itemsMastered.length > 0) && (
        <p className="mastery-line">
          You know {progress.lettersMastered.length} letters
          {progress.itemsMastered.length > 0 ? ` · ${progress.itemsMastered.length} words & phrases` : ''}
        </p>
      )}

      <p className="set-preview" aria-label="Unit path">
        {UNITS.map((unit) => (
          <span
            key={unit.id}
            className={`set-chip ${progress.unlockedUnits.includes(unit.id) ? 'on' : ''} ${
              unit.id === focus.unit.id ? 'current' : ''
            }`}
            title={unit.label}
          >
            {unit.short}
          </span>
        ))}
      </p>
    </section>
  )
}

export function UnitPicker({
  kind,
  progress,
  onBack,
  onMute,
  onChoose,
}: {
  kind: UnitKind
  progress: Progress
  onBack: () => void
  onMute: () => void
  onChoose: (unitId: string) => void
}) {
  const units = kind === 'phrases' ? PHRASE_UNITS : WORD_UNITS
  const title = kind === 'phrases' ? 'Phrases' : 'Words'
  const anyUnlocked = units.some((unit) => progress.unlockedUnits.includes(unit.id))
  const lead = !anyUnlocked
    ? 'This unlocks after the unit before it — or a grown-up can open Tips.'
    : kind === 'phrases'
      ? 'Look, listen, and tap the matching phrase.'
      : 'Flash, match, and find — FVSD sight words.'

  return (
    <section className="home sight-home">
      <header className="topbar">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Back home">
          ←
        </button>
        <h1 className="screen-title">{title}</h1>
        <div className="top-actions">
          <span className="star-mini">⭐ {progress.stars}</span>
          <MuteButton muted={progress.muted} onToggle={onMute} />
        </div>
      </header>
      <p className="picker-lead">{lead}</p>
      <div className="set-grid">
        {units.map((unit) => {
          const unlocked = progress.unlockedUnits.includes(unit.id)
          const masteredCount = masteredInUnit(unit, progress)
          return (
            <button
              key={unit.id}
              type="button"
              className={`set-card ${unlocked ? '' : 'locked'}`}
              style={{ ['--set-color' as string]: unit.color }}
              onClick={() => unlocked && onChoose(unit.id)}
              disabled={!unlocked}
              aria-label={unlocked ? `${unit.label}: ${unit.items.join(', ')}` : `${unit.label} locked`}
            >
              <span className="set-name">{unlocked ? unit.label : `🔒 ${unit.label}`}</span>
              <span className={`set-words ${kind === 'phrases' ? 'set-phrases' : ''}`}>{unit.items.join('  ·  ')}</span>
              <span className="set-progress">
                {masteredCount}/{unit.items.length} mastered
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
