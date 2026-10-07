import type { HudSnapshot } from './bridge/gameBridge'
import type { SimState } from './sim/types'

export interface GameTestHook {
  getSimState(): SimState
  getSnapshot(): HudSnapshot
  /** Advances the simulation by exactly `frames` fixed steps (1/60s each), using whatever
   * intent is currently active (real keyboard/touch input still works during tests). */
  step(frames?: number): SimState
}

declare global {
  interface Window {
    __game?: GameTestHook
  }
}
