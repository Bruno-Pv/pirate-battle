export interface IslandPlacement {
  readonly x: number
  readonly y: number
  readonly scale: number
  readonly collisionRadius: number
}

export const islandPlacements: readonly IslandPlacement[] = [
  { x: 420, y: 740, scale: 1, collisionRadius: 85 },
  { x: 1050, y: 260, scale: 1.3, collisionRadius: 110 },
  { x: 1350, y: 620, scale: 0.85, collisionRadius: 72 },
]
