import { Graphics } from 'pixi.js'

const WIDTH = 36
const HEIGHT = 5
const BACKGROUND_COLOR = 0x1c3147
const HIGH_COLOR = 0x4ade80
const MID_COLOR = 0xfacc15
const LOW_COLOR = 0xef4444

export function createHealthBar(): Graphics {
  return new Graphics()
}

export function updateHealthBar(bar: Graphics, hpFraction: number): void {
  const fraction = Math.max(0, Math.min(1, hpFraction))
  const color = fraction > 0.5 ? HIGH_COLOR : fraction > 0.25 ? MID_COLOR : LOW_COLOR

  bar.clear()
  bar.rect(-WIDTH / 2, 0, WIDTH, HEIGHT).fill(BACKGROUND_COLOR)
  if (fraction > 0) {
    bar.rect(-WIDTH / 2, 0, WIDTH * fraction, HEIGHT).fill(color)
  }
}
