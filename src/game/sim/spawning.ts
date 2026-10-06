import { gameConfig } from '../../config/gameConfig'
import { distance, overlapsAnyIsland } from './collision'
import { nextRandom, nextRange, type RngState } from './rng'
import type { EnemyKind, Vector2 } from './types'

const SPAWN_MARGIN = 40
const MAX_ATTEMPTS = 20

export function pickSpawnPosition(
  rng: RngState,
  playerPosition: Vector2,
  enemyRadius: number,
): readonly [Vector2, RngState] {
  let state = rng
  let candidate: Vector2 = playerPosition

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const [x, afterX] = nextRange(state, SPAWN_MARGIN, gameConfig.arena.width - SPAWN_MARGIN)
    const [y, afterY] = nextRange(afterX, SPAWN_MARGIN, gameConfig.arena.height - SPAWN_MARGIN)
    state = afterY
    candidate = { x, y }

    const farEnough = distance(candidate, playerPosition) >= gameConfig.spawn.minDistanceFromPlayerPx
    if (farEnough && !overlapsAnyIsland(candidate, enemyRadius)) {
      return [candidate, state]
    }
  }

  return [candidate, state]
}

export function pickEnemyKind(rng: RngState): readonly [EnemyKind, RngState] {
  const [value, next] = nextRandom(rng)
  return [value < 0.5 ? 'chaser' : 'shooter', next]
}
