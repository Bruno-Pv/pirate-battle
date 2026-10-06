import type { CSSProperties } from 'react'
import type { MatchResult } from '../result/matchResult'

interface ResultScreenProps {
  result: MatchResult
  onPlayAgain: () => void
  onMenu: () => void
}

export function ResultScreen({ result, onPlayAgain, onMenu }: ResultScreenProps) {
  const minutes = Math.floor(result.elapsedSeconds / 60)
  const seconds = Math.floor(result.elapsedSeconds % 60)

  return (
    <div style={styles.screen}>
      <h1 style={styles.title}>{result.survived ? 'Match Complete' : 'Ship Sunk'}</h1>
      <p style={styles.subtitle}>{result.playerName}</p>

      <div style={styles.stats}>
        <Stat label="Score" value={String(result.score)} />
        <Stat label="Time survived" value={`${minutes}:${seconds.toString().padStart(2, '0')}`} />
      </div>

      <div style={styles.actions}>
        <button type="button" style={styles.primaryButton} onClick={onPlayAgain}>
          Play Again
        </button>
        <button type="button" style={styles.secondaryButton} onClick={onMenu}>
          Menu
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.stat}>
      <span style={styles.statValue}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  )
}

const styles = {
  screen: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    fontFamily: 'system-ui, sans-serif',
    color: '#e8edf2',
  },
  title: {
    margin: 0,
    fontSize: 34,
  },
  subtitle: {
    margin: 0,
    color: '#9fb0c0',
  },
  stats: {
    display: 'flex',
    gap: 32,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 600,
  },
  statLabel: {
    fontSize: 13,
    color: '#9fb0c0',
  },
  actions: {
    display: 'flex',
    gap: 12,
  },
  primaryButton: {
    padding: '12px 28px',
    fontSize: 16,
    color: '#0b1a2b',
    background: '#3ba2ff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '12px 28px',
    fontSize: 16,
    color: '#e8edf2',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 8,
    cursor: 'pointer',
  },
} as const satisfies Record<string, CSSProperties>
