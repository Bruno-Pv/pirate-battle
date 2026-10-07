import { useEffect, useRef, type CSSProperties, type KeyboardEvent } from 'react'

/** Modal pause dialog: focus starts on Resume and Tab cycles inside it. Escape (handled by
 * GameScreen's global key listener) resumes. */
export function PauseOverlay({ onResume, onQuit }: { onResume: () => void; onQuit: () => void }) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const resumeRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    resumeRef.current?.focus()
  }, [])

  function trapTab(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab') return
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])')
    if (!focusable || focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement
    if (event.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div
      ref={dialogRef}
      style={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Paused"
      onKeyDown={trapTab}
    >
      <h2 style={styles.title}>Paused</h2>
      <button ref={resumeRef} type="button" style={styles.button} onClick={onResume}>
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
