import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000,
    },
  },
})

export const QUERY_KEYS = {
  ranking: (durationSeconds: number, spawnIntervalSeconds: number) =>
    ['ranking', durationSeconds, spawnIntervalSeconds] as const,
  matchHistory: () => ['matchHistory'] as const,
}
