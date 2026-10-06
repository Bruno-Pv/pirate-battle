import type { Container, Sprite } from 'pixi.js'

/** Keeps a pooled Sprite per entity id in sync with the latest simulation list, adding/removing as needed. */
export function syncEntitySprites<T extends { id: number }>(
  container: Container,
  items: readonly T[],
  pool: Map<number, Sprite>,
  create: (item: T) => Sprite,
  update: (sprite: Sprite, item: T) => void,
): void {
  const seen = new Set<number>()

  for (const item of items) {
    seen.add(item.id)
    let sprite = pool.get(item.id)
    if (!sprite) {
      sprite = create(item)
      pool.set(item.id, sprite)
      container.addChild(sprite)
    }
    update(sprite, item)
  }

  for (const [id, sprite] of pool) {
    if (seen.has(id)) continue
    container.removeChild(sprite)
    sprite.destroy()
    pool.delete(id)
  }
}
