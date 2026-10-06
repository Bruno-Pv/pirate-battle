import { delay } from 'msw'

export type Scenario = 'normal' | 'slow' | 'empty' | 'error' | 'timeout' | 'reset' | 'timeoutAfterSave' | 'reorder'

const SCENARIOS: readonly Scenario[] = [
  'normal',
  'slow',
  'empty',
  'error',
  'timeout',
  'reset',
  'timeoutAfterSave',
  'reorder',
]

export function getScenario(): Scenario {
  const value = new URLSearchParams(window.location.search).get('scenario')
  return (SCENARIOS as readonly string[]).includes(value ?? '') ? (value as Scenario) : 'normal'
}

export type ScenarioOutcome = 'continue' | 'empty' | 'error'

/**
 * Applies the current ?scenario= query param before a mock handler responds.
 * - slow: resolves after a delay so loading states are visible.
 * - timeout: delays far longer than the client's request timeout, so axios times out first.
 * - error: handler should respond with a 5xx.
 * - empty: handler should respond with an empty result regardless of stored data.
 * - reorder: a random delay, so concurrent GETs for the same data can resolve out of order.
 * `reset` is handled by the caller (it clears the mock database once, then behaves like `normal`).
 * `timeoutAfterSave` is POST-only and handled directly in that handler (the write must land
 * server-side *before* the client gives up waiting for the response).
 */
export async function applyScenario(): Promise<ScenarioOutcome> {
  const scenario = getScenario()
  switch (scenario) {
    case 'slow':
      await delay(2500)
      return 'continue'
    case 'timeout':
      await delay(60000)
      return 'continue'
    case 'reorder':
      await delay(100 + Math.random() * 2400)
      return 'continue'
    case 'error':
      return 'error'
    case 'empty':
      return 'empty'
    default:
      return 'continue'
  }
}
