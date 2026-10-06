import { forwardRef, type CSSProperties } from 'react'

export const TouchControls = forwardRef<HTMLDivElement>(function TouchControls(_props, ref) {
  return (
    <div ref={ref} style={styles.root}>
      <div style={styles.dpad}>
        <TouchButton action="turn-left" style={styles.dpadLeft} label="◀" />
        <TouchButton action="thrust-forward" style={styles.dpadUp} label="▲" />
        <TouchButton action="thrust-backward" style={styles.dpadDown} label="▼" />
        <TouchButton action="turn-right" style={styles.dpadRight} label="▶" />
      </div>
      <div style={styles.fireCluster}>
        <TouchButton action="fire-left" style={styles.fireLeft} label="L" />
        <TouchButton action="fire-front" style={styles.fireFront} label="●" />
        <TouchButton action="fire-right" style={styles.fireRight} label="R" />
      </div>
    </div>
  )
})

function TouchButton({ action, style, label }: { action: string; style: CSSProperties; label: string }) {
  return (
    <button
      type="button"
      data-touch-action={action}
      aria-label={action.replace('-', ' ')}
      style={{ ...styles.button, ...style }}
      onContextMenu={(event) => event.preventDefault()}
    >
      {label}
    </button>
  )
}

const BUTTON_SIZE = 56

const styles = {
  root: {
    position: 'absolute',
    inset: 0,
    touchAction: 'none',
  },
  button: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(11,26,43,0.55)',
    color: '#e8edf2',
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    touchAction: 'none',
  },
  dpad: {
    position: 'absolute',
    left: 24,
    bottom: 24,
    width: BUTTON_SIZE * 3,
    height: BUTTON_SIZE * 3,
  },
  dpadUp: { left: BUTTON_SIZE, top: 0 },
  dpadDown: { left: BUTTON_SIZE, top: BUTTON_SIZE * 2 },
  dpadLeft: { left: 0, top: BUTTON_SIZE },
  dpadRight: { left: BUTTON_SIZE * 2, top: BUTTON_SIZE },
  fireCluster: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: BUTTON_SIZE * 3,
    height: BUTTON_SIZE * 1.4,
  },
  fireLeft: { left: 0, bottom: 0 },
  fireFront: { left: BUTTON_SIZE, bottom: BUTTON_SIZE * 0.6, width: BUTTON_SIZE * 1.2, height: BUTTON_SIZE * 1.2 },
  fireRight: { left: BUTTON_SIZE * 2.2, bottom: 0 },
} as const satisfies Record<string, CSSProperties>
