import { STORAGE_KEYS } from '../../config/storageKeys'
import type { MatchRecord } from '../../api/types'

/** The Result screen shows exactly the record that gets submitted to the ranking API. */
export type MatchResult = MatchRecord


export function loadLastResult(): MatchResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.lastResult)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<MatchResult>
    if (
      typeof parsed.matchId !== 'string' ||
      typeof parsed.score !== 'number' ||
      typeof parsed.survived !== 'boolean' ||
      typeof parsed.elapsedSeconds !== 'number' ||
      typeof parsed.playerName !== 'string' ||
      typeof parsed.completedAt !== 'number' ||
      typeof parsed.config !== 'object' ||
      parsed.config === null
    ) {
      return null
    }
    return parsed as MatchResult
  } catch {
    return null
  }
}

export function saveLastResult(result: MatchResult): void {
  try {
    localStorage.setItem(STORAGE_KEYS.lastResult, JSON.stringify(result))
  } catch {
    // localStorage can be unavailable; the result just won't survive a refresh.
  }
}
