import type { MatchRecord } from './types'

const STORAGE_KEY = 'pirate-battle:pending-submissions'

export function readQueue(): MatchRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as MatchRecord[]) : []
  } catch {
    return []
  }
}

function writeQueue(queue: readonly MatchRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch {
    // localStorage can be unavailable; the match just won't survive a refresh before it's sent.
  }
}

export function enqueue(record: MatchRecord): void {
  const queue = readQueue()
  if (queue.some((item) => item.matchId === record.matchId)) return
  writeQueue([...queue, record])
}

export function dequeue(matchId: string): void {
  writeQueue(readQueue().filter((item) => item.matchId !== matchId))
}
