import { Container, Graphics, Sprite, type Texture } from 'pixi.js'
import type { Vector2 } from '../sim/types'
import { updateHealthBar } from './healthBar'
import { damageStageForHpFraction, type HullTextureSet } from './shipTexture'

// The ship artwork's bow points down (+Y) at rotation 0, while headings are
// measured from +X, so rendering needs a constant -90° correction.
const ROTATION_OFFSET = -Math.PI / 2
const DAMAGE_FIRE_THRESHOLD = 0.25

export interface ShipSpriteOptions {
  readonly label: string
  readonly hullStages: HullTextureSet
  readonly damageFireTexture: Texture
  readonly scale: number
  readonly healthBarOffsetY: number
}

export interface ShipSprite extends Container {
  hull: Sprite
  healthBar: Graphics
  damageFire: Sprite
  hullStages: HullTextureSet
}

/** Hull + damage fire + health bar, shared by the player and every enemy kind. */
export function createShipSprite(options: ShipSpriteOptions): ShipSprite {
  const container = new Container({ label: options.label }) as ShipSprite
  container.hullStages = options.hullStages

  container.hull = new Sprite({ texture: options.hullStages[0], anchor: 0.5, scale: options.scale })
  container.addChild(container.hull)

  container.damageFire = new Sprite({
    texture: options.damageFireTexture,
    anchor: { x: 0.5, y: 1 },
    scale: options.scale,
    visible: false,
  })
  container.addChild(container.damageFire)

  container.healthBar = new Graphics()
  container.healthBar.position.set(0, options.healthBarOffsetY)
  container.addChild(container.healthBar)

  return container
}

export function syncShipSprite(
  sprite: ShipSprite,
  ship: { readonly position: Vector2; readonly heading: number },
  hpFraction: number,
): void {
  sprite.position.set(ship.position.x, ship.position.y)
  sprite.hull.rotation = ship.heading + ROTATION_OFFSET
  sprite.hull.texture = sprite.hullStages[damageStageForHpFraction(hpFraction)]
  updateHealthBar(sprite.healthBar, hpFraction)
  sprite.damageFire.visible = hpFraction > 0 && hpFraction < DAMAGE_FIRE_THRESHOLD
}
