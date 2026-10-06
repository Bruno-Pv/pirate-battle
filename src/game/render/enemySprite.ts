import { Sprite, type Texture } from 'pixi.js'
import type { Enemy } from '../sim/types'

// Matches the hull artwork's bow-down default orientation, same as the player ship.
const ROTATION_OFFSET = -Math.PI / 2
const CHASER_TINT = 0xff6b5b
const SHOOTER_TINT = 0x8a7bff

export function createEnemySprite(texture: Texture, kind: Enemy['kind']): Sprite {
  const sprite = new Sprite({ texture, anchor: 0.5, scale: 0.8 })
  sprite.tint = kind === 'chaser' ? CHASER_TINT : SHOOTER_TINT
  return sprite
}

export function syncEnemySprite(sprite: Sprite, enemy: Enemy): void {
  sprite.position.set(enemy.position.x, enemy.position.y)
  sprite.rotation = enemy.heading + ROTATION_OFFSET
}
