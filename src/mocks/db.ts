import { STORAGE_KEYS } from '../config/storageKeys'
import type { MatchConfig, MatchRecord, PaginatedResult } from '../api/types'
import { matchFixtures } from './fixtures'

export function readMatches(): MatchRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.mockMatches)
    if (!raw) {
      writeMatches(matchFixtures as MatchRecord[])
      return [...matchFixtures]
    }
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as MatchRecord[]) : []
  } catch {
    return [...matchFixtures]
  }
}

export function writeMatches(matches: readonly MatchRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.mockMatches, JSON.stringify(matches))
  } catch {
    // localStorage can be unavailable; the mock "server" just won't persist between reloads.
  }
}

export function resetMatches(): void {
  writeMatches(matchFixtures as MatchRecord[])
}

/** Idempotent insert: submitting the same matchId again just returns the original record. */
export function upsertMatch(record: MatchRecord): MatchRecord {
  const matches = readMatches()
  const existing = matches.find((match) => match.matchId === record.matchId)
  if (existing) return existing

  writeMatches([...matches, record])
  return record
}

export function sameConfig(a: MatchConfig, b: MatchConfig): boolean {
  return a.durationSeconds === b.durationSeconds && a.spawnIntervalSeconds === b.spawnIntervalSeconds
}

/** Deterministic ranking order: highest score first, then longer survival, then earliest submission. */
export function sortForRanking(matches: readonly MatchRecord[]): MatchRecord[] {
  return [...matches].sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score
    if (a.elapsedSeconds !== b.elapsedSeconds) return b.elapsedSeconds - a.elapsedSeconds
    if (a.completedAt !== b.completedAt) return a.completedAt - b.completedAt
    return a.matchId.localeCompare(b.matchId)
  })
}

export function sortForHistory(matches: readonly MatchRecord[]): MatchRecord[] {
  return [...matches].sort((a, b) => {
    if (a.completedAt !== b.completedAt) return b.completedAt - a.completedAt
    return a.matchId.localeCompare(b.matchId)
  })
}

export function paginate<T>(items: readonly T[], page: number, pageSize: number): PaginatedResult<T> {
  const safePageSize = Math.max(1, pageSize)
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * safePageSize

  return {
    items: items.slice(start, start + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    totalItems,
    totalPages,
  }
}
