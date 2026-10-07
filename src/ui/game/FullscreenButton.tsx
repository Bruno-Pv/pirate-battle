import { useEffect, useState, type CSSProperties } from 'react'

function isSupported(): boolean {
  return typeof document.documentElement.requestFullscreen === 'function' && document.fullscreenEnabled !== false
}

/** Hides the browser chrome on mobile. Renders nothing where the Fullscreen API is missing
 * (e.g. iPhone Safari), and swallows rejections (user gesture / policy) silently. */
export function FullscreenButton() {
  const [supported] = useState(isSupported)
  const [active, setActive] = useState(() => document.fullscreenElement !== null)

  useEffect(() => {
    function onChange() {
      setActive(document.fullscreenElement !== null)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  if (!supported) return null

  function toggle() {
    const request = active ? document.exitFullscreen() : document.documentElement.requestFullscreen()
    request.catch(() => {})
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={active ? 'Exit fullscreen' : 'Enter fullscreen'}
      aria-pressed={active}
      style={styles.button}
    >
      {active ? '⤡' : '⤢'}
    </button>
  )
}

const styles = {
  button: {
    position: 'absolute',
    top: 'calc(40px + env(safe-area-inset-top, 0px))',
    right: 'calc(12px + env(safe-area-inset-right, 0px))',
    width: 40,
    height: 40,
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(11,26,43,0.55)',
    color: '#e8edf2',
    fontSize: 20,
    cursor: 'pointer',
  },
} as const satisfies Record<string, CSSProperties>
