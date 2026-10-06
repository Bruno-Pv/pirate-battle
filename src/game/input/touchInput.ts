import type { PlayerIntent } from './types'

type TouchAction = 'thrust-forward' | 'thrust-backward' | 'turn-left' | 'turn-right' | 'fire-front' | 'fire-left' | 'fire-right'

const ACTIONS: readonly TouchAction[] = [
  'thrust-forward',
  'thrust-backward',
  'turn-left',
  'turn-right',
  'fire-front',
  'fire-left',
  'fire-right',
]

export interface TouchIntentSource {
  attach(container: HTMLElement): void
  detach(): void
  getIntent(): PlayerIntent
}

export function createTouchIntentSource(): TouchIntentSource {
  const active = new Set<TouchAction>()
  const pointerToAction = new Map<number, TouchAction>()
  let root: HTMLElement | null = null

  function actionFromTarget(target: EventTarget | null): TouchAction | null {
    if (!(target instanceof HTMLElement)) return null
    const action = target.closest<HTMLElement>('[data-touch-action]')?.dataset.touchAction
    return isTouchAction(action) ? action : null
  }

  function onPointerDown(event: PointerEvent) {
    const action = actionFromTarget(event.target)
    if (!action) return
    event.preventDefault()
    pointerToAction.set(event.pointerId, action)
    active.add(action)
  }

  function onPointerEnd(event: PointerEvent) {
    const action = pointerToAction.get(event.pointerId)
    if (!action) return
    pointerToAction.delete(event.pointerId)
    if (![...pointerToAction.values()].includes(action)) active.delete(action)
  }

  return {
    attach(container) {
      root = container
      root.addEventListener('pointerdown', onPointerDown)
      root.addEventListener('pointerup', onPointerEnd)
      root.addEventListener('pointercancel', onPointerEnd)
      root.addEventListener('pointerleave', onPointerEnd)
    },
    detach() {
      root?.removeEventListener('pointerdown', onPointerDown)
      root?.removeEventListener('pointerup', onPointerEnd)
      root?.removeEventListener('pointercancel', onPointerEnd)
      root?.removeEventListener('pointerleave', onPointerEnd)
      root = null
      active.clear()
      pointerToAction.clear()
    },
    getIntent() {
      const forward = active.has('thrust-forward')
      const backward = active.has('thrust-backward')
      const left = active.has('turn-left')
      const right = active.has('turn-right')
      return {
        thrust: forward === backward ? 0 : forward ? 1 : -1,
        turn: left === right ? 0 : right ? 1 : -1,
        fireFront: active.has('fire-front'),
        fireLeft: active.has('fire-left'),
        fireRight: active.has('fire-right'),
      }
    },
  }
}

function isTouchAction(value: string | undefined): value is TouchAction {
  return value !== undefined && (ACTIONS as readonly string[]).includes(value)
}
