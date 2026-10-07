export interface GameConfig {
  readonly arena: {
    readonly width: number
    readonly height: number
  }
  readonly match: {
    readonly durationSeconds: number
  }
  readonly player: {
    readonly maxHp: number
    readonly moveSpeed: number
    readonly turnSpeed: number
    readonly collisionRadius: number
  }
  readonly weapons: {
    readonly front: FrontWeaponConfig
    readonly side: SideWeaponConfig
  }
  readonly projectile: {
    readonly speed: number
    readonly rangePx: number
    readonly collisionRadius: number
  }
  readonly enemies: {
    /** Minimum time between two contact hits from the same (non-exploding) enemy. */
    readonly contactDamageCooldownSeconds: number
    /** How far ahead of itself an enemy looks for an island to steer around. */
    readonly islandAvoidLookaheadPx: number
    readonly chaser: EnemyConfig
    readonly shooter: EnemyConfig & {
      readonly attackRangePx: number
      /** Shooter retreats if the player gets closer than this. */
      readonly minDistancePx: number
      readonly fireCooldownSeconds: number
      readonly projectileDamage: number
    }
  }
  readonly spawn: {
    readonly intervalSeconds: number
    readonly minDistanceFromPlayerPx: number
    readonly maxAliveEnemies: number
    /** Probability (0–1) that a spawned enemy is a Chaser; the rest are Shooters. */
    readonly chaserProbability: number
    /** Spawn points stay at least this far from the arena edges. */
    readonly edgeMarginPx: number
    /** Random placements tried before giving up and using the last candidate. */
    readonly maxPlacementAttempts: number
  }
  readonly scoring: {
    readonly pointsPerKill: number
  }
}

export interface WeaponConfig {
  readonly damage: number
  readonly cooldownSeconds: number
}

export interface FrontWeaponConfig extends WeaponConfig {
  /** Distance ahead of the ship's center where the shot originates. */
  readonly mountOffset: number
}

export interface SideWeaponConfig extends WeaponConfig {
  /** Distance to the side of the ship's center where shots originate. */
  readonly lateralOffset: number
  /** Forward offsets (relative to center) for each cannon along the hull. */
  readonly mountOffsets: readonly number[]
}

export interface EnemyConfig {
  readonly maxHp: number
  readonly moveSpeed: number
  readonly collisionRadius: number
  readonly contactDamage: number
}

export const gameConfig: GameConfig = {
  arena: {
    width: 1600,
    height: 900,
  },
  match: {
    durationSeconds: 120,
  },
  player: {
    maxHp: 100,
    moveSpeed: 160,
    turnSpeed: 2.4,
    collisionRadius: 24,
  },
  weapons: {
    front: {
      damage: 12,
      cooldownSeconds: 0.35,
      mountOffset: 50,
    },
    side: {
      damage: 8,
      cooldownSeconds: 0.5,
      lateralOffset: 20,
      mountOffsets: [-35, 0, 35],
    },
  },
  projectile: {
    speed: 480,
    rangePx: 500,
    collisionRadius: 6,
  },
  enemies: {
    contactDamageCooldownSeconds: 1,
    islandAvoidLookaheadPx: 50,
    chaser: {
      maxHp: 30,
      moveSpeed: 110,
      collisionRadius: 20,
      contactDamage: 25,
    },
    shooter: {
      maxHp: 40,
      moveSpeed: 80,
      collisionRadius: 20,
      contactDamage: 10,
      attackRangePx: 320,
      minDistancePx: 150,
      fireCooldownSeconds: 1.4,
      projectileDamage: 6,
    },
  },
  spawn: {
    intervalSeconds: 4.5,
    minDistanceFromPlayerPx: 250,
    maxAliveEnemies: 4,
    chaserProbability: 0.5,
    edgeMarginPx: 40,
    maxPlacementAttempts: 20,
  },
  scoring: {
    pointsPerKill: 1,
  },
}
