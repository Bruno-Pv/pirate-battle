const SOUND_URLS = {
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
  uiClick: '/sounds/ui_click.wav',
  uiHover: '/sounds/ui_hover.wav',
} as const

export type SoundName = keyof typeof SOUND_URLS

let muted = false
const cache = new Map<SoundName, HTMLAudioElement>()

export function setSoundMuted(value: boolean): void {
  muted = value
}

export function isSoundMuted(): boolean {
  return muted
}

export function playSound(name: SoundName, volume = 1): void {
  if (muted) return

  let base = cache.get(name)
  if (!base) {
    base = new Audio(SOUND_URLS[name])
    cache.set(name, base)
  }

  const instance = base.cloneNode(true) as HTMLAudioElement
  instance.volume = volume
  void instance.play().catch(() => {
    // Autoplay can be blocked until the user interacts with the page; safe to ignore.
  })
}
