import { Rectangle, Texture } from 'pixi.js'

// Islands are inset by 1px on every side to avoid bilinear filtering
// sampling into the opaque neighbor tile at the frame boundary.
const TILE_FRAMES = {
  water: new Rectangle(512, 256, 64, 64),
  islandSmall: new Rectangle(1, 1, 190, 190),
} as const

export interface ArenaTileset {
  readonly water: Texture
  readonly islandSmall: Texture
}

export function createArenaTileset(tilesTexture: Texture): ArenaTileset {
  const source = tilesTexture.source
  return {
    water: new Texture({ source, frame: TILE_FRAMES.water }),
    islandSmall: new Texture({ source, frame: TILE_FRAMES.islandSmall }),
  }
}
