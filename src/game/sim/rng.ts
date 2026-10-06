/** Seeded PRNG state (mulberry32). Pure: every draw returns a new state. */
export type RngState = number

export function createRng(seed: number): RngState {
  return seed >>> 0
}

export function nextRandom(state: RngState): readonly [value: number, next: RngState] {
  let t = (state + 0x6d2b79f5) >>> 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return [value, t >>> 0]
}

export function nextRange(state: RngState, min: number, max: number): readonly [value: number, next: RngState] {
  const [value, next] = nextRandom(state)
  return [min + value * (max - min), next]
}
