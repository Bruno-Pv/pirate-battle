import type { CSSProperties } from 'react'
import type { MatchResult } from '../result/matchResult'
import type { SubmissionStatus } from '../result/submissionStatus'

interface ResultScreenProps {
  result: MatchResult
  submissionStatus: SubmissionStatus
  onRetrySubmission: () => void
  onPlayAgain: () => void
  onMenu: () => void
}

export function ResultScreen({ result, submissionStatus, onRetrySubmission, onPlayAgain, onMenu }: ResultScreenProps) {
  const minutes = Math.floor(result.elapsedSeconds / 60)
  const seconds = Math.floor(result.elapsedSeconds % 60)

  return (
    <div style={styles.screen}>
      <h1 style={styles.title}>{result.survived ? 'Match Complete' : 'Ship Sunk'}</h1>
      <p style={styles.subtitle}>{result.playerName}</p>
      <p style={styles.reason}>
        {result.survived
          ? `Time's up — you survived the full ${result.config.durationSeconds}s session`
          : 'Your ship was sunk by the enemy'}
      </p>

      <div style={styles.stats}>
        <Stat label="Score" value={String(result.score)} />
        <Stat label="Time survived" value={`${minutes}:${seconds.toString().padStart(2, '0')}`} />
      </div>

      <SubmissionBadge status={submissionStatus} onRetry={onRetrySubmission} />

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

function SubmissionBadge({ status, onRetry }: { status: SubmissionStatus; onRetry: () => void }) {
  if (status === 'saving') {
    return (
      <p style={styles.badge} role="status">
        Saving…
      </p>
    )
  }

  if (status === 'saved') {
    return (
      <p style={{ ...styles.badge, color: '#4ade80' }} role="status">
        Saved to ranking
      </p>
    )
  }

  return (
    <div style={styles.pendingRow} role="alert">
      <span style={{ ...styles.badge, color: '#facc15' }}>Pending — couldn’t reach the server</span>
      <button type="button" style={styles.retryButton} onClick={onRetry}>
        Retry
      </button>
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
    gap: 20,
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
  reason: {
    margin: 0,
    fontSize: 14,
    color: '#cdd8e3',
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
  badge: {
    margin: 0,
    fontSize: 13,
  },
  pendingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  retryButton: {
    padding: '4px 14px',
    fontSize: 12,
    color: '#e8edf2',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 6,
    cursor: 'pointer',
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
