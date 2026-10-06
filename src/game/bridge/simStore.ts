import type { SimState } from '../sim/types'

export interface SimStore {
  getState(): SimState
  setState(next: SimState): void
}

export function createSimStore(initial: SimState): SimStore {
  let state = initial
  return {
    getState: () => state,
    setState: (next) => {
      state = next
    },
  }
}
