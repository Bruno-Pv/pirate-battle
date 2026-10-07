import { Assets, type Texture } from 'pixi.js'
import { TEXTURE_URLS } from '../../config/assetManifest'

export interface GameTextures {
  readonly tiles: Texture
  readonly ships: Texture
}

export async function loadGameTextures(onProgress: (progress: number) => void): Promise<GameTextures> {
  const urls = Object.values(TEXTURE_URLS)
  // Pixi's default strategy is 'skip', which resolves with `undefined` for a failed file
  // instead of rejecting, so ask for 'throw' (and still validate below).
  const loaded = await Assets.load<Texture>(urls, { onProgress, strategy: 'throw' })
  const tiles = loaded[TEXTURE_URLS.tiles]
  const ships = loaded[TEXTURE_URLS.ships]
  if (!tiles || !ships) {
    throw new Error('Some textures could not be loaded')
  }
  return { tiles, ships }
}
