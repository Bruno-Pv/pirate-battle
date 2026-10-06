import { Rectangle, Sprite, Texture } from 'pixi.js'
import type { Projectile } from '../sim/types'

const CANNONBALL_FRAME = new Rectangle(120, 29, 10, 10)
const PLAYER_TINT = 0xfff2c0
const ENEMY_TINT = 0xff4d4d

export function createProjectileTexture(shipsTexture: Texture): Texture {
  return new Texture({ source: shipsTexture.source, frame: CANNONBALL_FRAME })
}

export function createProjectileSprite(texture: Texture, faction: Projectile['faction']): Sprite {
  const sprite = new Sprite({ texture, anchor: 0.5 })
  sprite.tint = faction === 'player' ? PLAYER_TINT : ENEMY_TINT
  return sprite
}

export function syncProjectileSprite(sprite: Sprite, projectile: Projectile): void {
  sprite.position.set(projectile.position.x, projectile.position.y)
}
