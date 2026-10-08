import { useSyncExternalStore } from 'react'

const QUERY = '(any-pointer: coarse)'

function subscribe(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => {}
  const list = window.matchMedia(QUERY)
  list.addEventListener('change', onChange)
  return () => list.removeEventListener('change', onChange)
}

function getSnapshot(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches
}

/** True when any connected input is a touch screen (detected by capability, not by screen size or
 * user agent), and updates when that changes, e.g. a touch screen or tablet mode appearing. */
export function useHasTouch(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
