/** Presence of ?seed= in the URL puts the game in test mode: the RNG seed becomes fixed and
 * reproducible, and simulation time is driven by a frozen clock that only moves when the
 * `window.__game` test hook explicitly advances it (see render/PixiStage.tsx). */
export function getTestSeed(): number | null {
  const value = new URLSearchParams(window.location.search).get('seed')
  if (value === null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function isTestMode(): boolean {
  return getTestSeed() !== null
}
