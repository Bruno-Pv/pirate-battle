import { gameConfig } from '../../config/gameConfig'
import { NEUTRAL_INTENT, type PlayerIntent } from './types'

/** Fraction of the joystick radius that is ignored, so a resting thumb doesn't drift the ship. */
export const JOYSTICK_DEAD_ZONE = 0.15
const FIXED_STEP_SECONDS = 1 / 60
/** Angular error below which the ship stops turning: one fixed step of turning, so the
 * all-or-nothing turn intent can't overshoot the target and oscillate around it. */
const TURN_TOLERANCE = gameConfig.player.turnSpeed * FIXED_STEP_SECONDS
const TWO_PI = Math.PI * 2

export interface JoystickIntentSource {
  attach(container: HTMLElement): void
  detach(): void
  /** Lets go of the stick; a finger still down must touch again to resume steering. */
  reset(): void
  getIntent(): PlayerIntent
}

/**
 * Virtual analog stick. The simulation only understands discrete intents (same as the
 * keyboard), so the analog reading is translated here:
 * - turn: steer toward the stick angle, based on the ship's current heading;
 * - thrust: duty-cycled over fixed steps so average speed is proportional to how far the
 *   stick is pushed from the center.
 */
export function createJoystickIntentSource(getHeading: () => number): JoystickIntentSource {
  let root: HTMLElement | null = null
  let base: HTMLElement | null = null
  let knob: HTMLElement | null = null
  let pointerId: number | null = null
  let angle = 0
  let magnitude = 0
  let thrustAccumulator = 0

  function update(event: PointerEvent) {
    if (!base) return
    const rect = base.getBoundingClientRect()
    const radius = rect.width / 2
    const dx = event.clientX - (rect.left + radius)
    const dy = event.clientY - (rect.top + radius)
    const distance = Math.hypot(dx, dy)
    const clamped = Math.min(distance, radius)
    angle = Math.atan2(dy, dx)
    magnitude = clamped / radius
    if (knob) knob.style.transform = `translate(${Math.cos(angle) * clamped}px, ${Math.sin(angle) * clamped}px)`
  }

  function reset() {
    pointerId = null
    magnitude = 0
    thrustAccumulator = 0
    if (knob) knob.style.transform = 'translate(0px, 0px)'
  }

  function onPointerDown(event: PointerEvent) {
    if (pointerId !== null || !(event.target instanceof HTMLElement)) return
    if (!event.target.closest('[data-joystick]')) return
    event.preventDefault()
    pointerId = event.pointerId
    base?.setPointerCapture?.(event.pointerId)
    update(event)
  }

  function onPointerMove(event: PointerEvent) {
    if (event.pointerId === pointerId) update(event)
  }

  function onPointerEnd(event: PointerEvent) {
    if (event.pointerId === pointerId) reset()
  }

  return {
    attach(container) {
      root = container
      base = container.querySelector<HTMLElement>('[data-joystick]')
      knob = container.querySelector<HTMLElement>('[data-joystick-knob]')
      root.addEventListener('pointerdown', onPointerDown)
      root.addEventListener('pointermove', onPointerMove)
      root.addEventListener('pointerup', onPointerEnd)
      root.addEventListener('pointercancel', onPointerEnd)
    },
    detach() {
      root?.removeEventListener('pointerdown', onPointerDown)
      root?.removeEventListener('pointermove', onPointerMove)
      root?.removeEventListener('pointerup', onPointerEnd)
      root?.removeEventListener('pointercancel', onPointerEnd)
      root = null
      base = null
      knob = null
      reset()
    },
    reset,
    getIntent() {
      if (pointerId === null || magnitude < JOYSTICK_DEAD_ZONE) return NEUTRAL_INTENT

      const error = shortestAngleDiff(angle, getHeading())
      const turn = Math.abs(error) <= TURN_TOLERANCE ? 0 : error > 0 ? 1 : -1

      const strength = (magnitude - JOYSTICK_DEAD_ZONE) / (1 - JOYSTICK_DEAD_ZONE)
      thrustAccumulator += strength
      let thrust: 0 | 1 = 0
      if (thrustAccumulator >= 1) {
        thrustAccumulator -= 1
        thrust = 1
      }

      return { ...NEUTRAL_INTENT, thrust, turn }
    },
  }
}

/** Signed difference `target - current`, wrapped into (-π, π]. */
function shortestAngleDiff(target: number, current: number): number {
  return ((((target - current) % TWO_PI) + TWO_PI + Math.PI) % TWO_PI) - Math.PI
}
