import { delay, http, HttpResponse } from 'msw'
import type { MatchRecord } from '../api/types'
import { paginate, readMatches, resetMatches, sameConfig, sortForHistory, sortForRanking, upsertMatch } from './db'
import { applyScenario, getScenario } from './scenario'

function readPagination(url: URL): { page: number; pageSize: number } {
  const page = Number(url.searchParams.get('page') ?? '1') || 1
  const pageSize = Number(url.searchParams.get('pageSize') ?? '10') || 10
  return { page, pageSize }
}

export const handlers = [
  http.post('/api/matches', async ({ request }) => {
    if (getScenario() === 'reset') resetMatches()
    const body = (await request.json()) as MatchRecord

    // The write lands server-side immediately — only the *response* is delayed past the
    // client's timeout, so a retry of the same matchId must find it already saved (no duplicate).
    if (getScenario() === 'timeoutAfterSave') {
      const saved = upsertMatch(body)
      await delay(60000)
      return HttpResponse.json(saved, { status: 201 })
    }

    const outcome = await applyScenario()
    if (outcome === 'error') {
      return HttpResponse.json({ message: 'Simulated server error' }, { status: 500 })
    }

    const saved = upsertMatch(body)
    return HttpResponse.json(saved, { status: 201 })
  }),

  http.get('/api/ranking', async ({ request }) => {
    if (getScenario() === 'reset') resetMatches()
    const outcome = await applyScenario()
    const url = new URL(request.url)
    const { page, pageSize } = readPagination(url)

    if (outcome === 'error') {
      return HttpResponse.json({ message: 'Simulated server error' }, { status: 500 })
    }
    if (outcome === 'empty') {
      return HttpResponse.json(paginate<MatchRecord>([], page, pageSize))
    }

    const durationSeconds = Number(url.searchParams.get('durationSeconds'))
    const spawnIntervalSeconds = Number(url.searchParams.get('spawnIntervalSeconds'))
    const config = { durationSeconds, spawnIntervalSeconds }

    const filtered = readMatches().filter((match) => sameConfig(match.config, config))
    return HttpResponse.json(paginate(sortForRanking(filtered), page, pageSize))
  }),

  http.get('/api/matches', async ({ request }) => {
    if (getScenario() === 'reset') resetMatches()
    const outcome = await applyScenario()
    const url = new URL(request.url)
    const { page, pageSize } = readPagination(url)

    if (outcome === 'error') {
      return HttpResponse.json({ message: 'Simulated server error' }, { status: 500 })
    }
    if (outcome === 'empty') {
      return HttpResponse.json(paginate<MatchRecord>([], page, pageSize))
    }

    // History is scoped to the current captain's own matches, never the seeded fixtures.
    const matchIds = url.searchParams.get('matchIds')
    const idSet = new Set((matchIds ?? '').split(',').filter(Boolean))
    const mine = readMatches().filter((match) => idSet.has(match.matchId))

    return HttpResponse.json(paginate(sortForHistory(mine), page, pageSize))
  }),
]
