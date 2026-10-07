import { gameConfig } from '../../config/gameConfig'
import { distance, overlapsAnyIsland } from './collision'
import { nextRandom, nextRange, type RngState } from './rng'
import type { EnemyKind, Vector2 } from './types'

export function pickSpawnPosition(
  rng: RngState,
  playerPosition: Vector2,
  enemyRadius: number,
): readonly [Vector2, RngState] {
  const { edgeMarginPx, maxPlacementAttempts, minDistanceFromPlayerPx } = gameConfig.spawn
  let state = rng
  let candidate: Vector2 = playerPosition

  for (let attempt = 0; attempt < maxPlacementAttempts; attempt += 1) {
    const [x, afterX] = nextRange(state, edgeMarginPx, gameConfig.arena.width - edgeMarginPx)
    const [y, afterY] = nextRange(afterX, edgeMarginPx, gameConfig.arena.height - edgeMarginPx)
    state = afterY
    candidate = { x, y }

    const farEnough = distance(candidate, playerPosition) >= minDistanceFromPlayerPx
    if (farEnough && !overlapsAnyIsland(candidate, enemyRadius)) {
      return [candidate, state]
    }
  }

  return [candidate, state]
}

export function pickEnemyKind(rng: RngState): readonly [EnemyKind, RngState] {
  const [value, next] = nextRandom(rng)
  return [value < gameConfig.spawn.chaserProbability ? 'chaser' : 'shooter', next]
}
