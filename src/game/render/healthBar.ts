import type { Graphics } from 'pixi.js'
import { clamp } from '../../lib/math'

const WIDTH = 36
const HEIGHT = 5
const BACKGROUND_COLOR = 0x1c3147
const HIGH_COLOR = 0x4ade80
const MID_COLOR = 0xfacc15
const LOW_COLOR = 0xef4444

export function updateHealthBar(bar: Graphics, hpFraction: number): void {
  const fraction = clamp(hpFraction, 0, 1)
  const color = fraction > 0.5 ? HIGH_COLOR : fraction > 0.25 ? MID_COLOR : LOW_COLOR

  bar.clear()
  bar.rect(-WIDTH / 2, 0, WIDTH, HEIGHT).fill(BACKGROUND_COLOR)
  if (fraction > 0) {
    bar.rect(-WIDTH / 2, 0, WIDTH * fraction, HEIGHT).fill(color)
  }
}
