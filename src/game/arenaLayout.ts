export interface IslandPlacement {
  readonly id: string
  readonly x: number
  readonly y: number
  readonly scale: number
  readonly collisionRadius: number
}

export const islandPlacements: readonly IslandPlacement[] = [
  { id: 'island-1', x: 420, y: 740, scale: 1, collisionRadius: 85 },
  { id: 'island-2', x: 1050, y: 260, scale: 1.3, collisionRadius: 110 },
  { id: 'island-3', x: 1350, y: 620, scale: 0.85, collisionRadius: 72 },
]
