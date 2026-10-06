import { useState, type CSSProperties } from 'react'
import { useRanking } from '../../api/queries'
import type { MatchConfig } from '../../api/types'
import { formatTime } from './format'
import { Pagination } from './Pagination'
import { QueryState } from './QueryState'

export function RankingPanel({ config }: { config: MatchConfig }) {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = useRanking(config, page)

  return (
    <div style={styles.panel}>
      <p style={styles.caption}>
        {config.durationSeconds}s matches, a new enemy every {config.spawnIntervalSeconds}s
      </p>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={(data?.items.length ?? 0) === 0}
        emptyMessage="No one has played this configuration yet. Be the first!"
        onRetry={() => void refetch()}
      >
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Captain</th>
              <th style={styles.th}>Score</th>
              <th style={styles.th}>Time</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((entry, index) => (
              <tr key={entry.matchId}>
                <td style={styles.td}>{(data.page - 1) * data.pageSize + index + 1}</td>
                <td style={styles.td}>{entry.playerName}</td>
                <td style={styles.td}>{entry.score}</td>
                <td style={styles.td}>{formatTime(entry.elapsedSeconds)}</td>
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
    width: 320,
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
