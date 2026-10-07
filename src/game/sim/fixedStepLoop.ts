import type { Clock } from './clock'

/** Caps catch-up work per rendered frame so one slow frame can't snowball into a "spiral of death". */
const MAX_STEPS_PER_FRAME = 5

export interface FixedStepLoopOptions {
  readonly stepSeconds: number
  readonly clock: Clock
  readonly onFixedStep: (dt: number) => void
}

export interface FixedStepLoop {
  start(): void
  stop(): void
}

export function createFixedStepLoop({ stepSeconds, clock, onFixedStep }: FixedStepLoopOptions): FixedStepLoop {
  let accumulator = 0
  let lastTime: number | null = null
  let frameHandle: number | null = null
  let running = false

  function tick() {
    if (!running) return

    const now = clock.now()
    const elapsed = lastTime === null ? 0 : (now - lastTime) / 1000
    lastTime = now
    accumulator += elapsed

    let steps = 0
    while (accumulator >= stepSeconds && steps < MAX_STEPS_PER_FRAME) {
      onFixedStep(stepSeconds)
      accumulator -= stepSeconds
      steps += 1
    }
    if (steps === MAX_STEPS_PER_FRAME) {
      accumulator = 0
    }

    frameHandle = requestAnimationFrame(tick)
  }

  return {
    start() {
      if (running) return
      running = true
      lastTime = null
      accumulator = 0
      frameHandle = requestAnimationFrame(tick)
    },
    stop() {
      running = false
      if (frameHandle !== null) {
        cancelAnimationFrame(frameHandle)
        frameHandle = null
      }
    },
  }
}
