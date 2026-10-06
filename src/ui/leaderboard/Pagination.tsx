import type { CSSProperties } from 'react'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div style={styles.row}>
      <button type="button" style={styles.button} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Prev
      </button>
      <span style={styles.label}>
        Page {page} / {totalPages}
      </span>
      <button type="button" style={styles.button} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  )
}

const styles = {
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  button: {
    padding: '4px 12px',
    fontSize: 13,
    color: '#e8edf2',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 6,
    cursor: 'pointer',
  },
  label: {
    fontSize: 13,
    color: '#9fb0c0',
  },
} as const satisfies Record<string, CSSProperties>
