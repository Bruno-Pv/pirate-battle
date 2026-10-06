import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { queryClient } from './api/queryClient'
import { submitMatchDurable, useCrossTabInvalidation, useFlushPendingSubmissions } from './api/queries'
import { setSoundMuted } from './game/audio/sounds'
import { GameScreen } from './ui/game/GameScreen'
import { loadOptions, saveOptions, type GameOptions } from './ui/options/optionsStore'
import { loadLastResult, saveLastResult, type MatchResult } from './ui/result/matchResult'
import type { SubmissionStatus } from './ui/result/submissionStatus'
import { MenuScreen } from './ui/screens/MenuScreen'
import { OptionsScreen } from './ui/screens/OptionsScreen'
import { ResultScreen } from './ui/screens/ResultScreen'

type Screen = 'menu' | 'options' | 'game' | 'result'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Screens />
    </QueryClientProvider>
  )
}

function Screens() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [gameKey, setGameKey] = useState(0)
  const [options, setOptions] = useState<GameOptions>(() => loadOptions())
  const [lastResult, setLastResult] = useState<MatchResult | null>(() => loadLastResult())
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('saved')

  useFlushPendingSubmissions()
  useCrossTabInvalidation()

  useEffect(() => {
    setSoundMuted(!options.soundEnabled)
  }, [options.soundEnabled])

  function startGame() {
    setGameKey((key) => key + 1)
    setScreen('game')
  }

  function submitAndTrack(result: MatchResult) {
    setSubmissionStatus('saving')
    submitMatchDurable(result).then((success) => {
      setSubmissionStatus(success ? 'saved' : 'pending')
    })
  }

  if (screen === 'options') {
    return (
      <OptionsScreen
        options={options}
        onSave={(next) => {
          setOptions(next)
          saveOptions(next)
        }}
        onBack={() => setScreen('menu')}
      />
    )
  }

  if (screen === 'game') {
    return (
      <GameScreen
        key={gameKey}
        options={options}
        onGameEnd={(result) => {
          setLastResult(result)
          saveLastResult(result)
          submitAndTrack(result)
          setScreen('result')
        }}
        onQuit={() => setScreen('menu')}
      />
    )
  }

  if (screen === 'result' && lastResult) {
    return (
      <ResultScreen
        result={lastResult}
        submissionStatus={submissionStatus}
        onRetrySubmission={() => submitAndTrack(lastResult)}
        onPlayAgain={startGame}
        onMenu={() => setScreen('menu')}
      />
    )
  }

  return <MenuScreen options={options} onPlay={startGame} onOptions={() => setScreen('options')} />
}

export default App
