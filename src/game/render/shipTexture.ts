import { Rectangle, Texture } from 'pixi.js'

const PLAYER_SHIP_FRAME = new Rectangle(408, 0, 66, 113)

export function createPlayerShipTexture(shipsTexture: Texture): Texture {
  return new Texture({ source: shipsTexture.source, frame: PLAYER_SHIP_FRAME })
}
