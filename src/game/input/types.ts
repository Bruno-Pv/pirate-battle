export interface PlayerIntent {
  readonly thrust: -1 | 0 | 1
  readonly turn: -1 | 0 | 1
}

export const NEUTRAL_INTENT: PlayerIntent = { thrust: 0, turn: 0 }
