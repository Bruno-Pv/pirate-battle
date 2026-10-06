import { useSyncExternalStore } from 'react'
import type { GameBridge, HudSnapshot } from './gameBridge'

export function useGameSnapshot(bridge: GameBridge): HudSnapshot {
  return useSyncExternalStore(bridge.subscribe, bridge.getSnapshot)
}
