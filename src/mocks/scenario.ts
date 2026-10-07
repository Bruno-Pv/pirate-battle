import { delay } from 'msw'
import { STORAGE_KEYS } from '../config/storageKeys'
import { resetMatches } from './db'

export type Scenario =
  | 'normal'
  | 'slow'
  | 'empty'
  | 'error'
  | 'timeout'
  | 'reset'
  | 'timeoutAfterSave'
  | 'reorder'
  | 'networkError'
  | 'clientError'
  | 'submitError'
  | 'rankingError'
  | 'historyError'

const SCENARIOS: readonly Scenario[] = [
  'normal',
  'slow',
  'empty',
  'error',
  'timeout',
  'reset',
  'timeoutAfterSave',
  'reorder',
  'networkError',
  'clientError',
  'submitError',
  'rankingError',
  'historyError',
]

export function getScenario(): Scenario {
  const value = new URLSearchParams(window.location.search).get('scenario')
  return (SCENARIOS as readonly string[]).includes(value ?? '') ? (value as Scenario) : 'normal'
}

export type Endpoint = 'submit' | 'ranking' | 'history'

/** What the handler should do after any delay: answer normally, or fail in a specific way. */
export type ScenarioOutcome = 'continue' | 'empty' | 'error' | 'unavailable' | 'clientError' | 'networkError'

/** Latencies cycled by `reorder`, in request order: a fixed pattern (no randomness) in which
 * a request is regularly overtaken by the ones that follow it. */
const REORDER_DELAYS_MS = [2200, 300, 1500, 100, 1800, 600]
let reorderCounter = 0

/**
 * Wipes everything the mock "server" and this browser remember about played matches, restoring
 * the seed data: the mock database, the list of "my" matches, the pending-submission queue and
 * the saved last result. Options are kept. Run once per page load, before the app renders.
 */
export function applyResetScenario(): void {
  if (getScenario() !== 'reset') return
  resetMatches()
  try {
    localStorage.removeItem(STORAGE_KEYS.myMatchIds)
    localStorage.removeItem(STORAGE_KEYS.pendingSubmissions)
    localStorage.removeItem(STORAGE_KEYS.lastResult)
  } catch {
    // localStorage can be unavailable; there is nothing stored to reset then.
  }
}

/**
 * Applies the current ?scenario= query param before a mock handler responds.
 * - slow: resolves after a delay so loading states are visible.
 * - timeout: delays far longer than the client's request timeout, so axios times out first.
 * - error: every endpoint answers HTTP 500.
 * - clientError: every endpoint answers HTTP 400.
 * - networkError: every request fails at the connection level (no HTTP response at all).
 * - submitError / rankingError / historyError: only that endpoint answers HTTP 503, the others work.
 * - empty: GETs return an empty result regardless of stored data.
 * - reorder: GETs resolve after deterministic, varying delays, so concurrent requests for the
 *   same data finish out of order.
 * `reset` is applied once at startup (see `applyResetScenario`); afterwards it behaves like `normal`.
 * `timeoutAfterSave` is POST-only and handled directly in that handler (the write must land
 * server-side *before* the client gives up waiting for the response).
 */
export async function applyScenario(endpoint: Endpoint): Promise<ScenarioOutcome> {
  switch (getScenario()) {
    case 'slow':
      await delay(2500)
      return 'continue'
    case 'timeout':
      await delay(60000)
      return 'continue'
    case 'reorder':
      if (endpoint === 'submit') return 'continue'
      await delay(REORDER_DELAYS_MS[reorderCounter++ % REORDER_DELAYS_MS.length])
      return 'continue'
    case 'error':
      return 'error'
    case 'clientError':
      return 'clientError'
    case 'networkError':
      return 'networkError'
    case 'submitError':
      return endpoint === 'submit' ? 'unavailable' : 'continue'
    case 'rankingError':
      return endpoint === 'ranking' ? 'unavailable' : 'continue'
    case 'historyError':
      return endpoint === 'history' ? 'unavailable' : 'continue'
    case 'empty':
      return endpoint === 'submit' ? 'continue' : 'empty'
    default:
      return 'continue'
  }
}
