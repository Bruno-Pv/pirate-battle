import { Container, Sprite, TilingSprite, type Texture } from 'pixi.js'
import { gameConfig } from '../../config/gameConfig'
import { islandPlacements } from '../arenaLayout'
import { createArenaTileset } from './arenaTileset'

export function createArenaLayer(tilesTexture: Texture): Container {
  const tileset = createArenaTileset(tilesTexture)
  const layer = new Container({ label: 'arena' })

  const water = new TilingSprite({
    texture: tileset.water,
    width: gameConfig.arena.width,
    height: gameConfig.arena.height,
  })
  layer.addChild(water)

  for (const island of islandPlacements) {
    const sprite = new Sprite({
      texture: tileset.islandSmall,
      x: island.x,
      y: island.y,
      scale: island.scale,
      anchor: 0.5,
    })
    layer.addChild(sprite)
  }

  return layer
}
