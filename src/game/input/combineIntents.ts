import type { PlayerIntent } from './types'

/** Merges intents from multiple sources (keyboard + touch): any active source wins. */
export function combineIntents(a: PlayerIntent, b: PlayerIntent): PlayerIntent {
  return {
    thrust: a.thrust !== 0 ? a.thrust : b.thrust,
    turn: a.turn !== 0 ? a.turn : b.turn,
    fireFront: a.fireFront || b.fireFront,
    fireLeft: a.fireLeft || b.fireLeft,
    fireRight: a.fireRight || b.fireRight,
  }
}
