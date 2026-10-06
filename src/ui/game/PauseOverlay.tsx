import type { CSSProperties } from 'react'

export function PauseOverlay({ onResume, onQuit }: { onResume: () => void; onQuit: () => void }) {
  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label="Paused">
      <h2 style={styles.title}>Paused</h2>
      <button type="button" style={styles.button} onClick={onResume}>
        Resume
      </button>
      <button type="button" style={styles.secondaryButton} onClick={onQuit}>
        Quit to Menu
      </button>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    background: 'rgba(11,26,43,0.85)',
    color: '#e8edf2',
    fontFamily: 'system-ui, sans-serif',
  },
  title: {
    margin: 0,
    fontSize: 28,
  },
  button: {
    padding: '10px 28px',
    fontSize: 16,
    color: '#0b1a2b',
    background: '#3ba2ff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '8px 20px',
    fontSize: 14,
    color: '#e8edf2',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: 6,
    cursor: 'pointer',
  },
} as const satisfies Record<string, CSSProperties>
