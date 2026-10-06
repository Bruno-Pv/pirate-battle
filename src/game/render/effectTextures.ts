import { Rectangle, Texture } from 'pixi.js'

const EXPLOSION_FRAME = new Rectangle(0, 0, 74, 75)
const MUZZLE_FLASH_FRAME = new Rectangle(120, 0, 11, 27)
const DAMAGE_FIRE_FRAME = new Rectangle(614, 466, 18, 39)

export interface EffectTextures {
  readonly explosion: Texture
  readonly muzzleFlash: Texture
  readonly damageFire: Texture
}

export function createEffectTextures(shipsTexture: Texture): EffectTextures {
  const source = shipsTexture.source
  return {
    explosion: new Texture({ source, frame: EXPLOSION_FRAME }),
    muzzleFlash: new Texture({ source, frame: MUZZLE_FLASH_FRAME }),
    damageFire: new Texture({ source, frame: DAMAGE_FIRE_FRAME }),
  }
}
