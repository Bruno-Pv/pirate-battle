export interface IslandPlacement {
  readonly id: string
  readonly x: number
  readonly y: number
  readonly scale: number
}

export const islandPlacements: readonly IslandPlacement[] = [
  { id: 'island-1', x: 300, y: 650, scale: 1 },
  { id: 'island-2', x: 980, y: 200, scale: 1.3 },
  { id: 'island-3', x: 1300, y: 560, scale: 0.85 },
]
