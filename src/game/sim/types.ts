import type { RngState } from './rng'

export interface Vector2 {
  readonly x: number
  readonly y: number
}

export interface ShipState {
  readonly position: Vector2
  readonly heading: number
  readonly hp: number
}

export type EnemyKind = 'chaser' | 'shooter'

export interface Enemy {
  readonly id: number
  readonly kind: EnemyKind
  readonly position: Vector2
  readonly heading: number
  readonly hp: number
  readonly fireCooldown: number
  readonly contactCooldown: number
}

export type ProjectileFaction = 'player' | 'enemy'

export interface Projectile {
  readonly id: number
  readonly faction: ProjectileFaction
  readonly position: Vector2
  readonly velocity: Vector2
  readonly damage: number
  readonly remainingRangePx: number
}

export interface WeaponCooldowns {
  readonly front: number
  readonly left: number
  readonly right: number
}

export type MatchStatus = 'playing' | 'ended'

export interface SimState {
  readonly status: MatchStatus
  readonly elapsedSeconds: number
  readonly score: number
  readonly player: ShipState
  readonly weaponCooldowns: WeaponCooldowns
  readonly enemies: readonly Enemy[]
  readonly projectiles: readonly Projectile[]
  readonly spawnCooldown: number
  readonly nextEntityId: number
  readonly rng: RngState
}
