import type { CSSProperties } from 'react'
import type { HudSnapshot } from '../../game/bridge/gameBridge'

export function Hud({ snapshot }: { snapshot: HudSnapshot }) {
  const minutes = Math.floor(snapshot.timeRemaining / 60)
  const seconds = snapshot.timeRemaining % 60
  const timeLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`
  const hpFraction = snapshot.maxHp > 0 ? snapshot.hp / snapshot.maxHp : 0

  return (
    <div style={styles.hud}>
      <div style={styles.hpTrack} aria-hidden="true">
        <div style={{ ...styles.hpFill, width: `${Math.max(0, hpFraction) * 100}%` }} />
      </div>
      <div style={styles.row}>
        <span>Score: {snapshot.score}</span>
        <span>{timeLabel}</span>
      </div>
      <p style={styles.srOnly} aria-live="polite">
        Score {snapshot.score}. Time remaining {timeLabel}.
      </p>
    </div>
  )
}

const styles = {
  hud: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
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
