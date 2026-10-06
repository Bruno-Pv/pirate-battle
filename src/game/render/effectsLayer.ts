import { Container, Sprite, type Texture } from 'pixi.js'

export interface EffectSpec {
  readonly texture: Texture
  readonly x: number
  readonly y: number
  readonly lifeMs: number
  readonly startScale?: number
  readonly endScale?: number
}

export interface EffectsLayer {
  readonly container: Container
  spawn(spec: EffectSpec): void
  update(deltaMs: number): void
}

interface ActiveEffect {
  sprite: Sprite
  age: number
  lifeMs: number
  startScale: number
  endScale: number
}

export function createEffectsLayer(): EffectsLayer {
  const container = new Container({ label: 'effects' })
  const active: ActiveEffect[] = []

  return {
    container,
    spawn(spec) {
      const startScale = spec.startScale ?? 1
      const sprite = new Sprite({ texture: spec.texture, anchor: 0.5, x: spec.x, y: spec.y, scale: startScale })
      container.addChild(sprite)
      active.push({ sprite, age: 0, lifeMs: spec.lifeMs, startScale, endScale: spec.endScale ?? startScale * 1.6 })
    },
    update(deltaMs) {
      for (let i = active.length - 1; i >= 0; i -= 1) {
        const effect = active[i]
        effect.age += deltaMs
        const t = Math.min(1, effect.age / effect.lifeMs)
        effect.sprite.alpha = 1 - t
        effect.sprite.scale.set(effect.startScale + (effect.endScale - effect.startScale) * t)
        if (t >= 1) {
          container.removeChild(effect.sprite)
          effect.sprite.destroy()
          active.splice(i, 1)
        }
      }
    },
  }
}
