import { Assets, type Texture } from 'pixi.js'

const TILES_SHEET_URL = '/tilesheet/tiles_sheet.png'

export async function loadArenaTexture(onProgress: (progress: number) => void): Promise<Texture> {
  return Assets.load<Texture>(TILES_SHEET_URL, onProgress)
}
