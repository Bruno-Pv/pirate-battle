import { delay, http, HttpResponse } from 'msw'
import type { MatchRecord } from '../api/types'
import { paginate, readMatches, sameConfig, sortForHistory, sortForRanking, upsertMatch } from './db'
import { applyScenario, getScenario, type ScenarioOutcome } from './scenario'

function readPagination(url: URL): { page: number; pageSize: number } {
  const page = Number(url.searchParams.get('page') ?? '1') || 1
  const pageSize = Number(url.searchParams.get('pageSize') ?? '10') || 10
  return { page, pageSize }
}

/** The failure response for a scenario outcome, or null when the handler should carry on. */
function failureResponse(outcome: ScenarioOutcome): Response | null {
  switch (outcome) {
    case 'error':
      return HttpResponse.json({ message: 'Simulated server error' }, { status: 500 })
    case 'unavailable':
      return HttpResponse.json({ message: 'Simulated service unavailable' }, { status: 503 })
    case 'clientError':
      return HttpResponse.json({ message: 'Simulated bad request' }, { status: 400 })
    case 'networkError':
      return HttpResponse.error()
    default:
      return null
  }
}

export const handlers = [
  http.post('/api/matches', async ({ request }) => {
    const body = (await request.json()) as MatchRecord

    // The write lands server-side immediately — only the *response* is delayed past the
    // client's timeout, so a retry of the same matchId must find it already saved (no duplicate).
    if (getScenario() === 'timeoutAfterSave') {
      const saved = upsertMatch(body)
      await delay(60000)
      return HttpResponse.json(saved, { status: 201 })
    }

    const outcome = await applyScenario('submit')
    const failure = failureResponse(outcome)
    if (failure) return failure

    const saved = upsertMatch(body)
    return HttpResponse.json(saved, { status: 201 })
  }),

  http.get('/api/ranking', async ({ request }) => {
    const outcome = await applyScenario('ranking')
    const url = new URL(request.url)
    const { page, pageSize } = readPagination(url)

    const failure = failureResponse(outcome)
    if (failure) return failure
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
    const outcome = await applyScenario('history')
    const url = new URL(request.url)
    const { page, pageSize } = readPagination(url)

    const failure = failureResponse(outcome)
    if (failure) return failure
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
