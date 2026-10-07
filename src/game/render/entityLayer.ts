import type { Container } from 'pixi.js'

/** Keeps a pooled display object per entity id in sync with the latest simulation list, adding/removing as needed. */
export function syncEntitySprites<T extends { id: number }, V extends Container>(
  container: Container,
  items: readonly T[],
  pool: Map<number, V>,
  create: (item: T) => V,
  update: (sprite: V, item: T) => void,
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
    // Children (health bar, hull sprite) are owned by the ship; textures are shared, so keep them.
    sprite.destroy({ children: true })
    pool.delete(id)
  }
}
