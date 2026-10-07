import { gameConfig } from '../../config/gameConfig'
import { STORAGE_KEYS } from '../../config/storageKeys'
import { clamp } from '../../lib/math'

export interface GameOptions {
  readonly playerName: string
  readonly soundEnabled: boolean
  readonly matchDurationSeconds: number
  readonly spawnIntervalSeconds: number
}

export const MAX_NAME_LENGTH = 20

// Documented bounds for the two gameplay-affecting options, enforced on every save/load:
// - Game session time: short enough to respect the player's time, long enough for a real match.
export const MATCH_DURATION_MIN_SECONDS = 60
export const MATCH_DURATION_MAX_SECONDS = 180
// - Enemy spawn interval: must stay positive; below 1s the arena floods faster than the
//   player can realistically react, above 10s the match feels empty for long stretches.
export const SPAWN_INTERVAL_MIN_SECONDS = 1
export const SPAWN_INTERVAL_MAX_SECONDS = 10

export const DEFAULT_OPTIONS: GameOptions = {
  playerName: 'Captain',
  soundEnabled: true,
  matchDurationSeconds: gameConfig.match.durationSeconds,
  spawnIntervalSeconds: gameConfig.spawn.intervalSeconds,
}

export function sanitizePlayerName(value: string): string {
  const trimmed = value.trim().slice(0, MAX_NAME_LENGTH)
  return trimmed.length > 0 ? trimmed : DEFAULT_OPTIONS.playerName
}

export function loadOptions(): GameOptions {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.options)
    if (!raw) return DEFAULT_OPTIONS

    const parsed = JSON.parse(raw) as Partial<GameOptions>
    return {
      playerName: typeof parsed.playerName === 'string' ? sanitizePlayerName(parsed.playerName) : DEFAULT_OPTIONS.playerName,
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : DEFAULT_OPTIONS.soundEnabled,
      matchDurationSeconds:
        typeof parsed.matchDurationSeconds === 'number'
          ? clamp(parsed.matchDurationSeconds, MATCH_DURATION_MIN_SECONDS, MATCH_DURATION_MAX_SECONDS)
          : DEFAULT_OPTIONS.matchDurationSeconds,
      spawnIntervalSeconds:
        typeof parsed.spawnIntervalSeconds === 'number'
          ? clamp(parsed.spawnIntervalSeconds, SPAWN_INTERVAL_MIN_SECONDS, SPAWN_INTERVAL_MAX_SECONDS)
          : DEFAULT_OPTIONS.spawnIntervalSeconds,
    }
  } catch {
    return DEFAULT_OPTIONS
  }
}

export function saveOptions(options: GameOptions): void {
  try {
    localStorage.setItem(STORAGE_KEYS.options, JSON.stringify(options))
  } catch {
    // localStorage can be unavailable (private browsing, quota exceeded); options just won't persist.
  }
}
