import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { queryClient } from './api/queryClient'
import { useCrossTabInvalidation, useFlushPendingSubmissions, useSubmitMatch } from './api/queries'
import { isPending, subscribeQueue } from './api/submissionQueue'
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
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>(() =>
    lastResult && isPending(lastResult.matchId) ? 'pending' : 'saved',
  )
  const latestSubmittedId = useRef<string | null>(null)
  const lastResultId = lastResult?.matchId ?? null

  const submitMatch = useSubmitMatch()
  useFlushPendingSubmissions()
  useCrossTabInvalidation()

  // Background flushes (page load, `online`) change the queue without going through
  // submitAndTrack, so keep the badge in sync with whether the shown result is still queued.
  useEffect(() => {
    if (lastResultId === null) return
    return subscribeQueue(() => {
      setSubmissionStatus((current) => {
        if (current === 'saving') return current
        return isPending(lastResultId) ? 'pending' : 'saved'
      })
    })
  }, [lastResultId])

  useEffect(() => {
    setSoundMuted(!options.soundEnabled)
  }, [options.soundEnabled])

  function startGame() {
    setGameKey((key) => key + 1)
    setScreen('game')
  }

  function submitAndTrack(result: MatchResult) {
    latestSubmittedId.current = result.matchId
    setSubmissionStatus('saving')
    void submitMatch.mutateAsync(result).then(
      () => true,
      () => false,
    ).then((success) => {
      // A newer match may have been submitted meanwhile; only the latest one owns the badge.
      if (latestSubmittedId.current !== result.matchId) return
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

  return (
    <MenuScreen
      options={options}
      lastResult={lastResult}
      onPlay={startGame}
      onOptions={() => setScreen('options')}
      onViewLastResult={() => setScreen('result')}
    />
  )
}

export default App
