// Plain data with no imports: the game code and vite.config.ts both read it, so the production
// build publishes exactly the assets the game loads (everything else stays in assets/ only).

export const SOUND_URLS = {
  cannonFirePlayer: '/sounds/cannon_fire_1.wav',
  cannonFireEnemy: '/sounds/cannon_fire_2.wav',
  explosion: '/sounds/ship_explosion_1.wav',
  hit: '/sounds/ship_wood_hit_1.wav',
  gameStart: '/sounds/game_start.wav',
  gameOver: '/sounds/game_over.wav',
  gameComplete: '/sounds/game_complete.wav',
  scorePoint: '/sounds/score_point.wav',
  pause: '/sounds/game_pause.wav',
  resume: '/sounds/game_resume.wav',
} as const

export const TEXTURE_URLS = {
  tiles: '/tilesheet/tiles_sheet.png',
  ships: '/spritesheet/ships_miscellaneous_sheet.png',
} as const

/** Files the app needs that are not loaded through the lists above. */
export const STATIC_URLS = ['/favicon.svg', '/mockServiceWorker.js'] as const

export const PUBLISHED_ASSET_URLS: readonly string[] = [
  ...Object.values(SOUND_URLS),
  ...Object.values(TEXTURE_URLS),
  ...STATIC_URLS,
]
