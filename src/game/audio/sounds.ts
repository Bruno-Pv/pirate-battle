import { SOUND_URLS } from '../../config/assetManifest'

export type SoundName = keyof typeof SOUND_URLS

let muted = false
const cache = new Map<SoundName, HTMLAudioElement>()

export function setSoundMuted(value: boolean): void {
  muted = value
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
