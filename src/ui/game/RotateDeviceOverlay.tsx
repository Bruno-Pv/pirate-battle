import type { CSSProperties } from 'react'

export function RotateDeviceOverlay() {
  return (
    <div style={styles.overlay} role="alert">
      <span style={styles.icon} aria-hidden="true">
        ⟳
      </span>
      <p style={styles.text}>Rotate your device to landscape to keep playing</p>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    background: '#0b1a2b',
    color: '#e8edf2',
    fontFamily: 'system-ui, sans-serif',
    textAlign: 'center',
    padding: '0 32px',
  },
  icon: {
    fontSize: 48,
  },
  text: {
    margin: 0,
    fontSize: 16,
    maxWidth: 280,
  },
} as const satisfies Record<string, CSSProperties>
