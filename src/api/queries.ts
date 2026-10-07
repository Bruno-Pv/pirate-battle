import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { STORAGE_KEYS } from '../config/storageKeys'
import { fetchMatchHistory, fetchRanking, submitMatch } from './matches'
import { getMyMatchIds, recordMyMatch } from './myMatches'
import { QUERY_KEYS, queryClient } from './queryClient'
import { dequeue, enqueue, readQueue } from './submissionQueue'
import type { MatchConfig, MatchRecord } from './types'

const PAGE_SIZE = 5

export function useRanking(config: MatchConfig, page: number) {
  return useQuery({
    queryKey: [...QUERY_KEYS.ranking(config.durationSeconds, config.spawnIntervalSeconds), page],
    queryFn: ({ signal }) => fetchRanking(config, page, PAGE_SIZE, signal),
    placeholderData: (previous) => previous,
  })
}

export function useMatchHistory(page: number) {
  return useQuery({
    queryKey: [...QUERY_KEYS.matchHistory(), page],
    // Reads the current captain's match ids at call time (not render time) so a refetch
    // triggered by invalidation — including from another tab — always sees the latest list.
    queryFn: ({ signal }) => fetchMatchHistory(getMyMatchIds(), page, PAGE_SIZE, signal),
    placeholderData: (previous) => previous,
  })
}

function invalidateMatchQueries() {
  void queryClient.invalidateQueries({ queryKey: ['ranking'] })
  void queryClient.invalidateQueries({ queryKey: ['matchHistory'] })
}

/**
 * Registers a finished match. The record is queued (and remembered as "mine") *before* the
 * request, so a reload mid-request doesn't lose it; it leaves the queue only once the server
 * confirmed it. A failed attempt stays queued for the next retry (page load, `online`, or the
 * Retry button). The server upserts by matchId, so resending never duplicates it.
 */
export function useSubmitMatch() {
  return useMutation({
    mutationFn: (record: MatchRecord) => {
      recordMyMatch(record.matchId)
      enqueue(record)
      return submitMatch(record)
    },
    onSuccess: (_saved, record) => {
      dequeue(record.matchId)
      invalidateMatchQueries()
    },
  })
}

/** Retries any queued matches on mount and whenever the browser regains connectivity. */
export function useFlushPendingSubmissions(): void {
  useEffect(() => {
    function flush() {
      for (const record of readQueue()) {
        submitMatch(record)
          .then(() => {
            dequeue(record.matchId)
            invalidateMatchQueries()
          })
          .catch(() => {
            // Still offline or the mock server errored; try again next time.
          })
      }
    }

    flush()
    window.addEventListener('online', flush)
    return () => window.removeEventListener('online', flush)
  }, [])
}

/** Invalidates Ranking/History in *other* tabs when this tab's submission changes the shared
 * mock database — the `storage` event only fires in tabs that didn't make the write. */
export function useCrossTabInvalidation(): void {
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEYS.mockMatches || event.key === STORAGE_KEYS.myMatchIds) {
        invalidateMatchQueries()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
}
