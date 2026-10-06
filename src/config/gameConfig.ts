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
    readonly front: WeaponConfig
    readonly side: WeaponConfig
  }
  readonly projectile: {
    readonly speed: number
    readonly rangePx: number
    readonly collisionRadius: number
  }
  readonly enemies: {
    readonly chaser: EnemyConfig
    readonly shooter: EnemyConfig & { readonly attackRangePx: number }
  }
  readonly spawn: {
    readonly intervalSeconds: number
    readonly minDistanceFromPlayerPx: number
  }
  readonly scoring: {
    readonly pointsPerKill: number
  }
}

export interface WeaponConfig {
  readonly damage: number
  readonly cooldownSeconds: number
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
    },
    side: {
      damage: 8,
      cooldownSeconds: 0.5,
    },
  },
  projectile: {
    speed: 480,
    rangePx: 500,
    collisionRadius: 6,
  },
  enemies: {
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
    },
  },
  spawn: {
    intervalSeconds: 3,
    minDistanceFromPlayerPx: 250,
  },
  scoring: {
    pointsPerKill: 1,
  },
}
