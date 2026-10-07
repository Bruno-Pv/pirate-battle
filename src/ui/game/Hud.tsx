import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { HudSnapshot } from '../../game/bridge/gameBridge'
import { formatTime } from '../formatTime'

/** Seconds remaining at which the time is announced to screen readers. */
const TIME_MILESTONES_SECONDS = [60, 30, 10]

/** Screen-reader text for the one thing that just changed (score, pause, end, time milestone),
 * so the live region stays quiet instead of repeating the clock every second. */
function useAnnouncement(snapshot: HudSnapshot): string {
  const [message, setMessage] = useState('')
  const previous = useRef(snapshot)

  useEffect(() => {
    const before = previous.current
    previous.current = snapshot

    let next: string | null = null
    if (snapshot.status === 'ended' && before.status !== 'ended') {
      next = snapshot.hp > 0 ? `Time is up. Final score ${snapshot.score}.` : `Ship sunk. Final score ${snapshot.score}.`
    } else if (snapshot.paused !== before.paused) {
      next = snapshot.paused ? 'Game paused.' : 'Game resumed.'
    } else if (snapshot.score > before.score) {
      next = `Score ${snapshot.score}.`
    } else if (
      snapshot.timeRemaining !== before.timeRemaining &&
      TIME_MILESTONES_SECONDS.includes(snapshot.timeRemaining)
    ) {
      next = `${snapshot.timeRemaining} seconds remaining.`
    }
    if (next !== null) setMessage(next)
  }, [snapshot])

  return message
}

export function Hud({ snapshot }: { snapshot: HudSnapshot }) {
  const announcement = useAnnouncement(snapshot)
  const timeLabel = formatTime(snapshot.timeRemaining)
  const hpFraction = snapshot.maxHp > 0 ? snapshot.hp / snapshot.maxHp : 0

  return (
    <div style={styles.hud}>
      <div
        style={styles.hpTrack}
        role="progressbar"
        aria-label="Hull"
        aria-valuemin={0}
        aria-valuemax={snapshot.maxHp}
        aria-valuenow={snapshot.hp}
      >
        <div style={{ ...styles.hpFill, width: `${Math.max(0, hpFraction) * 100}%` }} />
      </div>
      <div style={styles.row}>
        <span>Score: {snapshot.score}</span>
        <span>{timeLabel}</span>
      </div>
      <p style={styles.srOnly} role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}

const styles = {
  hud: {
    position: 'absolute',
    top: 'calc(12px + env(safe-area-inset-top, 0px))',
    left: 'calc(12px + env(safe-area-inset-left, 0px))',
    right: 'calc(12px + env(safe-area-inset-right, 0px))',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    color: '#e8edf2',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 16,
    pointerEvents: 'none',
    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  hpTrack: {
    width: 220,
    height: 10,
    borderRadius: 5,
    background: 'rgba(28,49,71,0.85)',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.15)',
  },
  hpFill: {
    height: '100%',
    background: '#4ade80',
    transition: 'width 120ms linear',
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
  },
} as const satisfies Record<string, CSSProperties>
