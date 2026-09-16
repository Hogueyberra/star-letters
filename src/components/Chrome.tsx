import { useEffect, useMemo, useState } from 'react'

type Mood = 'idle' | 'happy' | 'oops' | 'cheer'

export function StarMascot({ mood = 'idle', size = 88 }: { mood?: Mood; size?: number }) {
  const mouth =
    mood === 'oops'
      ? 'M40 68c8-6 24-6 32 0'
      : mood === 'happy' || mood === 'cheer'
        ? 'M38 62c6 12 30 12 36 0'
        : 'M40 66c6 6 26 6 32 0'

  return (
    <svg
      className={`mascot mascot-${mood}`}
      width={size}
      height={size}
      viewBox="0 0 112 112"
      aria-hidden="true"
    >
      <path
        d="M56 8l12.6 25.6 28.2 4.1-20.4 19.9 4.8 28.1L56 72.6 30.8 85.7l4.8-28.1-20.4-19.9 28.2-4.1z"
        fill="#ffd166"
        stroke="#fff"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <circle cx="44" cy="50" r="5" fill="#5b3a1a" />
      <circle cx="68" cy="50" r="5" fill="#5b3a1a" />
      <circle cx="46.2" cy="48.2" r="1.6" fill="#fff" />
      <circle cx="70.2" cy="48.2" r="1.6" fill="#fff" />
      <path d={mouth} fill="none" stroke="#e85d75" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export function Confetti({ burstId }: { burstId: number }) {
  const pieces = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => ({
      id: `${burstId}-${i}`,
      left: 8 + Math.random() * 84,
      dx: Math.round(-80 + Math.random() * 160),
      delay: Math.random() * 0.25,
      duration: 0.9 + Math.random() * 0.7,
      color: ['#ff8fab', '#ffd166', '#80ed99', '#72ddf7', '#c77dff', '#fff'][i % 6],
      rot: Math.random() * 360,
      size: 8 + Math.random() * 10,
    }))
  }, [burstId])

  if (burstId === 0) return null

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            ['--dx' as string]: `${piece.dx}px`,
            background: piece.color,
            width: piece.size,
            height: piece.size * (piece.size > 14 ? 0.45 : 1),
            borderRadius: piece.size > 14 ? 2 : 99,
            transform: `rotate(${piece.rot}deg)`,
          }}
        />
      ))}
    </div>
  )
}

export function SkyDecor() {
  return (
    <div className="sky" aria-hidden="true">
      <span className="cloud cloud-a" />
      <span className="cloud cloud-b" />
      <span className="cloud cloud-c" />
      <span className="float-star s1">★</span>
      <span className="float-star s2">✦</span>
      <span className="float-star s3">★</span>
    </div>
  )
}

export function MuteButton({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={onToggle}
      aria-pressed={muted}
      aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
      title={muted ? 'Sound is off' : 'Sound is on'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}

export function TipsDrawer({
  open,
  onClose,
  onUnlockNext,
  onUnlockAll,
  onReset,
  canUnlock,
}: {
  open: boolean
  onClose: () => void
  onUnlockNext: () => void
  onUnlockAll: () => void
  onReset: () => void
  canUnlock: boolean
}) {
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    if (!open) setConfirmReset(false)
  }, [open])

  if (!open) return null

  return (
    <div className="drawer-backdrop" onClick={onClose} role="presentation">
      <aside
        className="drawer"
        role="dialog"
        aria-labelledby="tips-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer-head">
          <h2 id="tips-title">Tips for grown-ups</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close tips">
            ✕
          </button>
        </div>
        <ul className="tips-list">
          <li>Keep sessions short — 5 to 10 minutes feels just right.</li>
          <li>Sit together the first few times so she hears the letters and words.</li>
          <li>Wrong answers are gentle retries. Celebrate the trying!</li>
          <li>A letter or sight word is “mastered” after 3 correct answers.</li>
          <li>Finishing a sight-word set unlocks the next one automatically.</li>
        </ul>
        <p className="tips-label">Parent shortcuts</p>
        <div className="tips-actions">
          <button type="button" className="tiny-btn" onClick={onUnlockNext} disabled={!canUnlock}>
            Unlock next set
          </button>
          <button type="button" className="tiny-btn" onClick={onUnlockAll}>
            Unlock all sets
          </button>
          {confirmReset ? (
            <button
              type="button"
              className="tiny-btn tiny-danger"
              onClick={() => {
                onReset()
                setConfirmReset(false)
              }}
            >
              Yes, reset stars
            </button>
          ) : (
            <button type="button" className="tiny-btn" onClick={() => setConfirmReset(true)}>
              Reset progress
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}
