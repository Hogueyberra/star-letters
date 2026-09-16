import { useEffect, useState } from 'react'
import { initAudio, setVoiceChoice, speakSkill, stopSpeech, unlockAudio } from './audio'
import { unitById, type UnitKind } from './data'
import {
  buildLetterNameQuestions,
  buildLetterSoundQuestions,
  buildMixQuestions,
  buildUnitQuestions,
  type Question,
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
  const [roundQuestions, setRoundQuestions] = useState<Question[]>([])
  const [primedId, setPrimedId] = useState<string | undefined>(undefined)

  useEffect(() => {
    initAudio()
    const unlock = () => {
      void unlockAudio()
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('touchstart', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('touchstart', unlock)
    }
  }, [])

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  useEffect(() => {
    setVoiceChoice(progress.voiceURI, progress.voiceName)
  }, [progress.voiceURI, progress.voiceName])

  function goHome() {
    stopSpeech()
    setScreen({ name: 'home' })
  }

  function startRound(next: Screen, questions: Question[]) {
    void unlockAudio()
    const first = questions[0]
    if (first && !progress.muted) {
      void speakSkill(first.skill, first.target, progress.muted)
    }
    setRoundQuestions(questions)
    setPrimedId(first?.id)
    setPlayNonce((n) => n + 1)
    setScreen(next)
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
            void unlockAudio()
            if (mode === 'letters') startRound({ name: 'letters' }, buildLetterNameQuestions(progress))
            else if (mode === 'sounds') startRound({ name: 'sounds' }, buildLetterSoundQuestions(progress))
            else if (mode === 'words') setScreen({ name: 'unit-pick', kind: 'words' })
            else if (mode === 'phrases') setScreen({ name: 'unit-pick', kind: 'phrases' })
            else startRound({ name: 'mix' }, buildMixQuestions(progress))
          }}
        />
      )}
      {screen.name === 'letters' && (
        <PlayRound
          key={`letters-${playNonce}`}
          title="Letter Names"
          questions={roundQuestions}
          primedId={primedId}
          progress={progress}
          onProgress={setProgress}
          onMute={toggleMute}
          onHome={goHome}
          onAgain={() => startRound({ name: 'letters' }, buildLetterNameQuestions(progress))}
        />
      )}
      {screen.name === 'sounds' && (
        <PlayRound
          key={`sounds-${playNonce}`}
          title="Letter Sounds"
          questions={roundQuestions}
          primedId={primedId}
          progress={progress}
          onProgress={setProgress}
          onMute={toggleMute}
          onHome={goHome}
          onAgain={() => startRound({ name: 'sounds' }, buildLetterSoundQuestions(progress))}
        />
      )}
      {screen.name === 'unit-pick' && (
        <UnitPicker
          kind={screen.kind}
          progress={progress}
          onBack={goHome}
          onMute={toggleMute}
          onChoose={(unitId) => {
            startRound({ name: 'unit-play', unitId, kind: screen.kind }, buildUnitQuestions(unitId))
          }}
        />
      )}
      {screen.name === 'unit-play' && (
        <PlayRound
          key={`unit-${screen.unitId}-${playNonce}`}
          title={playingUnit?.label ?? 'Practice'}
          questions={roundQuestions}
          primedId={primedId}
          progress={progress}
          onProgress={setProgress}
          onMute={toggleMute}
          onHome={() => {
            stopSpeech()
            setScreen({ name: 'unit-pick', kind: screen.kind })
          }}
          onAgain={() => startRound({ name: 'unit-play', unitId: screen.unitId, kind: screen.kind }, buildUnitQuestions(screen.unitId))}
        />
      )}
      {screen.name === 'mix' && (
        <PlayRound
          key={`mix-${playNonce}`}
          title="Mix Review"
          questions={roundQuestions}
          primedId={primedId}
          progress={progress}
          onProgress={setProgress}
          onMute={toggleMute}
          onHome={goHome}
          onAgain={() => startRound({ name: 'mix' }, buildMixQuestions(progress))}
        />
      )}
      <TipsDrawer
        open={tipsOpen}
        progress={progress}
        onClose={() => setTipsOpen(false)}
        canUnlock={canUnlockMore(progress)}
        onUnlockNext={() => setProgress((prev) => unlockNextUnit(prev))}
        onUnlockAll={() => setProgress((prev) => unlockAllUnits(prev))}
        onReset={() => setProgress((prev) => resetProgress(prev))}
        onVoice={(voiceURI, voiceName) => {
          setVoiceChoice(voiceURI, voiceName)
          setProgress((prev) => ({ ...prev, voiceURI, voiceName }))
        }}
      />
    </div>
  )
}
