import { forwardRef, type CSSProperties } from 'react'

/** The container always exists (the input sources attach to it once); the controls inside it only
 * render when `enabled`, i.e. on devices with a touch screen. */
export const TouchControls = forwardRef<HTMLDivElement, { enabled: boolean }>(function TouchControls(
  { enabled },
  ref,
) {
  return (
    <div ref={ref} style={enabled ? styles.root : styles.rootHidden}>
      {enabled && (
        <>
          <div
            data-joystick
            role="group"
            aria-label="Movement joystick"
            style={styles.joystick}
            onContextMenu={(event) => event.preventDefault()}
          >
            <div data-joystick-knob style={styles.knob} />
          </div>
          <div style={styles.fireCluster}>
            <TouchButton action="fire-left" style={styles.fireLeft} label="L" />
            <TouchButton action="fire-front" style={styles.fireFront} label="●" />
            <TouchButton action="fire-right" style={styles.fireRight} label="R" />
          </div>
        </>
      )}
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
const JOYSTICK_SIZE = 150

const styles = {
  root: {
    position: 'absolute',
    inset: 0,
    touchAction: 'none',
  },
  rootHidden: {
    display: 'none',
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
  joystick: {
    position: 'absolute',
    left: 'calc(24px + env(safe-area-inset-left, 0px))',
    bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(11,26,43,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'none',
    userSelect: 'none',
  },
  knob: {
    width: JOYSTICK_SIZE * 0.4,
    height: JOYSTICK_SIZE * 0.4,
    borderRadius: '50%',
    background: 'rgba(232,237,242,0.55)',
    border: '1px solid rgba(255,255,255,0.5)',
    pointerEvents: 'none',
  },
  fireCluster: {
    position: 'absolute',
    right: 'calc(24px + env(safe-area-inset-right, 0px))',
    bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
    width: BUTTON_SIZE * 3,
    height: BUTTON_SIZE * 1.4,
  },
  fireLeft: { left: 0, bottom: 0 },
  fireFront: { left: BUTTON_SIZE, bottom: BUTTON_SIZE * 0.6, width: BUTTON_SIZE * 1.2, height: BUTTON_SIZE * 1.2 },
  fireRight: { left: BUTTON_SIZE * 2.2, bottom: 0 },
} as const satisfies Record<string, CSSProperties>
