export interface PlayerIntent {
  readonly thrust: -1 | 0 | 1
  readonly turn: -1 | 0 | 1
  readonly fireFront: boolean
  readonly fireLeft: boolean
  readonly fireRight: boolean
  readonly restart: boolean
}

export const NEUTRAL_INTENT: PlayerIntent = {
  thrust: 0,
  turn: 0,
  fireFront: false,
  fireLeft: false,
  fireRight: false,
  restart: false,
}
