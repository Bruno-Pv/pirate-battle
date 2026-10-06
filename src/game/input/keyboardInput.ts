import type { PlayerIntent } from './types'

const FORWARD_KEYS = new Set(['ArrowUp', 'KeyW'])
const BACKWARD_KEYS = new Set(['ArrowDown', 'KeyS'])
const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA'])
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD'])
const FIRE_FRONT_KEYS = new Set(['Space'])
const FIRE_LEFT_KEYS = new Set(['KeyQ'])
const FIRE_RIGHT_KEYS = new Set(['KeyE'])

export interface KeyboardIntentSource {
  attach(): void
  detach(): void
  getIntent(): PlayerIntent
}

export function createKeyboardIntentSource(target: Window = window): KeyboardIntentSource {
  const pressed = new Set<string>()

  function onKeyDown(event: KeyboardEvent) {
    pressed.add(event.code)
  }

  function onKeyUp(event: KeyboardEvent) {
    pressed.delete(event.code)
  }

  function hasAny(keys: Set<string>): boolean {
    for (const key of pressed) {
      if (keys.has(key)) return true
    }
    return false
  }

  return {
    attach() {
      target.addEventListener('keydown', onKeyDown)
      target.addEventListener('keyup', onKeyUp)
    },
    detach() {
      target.removeEventListener('keydown', onKeyDown)
      target.removeEventListener('keyup', onKeyUp)
      pressed.clear()
    },
    getIntent() {
      const forward = hasAny(FORWARD_KEYS)
      const backward = hasAny(BACKWARD_KEYS)
      const left = hasAny(LEFT_KEYS)
      const right = hasAny(RIGHT_KEYS)
      return {
        thrust: forward === backward ? 0 : forward ? 1 : -1,
        turn: left === right ? 0 : right ? 1 : -1,
        fireFront: hasAny(FIRE_FRONT_KEYS),
        fireLeft: hasAny(FIRE_LEFT_KEYS),
        fireRight: hasAny(FIRE_RIGHT_KEYS),
      }
    },
  }
}
