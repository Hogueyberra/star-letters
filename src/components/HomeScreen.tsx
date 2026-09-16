import { displayName, SIGHT_SETS } from '../data'
import type { Progress } from '../storage'
import { MuteButton, StarMascot } from './Chrome'

type Mode = 'letters' | 'sounds' | 'sight' | 'mix'

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
            placeholder="Friend"
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
        <button type="button" className="mode-card lavender" onClick={() => onPlay('sight')}>
          <span className="mode-glyph">the</span>
          <span className="mode-title">Sight Words</span>
          <span className="mode-sub">{progress.unlockedSets.length} sets ready</span>
        </button>
        <button type="button" className="mode-card sun" onClick={() => onPlay('mix')}>
          <span className="mode-glyph">★</span>
          <span className="mode-title">Mix Review</span>
          <span className="mode-sub">A little of everything</span>
        </button>
      </div>

      {(progress.lettersMastered.length > 0 || progress.wordsMastered.length > 0) && (
        <p className="mastery-line">
          You know {progress.lettersMastered.length} letters
          {progress.wordsMastered.length > 0 ? ` · ${progress.wordsMastered.length} sight words` : ''}
        </p>
      )}

      <p className="set-preview">
        {SIGHT_SETS.map((set) => (
          <span key={set.id} className={progress.unlockedSets.includes(set.id) ? 'set-chip on' : 'set-chip'}>
            {set.id}
          </span>
        ))}
      </p>
    </section>
  )
}

export function SightPicker({
  progress,
  onBack,
  onMute,
  onChoose,
}: {
  progress: Progress
  onBack: () => void
  onMute: () => void
  onChoose: (setId: string) => void
}) {
  return (
    <section className="home sight-home">
      <header className="topbar">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Back home">
          ←
        </button>
        <h1 className="screen-title">Sight Words</h1>
        <div className="top-actions">
          <span className="star-mini">⭐ {progress.stars}</span>
          <MuteButton muted={progress.muted} onToggle={onMute} />
        </div>
      </header>
      <p className="picker-lead">Pick a set. Flash, match, and find are mixed in for you.</p>
      <div className="set-grid">
        {SIGHT_SETS.map((set) => {
          const unlocked = progress.unlockedSets.includes(set.id)
          const masteredCount = set.words.filter((word) => progress.wordsMastered.includes(word)).length
          return (
            <button
              key={set.id}
              type="button"
              className={`set-card ${unlocked ? '' : 'locked'}`}
              style={{ ['--set-color' as string]: set.color }}
              onClick={() => unlocked && onChoose(set.id)}
              disabled={!unlocked}
              aria-label={unlocked ? `${set.label}: ${set.words.join(', ')}` : `${set.label} locked`}
            >
              <span className="set-name">{unlocked ? set.label : `🔒 ${set.label}`}</span>
              <span className="set-words">{set.words.join('  ·  ')}</span>
              <span className="set-progress">
                {masteredCount}/{set.words.length} mastered
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
