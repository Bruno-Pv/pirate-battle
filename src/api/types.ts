/** The match settings a run was played under — rankings only ever compare matches that share this. */
export interface MatchConfig {
  readonly durationSeconds: number
  readonly spawnIntervalSeconds: number
}

export interface MatchRecord {
  readonly matchId: string
  readonly playerName: string
  readonly score: number
  readonly survived: boolean
  readonly elapsedSeconds: number
  readonly completedAt: number
  readonly config: MatchConfig
}

export interface PaginatedResult<T> {
  readonly items: readonly T[]
  readonly page: number
  readonly pageSize: number
  readonly totalItems: number
  readonly totalPages: number
}
