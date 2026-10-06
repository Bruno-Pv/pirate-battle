import { Assets, type Texture } from 'pixi.js'

const ASSET_URLS = {
  tiles: '/tilesheet/tiles_sheet.png',
  ships: '/spritesheet/ships_miscellaneous_sheet.png',
} as const

export interface GameTextures {
  readonly tiles: Texture
  readonly ships: Texture
}

export async function loadGameTextures(onProgress: (progress: number) => void): Promise<GameTextures> {
  const urls = Object.values(ASSET_URLS)
  const loaded = await Assets.load<Texture>(urls, onProgress)
  return {
    tiles: loaded[ASSET_URLS.tiles],
    ships: loaded[ASSET_URLS.ships],
  }
}
