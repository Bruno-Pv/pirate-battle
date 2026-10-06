import { Container, Sprite, type Graphics, type Texture } from 'pixi.js'
import { gameConfig } from '../../config/gameConfig'
import type { ShipState } from '../sim/types'
import { createHealthBar, updateHealthBar } from './healthBar'
import { damageStageForHpFraction, type HullTextureSet } from './shipTexture'

// The ship artwork's bow points down (+Y) at rotation 0, while headings are
// measured from +X, so rendering needs a constant -90° correction.
const SHIP_ROTATION_OFFSET = -Math.PI / 2
const HEALTH_BAR_OFFSET_Y = -70
const DAMAGE_FIRE_THRESHOLD = 0.25

export interface PlayerSprite extends Container {
  hull: Sprite
  healthBar: Graphics
  damageFire: Sprite
  hullStages: HullTextureSet
}

export function createPlayerSprite(hullStages: HullTextureSet, damageFireTexture: Texture): PlayerSprite {
  const container = new Container({ label: 'player' }) as PlayerSprite
  container.hullStages = hullStages

  container.hull = new Sprite({ texture: hullStages[0], anchor: 0.5 })
  container.addChild(container.hull)

  container.damageFire = new Sprite({ texture: damageFireTexture, anchor: { x: 0.5, y: 1 }, visible: false })
  container.addChild(container.damageFire)

  container.healthBar = createHealthBar()
  container.healthBar.position.set(0, HEALTH_BAR_OFFSET_Y)
  container.addChild(container.healthBar)

  return container
}

export function syncPlayerSprite(sprite: PlayerSprite, ship: ShipState): void {
  sprite.position.set(ship.position.x, ship.position.y)
  sprite.hull.rotation = ship.heading + SHIP_ROTATION_OFFSET

  const hpFraction = ship.hp / gameConfig.player.maxHp
  sprite.hull.texture = sprite.hullStages[damageStageForHpFraction(hpFraction)]
  updateHealthBar(sprite.healthBar, hpFraction)
  sprite.damageFire.visible = hpFraction > 0 && hpFraction < DAMAGE_FIRE_THRESHOLD
}
