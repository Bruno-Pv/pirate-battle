import { gameConfig, type EnemyConfig } from '../../config/gameConfig'
import type { EnemyKind } from './types'

/** Stats shared by every enemy kind (the shooter's extra fields live on `gameConfig.enemies.shooter`). */
export function enemyConfig(kind: EnemyKind): EnemyConfig {
  return gameConfig.enemies[kind]
}
