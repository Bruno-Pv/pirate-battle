import { useEffect, useRef, useState } from 'react'
import { playSound } from '../../game/audio/sounds'
import { createGameBridge } from '../../game/bridge/gameBridge'
import { useGameSnapshot } from '../../game/bridge/useGameSnapshot'
import { PixiStage } from '../../game/render/PixiStage'
import { createInitialState } from '../../game/sim/simulation'
import type { GameOptions } from '../options/optionsStore'
import type { MatchResult } from '../result/matchResult'
import { Hud } from './Hud'
import { PauseOverlay } from './PauseOverlay'
import { RotateDeviceOverlay } from './RotateDeviceOverlay'
import { TouchControls } from './TouchControls'
import { useIsPortraitMobile } from './useIsPortraitMobile'

const GAME_END_DELAY_MS = 1200

interface GameScreenProps {
  options: GameOptions
  onGameEnd: (result: MatchResult) => void
  onQuit: () => void
}

export function GameScreen({ options, onGameEnd, onQuit }: GameScreenProps) {
  const [bridge] = useState(() =>
    createGameBridge(
      createInitialState(Date.now(), {
        durationSeconds: options.matchDurationSeconds,
        spawnIntervalSeconds: options.spawnIntervalSeconds,
      }),
    ),
  )
  const touchContainerRef = useRef<HTMLDivElement | null>(null)
  const snapshot = useGameSnapshot(bridge)
  const isPortraitMobile = useIsPortraitMobile()

  useEffect(() => {
    playSound('gameStart', 0.6)
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== 'Escape') return
      const state = bridge.getSimState()
      if (state.status !== 'playing') return
      const next = !bridge.getPaused()
      bridge.setPaused(next)
      playSound(next ? 'pause' : 'resume', 0.5)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [bridge])

  useEffect(() => {
    function autoPause() {
      if (bridge.getSimState().status === 'playing') bridge.setPaused(true)
    }
    function onVisibilityChange() {
      if (document.hidden) autoPause()
    }
    window.addEventListener('blur', autoPause)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('blur', autoPause)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [bridge])

  useEffect(() => {
    if (isPortraitMobile && bridge.getSimState().status === 'playing') {
      bridge.setPaused(true)
    }
  }, [isPortraitMobile, bridge])

  useEffect(() => {
    if (snapshot.status !== 'ended') return

    const state = bridge.getSimState()
    const survived = state.player.hp > 0
    playSound(survived ? 'gameComplete' : 'gameOver', 0.6)

    const timeoutId = window.setTimeout(() => {
      onGameEnd({
        score: state.score,
        survived,
        elapsedSeconds: state.elapsedSeconds,
        playerName: options.playerName,
        completedAt: Date.now(),
      })
    }, GAME_END_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [snapshot.status, bridge, onGameEnd, options.playerName])

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <PixiStage bridge={bridge} touchContainerRef={touchContainerRef} />
      <Hud snapshot={snapshot} />
      <TouchControls ref={touchContainerRef} />
      {isPortraitMobile ? (
        <RotateDeviceOverlay />
      ) : (
        snapshot.paused && (
          <PauseOverlay
            onResume={() => {
              bridge.setPaused(false)
              playSound('resume', 0.5)
            }}
            onQuit={onQuit}
          />
        )
      )}
    </div>
  )
}
