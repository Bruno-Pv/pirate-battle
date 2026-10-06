import { gameConfig } from '../config/gameConfig'
import type { MatchRecord } from '../api/types'

const DEFAULT_CONFIG = {
  durationSeconds: gameConfig.match.durationSeconds,
  spawnIntervalSeconds: gameConfig.spawn.intervalSeconds,
}

const ALT_CONFIG = { durationSeconds: 60, spawnIntervalSeconds: 3 }

const DAY_MS = 86_400_000
const now = Date.now()

/** Seed data for a fresh profile, so Ranking and History aren't empty on first load. */
export const matchFixtures: readonly MatchRecord[] = [
  { matchId: 'fixture-1', playerName: 'Blackbeard', score: 18, survived: true, elapsedSeconds: 120, completedAt: now - DAY_MS * 1, config: DEFAULT_CONFIG },
  { matchId: 'fixture-2', playerName: 'Anne Bonny', score: 15, survived: true, elapsedSeconds: 120, completedAt: now - DAY_MS * 2, config: DEFAULT_CONFIG },
  { matchId: 'fixture-3', playerName: 'Calico Jack', score: 15, survived: true, elapsedSeconds: 120, completedAt: now - DAY_MS * 3, config: DEFAULT_CONFIG },
  { matchId: 'fixture-4', playerName: 'Mary Read', score: 12, survived: false, elapsedSeconds: 94, completedAt: now - DAY_MS * 1.5, config: DEFAULT_CONFIG },
  { matchId: 'fixture-5', playerName: 'Henry Morgan', score: 9, survived: false, elapsedSeconds: 71, completedAt: now - DAY_MS * 4, config: DEFAULT_CONFIG },
  { matchId: 'fixture-6', playerName: 'Grace O’Malley', score: 7, survived: false, elapsedSeconds: 52, completedAt: now - DAY_MS * 5, config: DEFAULT_CONFIG },
  { matchId: 'fixture-7', playerName: 'William Kidd', score: 5, survived: false, elapsedSeconds: 38, completedAt: now - DAY_MS * 6, config: DEFAULT_CONFIG },
  { matchId: 'fixture-8', playerName: 'Edward Low', score: 3, survived: false, elapsedSeconds: 21, completedAt: now - DAY_MS * 7, config: DEFAULT_CONFIG },
  { matchId: 'fixture-9', playerName: 'Bartholomew Roberts', score: 11, survived: true, elapsedSeconds: 60, completedAt: now - DAY_MS * 2, config: ALT_CONFIG },
  { matchId: 'fixture-10', playerName: 'Samuel Bellamy', score: 8, survived: false, elapsedSeconds: 45, completedAt: now - DAY_MS * 3, config: ALT_CONFIG },
]
