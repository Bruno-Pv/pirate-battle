import { Sprite, type Texture } from 'pixi.js'
import type { ShipState } from '../sim/types'

// The ship artwork's bow points down (+Y) at rotation 0, while headings are
// measured from +X, so rendering needs a constant -90° correction.
const SHIP_ROTATION_OFFSET = -Math.PI / 2

export function createPlayerSprite(texture: Texture): Sprite {
  return new Sprite({ texture, anchor: 0.5 })
}

export function syncPlayerSprite(sprite: Sprite, ship: ShipState): void {
  sprite.position.set(ship.position.x, ship.position.y)
  sprite.rotation = ship.heading + SHIP_ROTATION_OFFSET
}
