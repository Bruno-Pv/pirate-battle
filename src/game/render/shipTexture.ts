import { Rectangle, Texture } from 'pixi.js'

// The ships spritesheet repeats each hull/sail color 4 times: three near-identical "healthy"
// poses (sail animation) and a fourth, visibly battered dark variant. We use the first healthy
// pose, one of the cracked-hull poses, and the battered variant as 3 damage stages.
const SHIP_FRAMES = {
  white: [new Rectangle(408, 0, 66, 113), new Rectangle(0, 192, 66, 113), new Rectangle(204, 230, 66, 113)],
  black: [new Rectangle(408, 115, 66, 113), new Rectangle(0, 307, 66, 113), new Rectangle(204, 0, 66, 113)],
  red: [new Rectangle(204, 115, 66, 113), new Rectangle(0, 77, 66, 113), new Rectangle(136, 345, 66, 113)],
  green: [new Rectangle(68, 192, 66, 113), new Rectangle(340, 345, 66, 113), new Rectangle(136, 230, 66, 113)],
  blue: [new Rectangle(68, 77, 66, 113), new Rectangle(340, 230, 66, 113), new Rectangle(136, 115, 66, 113)],
  yellow: [new Rectangle(68, 307, 66, 113), new Rectangle(340, 115, 66, 113), new Rectangle(136, 0, 66, 113)],
} as const satisfies Record<string, readonly [Rectangle, Rectangle, Rectangle]>

export type ShipColor = keyof typeof SHIP_FRAMES
export type DamageStage = 0 | 1 | 2

export type HullTextureSet = readonly [Texture, Texture, Texture]

export function createHullTextureSet(shipsTexture: Texture, color: ShipColor): HullTextureSet {
  const source = shipsTexture.source
  const [healthy, damaged, critical] = SHIP_FRAMES[color]
  return [new Texture({ source, frame: healthy }), new Texture({ source, frame: damaged }), new Texture({ source, frame: critical })]
}

export function damageStageForHpFraction(hpFraction: number): DamageStage {
  if (hpFraction > 0.66) return 0
  if (hpFraction > 0.33) return 1
  return 2
}
