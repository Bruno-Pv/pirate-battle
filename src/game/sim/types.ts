export interface Vector2 {
  readonly x: number
  readonly y: number
}

export interface ShipState {
  readonly position: Vector2
  readonly heading: number
  readonly hp: number
}

export interface SimState {
  readonly elapsedSeconds: number
  readonly player: ShipState
}
