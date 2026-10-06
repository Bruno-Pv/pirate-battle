import type { CSSProperties, ReactNode } from 'react'

interface QueryStateProps {
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  emptyMessage: string
  onRetry: () => void
  children: ReactNode
}

export function QueryState({ isLoading, isError, isEmpty, emptyMessage, onRetry, children }: QueryStateProps) {
  if (isLoading) {
    return (
      <p style={styles.message} role="status">
        Loading…
      </p>
    )
  }

  if (isError) {
    return (
      <div style={styles.center}>
        <p role="alert" style={styles.errorText}>
          Couldn’t load this right now.
        </p>
        <button type="button" style={styles.retryButton} onClick={onRetry}>
          Retry
        </button>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <p style={styles.message} role="status">
        {emptyMessage}
      </p>
    )
  }

  return <>{children}</>
}

const styles = {
  message: {
    margin: '20px 0',
    fontSize: 14,
    color: '#9fb0c0',
    textAlign: 'center',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    margin: '20px 0',
  },
  errorText: {
    margin: 0,
    fontSize: 14,
    color: '#f87171',
  },
  retryButton: {
    padding: '6px 18px',
    fontSize: 13,
    color: '#e8edf2',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 6,
    cursor: 'pointer',
  },
} as const satisfies Record<string, CSSProperties>
