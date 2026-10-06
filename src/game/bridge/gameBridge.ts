import { gameConfig } from '../../config/gameConfig'
import type { MatchStatus, SimState } from '../sim/types'

export interface HudSnapshot {
  readonly hp: number
  readonly maxHp: number
  readonly score: number
  readonly timeRemaining: number
  readonly status: MatchStatus
  readonly paused: boolean
}

export interface GameBridge {
  getSimState(): SimState
  setSimState(next: SimState): void
  getPaused(): boolean
  setPaused(paused: boolean): void
  getSnapshot(): HudSnapshot
  subscribe(listener: () => void): () => void
}

export function createGameBridge(initial: SimState): GameBridge {
  let simState = initial
  let paused = false
  let snapshot = computeSnapshot(simState, paused)
  const listeners = new Set<() => void>()

  function notifyIfChanged(next: HudSnapshot) {
    if (
      next.hp === snapshot.hp &&
      next.score === snapshot.score &&
      next.timeRemaining === snapshot.timeRemaining &&
      next.status === snapshot.status &&
      next.paused === snapshot.paused
    ) {
      return
    }
    snapshot = next
    for (const listener of listeners) listener()
  }

  return {
    getSimState: () => simState,
    setSimState(next) {
      simState = next
      notifyIfChanged(computeSnapshot(simState, paused))
    },
    getPaused: () => paused,
    setPaused(next) {
      if (paused === next) return
      paused = next
      notifyIfChanged(computeSnapshot(simState, paused))
    },
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

function computeSnapshot(state: SimState, paused: boolean): HudSnapshot {
  return {
    hp: state.player.hp,
    maxHp: gameConfig.player.maxHp,
    score: state.score,
    timeRemaining: Math.max(0, Math.ceil(state.matchSettings.durationSeconds - state.elapsedSeconds)),
    status: state.status,
    paused,
  }
}
