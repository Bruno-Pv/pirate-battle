import { useState, type CSSProperties } from 'react'
import { useMatchHistory } from '../../api/queries'
import { formatDateTime, formatTime } from '../formatTime'
import { Pagination } from './Pagination'
import { QueryState } from './QueryState'

export function MatchHistoryPanel() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useMatchHistory(page)

  return (
    <div style={styles.panel}>
      <p style={styles.caption}>Your matches — other captains show up in Ranking.</p>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={(data?.items.length ?? 0) === 0}
        emptyMessage="No matches played yet."
        onRetry={() => void refetch()}
      >
        <table style={styles.table}>
          <thead>
            <tr>
              <th scope="col" style={styles.th}>Date</th>
              <th scope="col" style={styles.th}>Score</th>
              <th scope="col" style={styles.th}>Result</th>
              <th scope="col" style={styles.th}>Duration</th>
              <th scope="col" style={styles.th}>Config</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((entry) => (
              <tr key={entry.matchId}>
                <td style={styles.td}>{formatDateTime(entry.completedAt)}</td>
                <td style={styles.td}>{entry.score}</td>
                <td style={styles.td}>{entry.survived ? 'Survived' : 'Sunk'}</td>
                <td style={styles.td}>{formatTime(entry.elapsedSeconds)}</td>
                <td style={styles.td}>
                  {entry.config.durationSeconds}s session · {entry.config.spawnIntervalSeconds}s spawn
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
      </QueryState>
    </div>
  )
}

const styles = {
  panel: {
    width: 'min(100%, 560px)',
    padding: '0 16px',
  },
  caption: {
    margin: '0 0 10px',
    fontSize: 12,
    color: '#9fb0c0',
    textAlign: 'center',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  },
  th: {
    textAlign: 'left',
    padding: '4px 8px',
    color: '#9fb0c0',
    fontWeight: 500,
    borderBottom: '1px solid rgba(255,255,255,0.15)',
  },
  td: {
    padding: '4px 8px',
    color: '#e8edf2',
  },
} as const satisfies Record<string, CSSProperties>
