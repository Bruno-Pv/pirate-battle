import type { Vector2 } from './types'

export function headingForward(heading: number): Vector2 {
  return { x: Math.cos(heading), y: Math.sin(heading) }
}

export function headingRight(heading: number): Vector2 {
  return { x: -Math.sin(heading), y: Math.cos(heading) }
}

export function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function subtract(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y }
}

export function scale(v: Vector2, factor: number): Vector2 {
  return { x: v.x * factor, y: v.y * factor }
}

export function addScaled(a: Vector2, v: Vector2, factor: number): Vector2 {
  return { x: a.x + v.x * factor, y: a.y + v.y * factor }
}

export function length(v: Vector2): number {
  return Math.hypot(v.x, v.y)
}

export function normalize(v: Vector2): Vector2 {
  const len = length(v)
  return len === 0 ? { x: 0, y: 0 } : { x: v.x / len, y: v.y / len }
}
