import { Container, Sprite, type Graphics, type Texture } from 'pixi.js'
import { gameConfig } from '../../config/gameConfig'
import type { Enemy } from '../sim/types'
import { createHealthBar, updateHealthBar } from './healthBar'
import { damageStageForHpFraction, type HullTextureSet } from './shipTexture'

// Matches the hull artwork's bow-down default orientation, same as the player ship.
const ROTATION_OFFSET = -Math.PI / 2
const HEALTH_BAR_OFFSET_Y = -56
const DAMAGE_FIRE_THRESHOLD = 0.25

export interface EnemySprite extends Container {
  hull: Sprite
  healthBar: Graphics
  damageFire: Sprite
  hullStages: HullTextureSet
  kind: Enemy['kind']
}

export function createEnemySprite(hullStages: HullTextureSet, damageFireTexture: Texture, kind: Enemy['kind']): EnemySprite {
  const container = new Container({ label: `enemy-${kind}` }) as EnemySprite
  container.kind = kind
  container.hullStages = hullStages

  container.hull = new Sprite({ texture: hullStages[0], anchor: 0.5, scale: 0.8 })
  container.addChild(container.hull)

  container.damageFire = new Sprite({ texture: damageFireTexture, anchor: { x: 0.5, y: 1 }, scale: 0.8, visible: false })
  container.addChild(container.damageFire)

  container.healthBar = createHealthBar()
  container.healthBar.position.set(0, HEALTH_BAR_OFFSET_Y)
  container.addChild(container.healthBar)

  return container
}

export function syncEnemySprite(sprite: EnemySprite, enemy: Enemy): void {
  sprite.position.set(enemy.position.x, enemy.position.y)
  sprite.hull.rotation = enemy.heading + ROTATION_OFFSET

  const maxHp = enemy.kind === 'chaser' ? gameConfig.enemies.chaser.maxHp : gameConfig.enemies.shooter.maxHp
  const hpFraction = enemy.hp / maxHp
  sprite.hull.texture = sprite.hullStages[damageStageForHpFraction(hpFraction)]
  updateHealthBar(sprite.healthBar, hpFraction)
  sprite.damageFire.visible = hpFraction > 0 && hpFraction < DAMAGE_FIRE_THRESHOLD
}
