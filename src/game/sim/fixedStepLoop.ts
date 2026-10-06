import type { Clock } from './clock'

export interface FixedStepLoopOptions {
  readonly stepSeconds: number
  readonly clock: Clock
  readonly onFixedStep: (dt: number) => void
  readonly maxStepsPerFrame?: number
  readonly requestFrame?: (callback: (time: number) => void) => number
  readonly cancelFrame?: (handle: number) => void
}

export interface FixedStepLoop {
  start(): void
  stop(): void
}

export function createFixedStepLoop(options: FixedStepLoopOptions): FixedStepLoop {
  const {
    stepSeconds,
    clock,
    onFixedStep,
    maxStepsPerFrame = 5,
    requestFrame = (callback) => requestAnimationFrame(callback),
    cancelFrame = (handle) => cancelAnimationFrame(handle),
  } = options

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
    while (accumulator >= stepSeconds && steps < maxStepsPerFrame) {
      onFixedStep(stepSeconds)
      accumulator -= stepSeconds
      steps += 1
    }
    if (steps === maxStepsPerFrame) {
      accumulator = 0
    }

    frameHandle = requestFrame(tick)
  }

  return {
    start() {
      if (running) return
      running = true
      lastTime = null
      accumulator = 0
      frameHandle = requestFrame(tick)
    },
    stop() {
      running = false
      if (frameHandle !== null) {
        cancelFrame(frameHandle)
        frameHandle = null
      }
    },
  }
}
