import { STORAGE_KEYS } from '../config/storageKeys'
import type { MatchRecord } from './types'

export function readQueue(): MatchRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.pendingSubmissions)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as MatchRecord[]) : []
  } catch {
    return []
  }
}

const listeners = new Set<() => void>()

/** Calls `listener` whenever this tab changes the pending queue. Returns an unsubscribe function. */
export function subscribeQueue(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function isPending(matchId: string): boolean {
  return readQueue().some((item) => item.matchId === matchId)
}

function writeQueue(queue: readonly MatchRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.pendingSubmissions, JSON.stringify(queue))
  } catch {
    // localStorage can be unavailable; the match just won't survive a refresh before it's sent.
  }
  for (const listener of listeners) listener()
}

export function enqueue(record: MatchRecord): void {
  const queue = readQueue()
  if (queue.some((item) => item.matchId === record.matchId)) return
  writeQueue([...queue, record])
}

export function dequeue(matchId: string): void {
  writeQueue(readQueue().filter((item) => item.matchId !== matchId))
}
