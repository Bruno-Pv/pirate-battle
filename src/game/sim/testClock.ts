import type { Clock } from './clock'

export interface TestClock extends Clock {
  advance(ms: number): void
}

/** A frozen clock that only moves when explicitly advanced — used by the `window.__game`
 * test hook so Playwright controls simulation time deterministically, without real waits. */
export function createTestClock(initialMs = 0): TestClock {
  let current = initialMs
  return {
    now: () => current,
    advance(ms) {
      current += ms
    },
  }
}
