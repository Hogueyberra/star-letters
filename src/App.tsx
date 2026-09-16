import { useEffect, useState } from 'react'
import { initAudio, stopSpeech, unlockAudio } from './audio'
import { SIGHT_SETS } from './data'
import {
  buildLetterNameQuestions,
  buildLetterSoundQuestions,
  buildMixQuestions,
  buildSightQuestions,
} from './quiz'
import {
  loadProgress,
  saveProgress,
  unlockAllSets,
  unlockNextSet,
  resetProgress,
  type Progress,
} from './storage'
import { SkyDecor, TipsDrawer } from './components/Chrome'
import { HomeScreen, SightPicker } from './components/HomeScreen'
import { PlayRound } from './components/PlayRound'

type Screen =
  | { name: 'home' }
  | { name: 'letters' }
  | { name: 'sounds' }
  | { name: 'sight-pick' }
  | { name: 'sight-play'; setId: string }
  | { name: 'mix' }

function canUnlockMore(progress: Progress) {
  return SIGHT_SETS.some((set) => !progress.unlockedSets.includes(set.id))
}

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
            else if (mode === 'sight') setScreen({ name: 'sight-pick' })
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
      {screen.name === 'sight-pick' && (
        <SightPicker
          progress={progress}
          onBack={goHome}
          onMute={toggleMute}
          onChoose={(setId) => setScreen({ name: 'sight-play', setId })}
        />
      )}
      {screen.name === 'sight-play' && (
        <PlayRound
          key={`sight-${screen.setId}-${playNonce}`}
          title={`Sight Words ${screen.setId}`}
          makeQuestions={() => buildSightQuestions(screen.setId)}
          progress={progress}
          onProgress={setProgress}
          onMute={toggleMute}
          onHome={() => {
            stopSpeech()
            setScreen({ name: 'sight-pick' })
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
        onUnlockNext={() => setProgress((prev) => unlockNextSet(prev))}
        onUnlockAll={() => setProgress((prev) => unlockAllSets(prev))}
        onReset={() => setProgress((prev) => resetProgress(prev.name, prev.muted))}
      />
    </div>
  )
}
