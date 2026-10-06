import { apiClient } from './client'
import type { MatchConfig, MatchRecord, PaginatedResult } from './types'

export async function submitMatch(record: MatchRecord, signal?: AbortSignal): Promise<MatchRecord> {
  const response = await apiClient.post<MatchRecord>('/matches', record, { signal })
  return response.data
}

export async function fetchRanking(
  config: MatchConfig,
  page: number,
  pageSize: number,
  signal?: AbortSignal,
): Promise<PaginatedResult<MatchRecord>> {
  const response = await apiClient.get<PaginatedResult<MatchRecord>>('/ranking', {
    params: { ...config, page, pageSize },
    signal,
  })
  return response.data
}

export async function fetchMatchHistory(
  matchIds: readonly string[],
  page: number,
  pageSize: number,
  signal?: AbortSignal,
): Promise<PaginatedResult<MatchRecord>> {
  const response = await apiClient.get<PaginatedResult<MatchRecord>>('/matches', {
    params: { matchIds: matchIds.join(','), page, pageSize },
    signal,
  })
  return response.data
}
