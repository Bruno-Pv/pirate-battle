import { Rectangle, Texture } from 'pixi.js'

const HULL_FRAME = new Rectangle(408, 0, 66, 113)

export function createHullTexture(shipsTexture: Texture): Texture {
  return new Texture({ source: shipsTexture.source, frame: HULL_FRAME })
}
