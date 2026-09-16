import { useEffect, useState } from 'react'
import { initAudio, stopSpeech, unlockAudio } from './audio'
import { unitById, type UnitKind } from './data'
import {
  buildLetterNameQuestions,
  buildLetterSoundQuestions,
  buildMixQuestions,
  buildUnitQuestions,
} from './quiz'
import {
  canUnlockMore,
  loadProgress,
  resetProgress,
  saveProgress,
  unlockAllUnits,
  unlockNextUnit,
  type Progress,
} from './storage'
import { SkyDecor, TipsDrawer } from './components/Chrome'
import { HomeScreen, UnitPicker } from './components/HomeScreen'
import { PlayRound } from './components/PlayRound'

type Screen =
  | { name: 'home' }
  | { name: 'letters' }
  | { name: 'sounds' }
  | { name: 'unit-pick'; kind: UnitKind }
  | { name: 'unit-play'; unitId: string; kind: UnitKind }
  | { name: 'mix' }

export default function App() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress())
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [tipsOpen, setTipsOpen] = useState(false)
  const [playNonce, setPlayNonce] = useState(0)

  useEffect(() => {
    initAudio()
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  function goHome() {
    stopSpeech()
    setScreen({ name: 'home' })
  }

  function toggleMute() {
    setProgress((prev) => {
      const muted = !prev.muted
      if (muted) stopSpeech()
      return { ...prev, muted }
    })
  }

  const playingUnit = screen.name === 'unit-play' ? unitById(screen.unitId) : undefined

  return (
    <div className="app-shell">
      <SkyDecor />
      {screen.name === 'home' && (
        <HomeScreen
          progress={progress}
          onName={(name) => setProgress((prev) => ({ ...prev, name }))}
          onMute={toggleMute}
          onOpenTips={() => setTipsOpen(true)}
          onPlay={(mode) => {
            unlockAudio()
            if (mode === 'letters') setScreen({ name: 'letters' })
            else if (mode === 'sounds') setScreen({ name: 'sounds' })
            else if (mode === 'words') setScreen({ name: 'unit-pick', kind: 'words' })
            else if (mode === 'phrases') setScreen({ name: 'unit-pick', kind: 'phrases' })
            else setScreen({ name: 'mix' })
          }}
        />
      )}
      {screen.name === 'letters' && (
        <PlayRound
          key={`letters-${playNonce}`}
          title="Letter Names"
          makeQuestions={() => buildLetterNameQuestions(progress)}
          progress={progress}
          onProgress={setProgress}
          onMute={toggleMute}
          onHome={goHome}
          onAgain={() => setPlayNonce((n) => n + 1)}
        />
      )}
      {screen.name === 'sounds' && (
        <PlayRound
          key={`sounds-${playNonce}`}
          title="Letter Sounds"
          makeQuestions={() => buildLetterSoundQuestions(progress)}
          progress={progress}
          onProgress={setProgress}
          onMute={toggleMute}
          onHome={goHome}
          onAgain={() => setPlayNonce((n) => n + 1)}
        />
      )}
      {screen.name === 'unit-pick' && (
        <UnitPicker
          kind={screen.kind}
          progress={progress}
          onBack={goHome}
          onMute={toggleMute}
          onChoose={(unitId) => setScreen({ name: 'unit-play', unitId, kind: screen.kind })}
        />
      )}
      {screen.name === 'unit-play' && (
        <PlayRound
          key={`unit-${screen.unitId}-${playNonce}`}
          title={playingUnit?.label ?? 'Practice'}
          makeQuestions={() => buildUnitQuestions(screen.unitId)}
          progress={progress}
          onProgress={setProgress}
          onMute={toggleMute}
          onHome={() => {
            stopSpeech()
            setScreen({ name: 'unit-pick', kind: screen.kind })
          }}
          onAgain={() => setPlayNonce((n) => n + 1)}
        />
      )}
      {screen.name === 'mix' && (
        <PlayRound
          key={`mix-${playNonce}`}
          title="Mix Review"
          makeQuestions={() => buildMixQuestions(progress)}
          progress={progress}
          onProgress={setProgress}
          onMute={toggleMute}
          onHome={goHome}
          onAgain={() => setPlayNonce((n) => n + 1)}
        />
      )}
      <TipsDrawer
        open={tipsOpen}
        onClose={() => setTipsOpen(false)}
        canUnlock={canUnlockMore(progress)}
        onUnlockNext={() => setProgress((prev) => unlockNextUnit(prev))}
        onUnlockAll={() => setProgress((prev) => unlockAllUnits(prev))}
        onReset={() => setProgress((prev) => resetProgress(prev.name, prev.muted))}
      />
    </div>
  )
}
