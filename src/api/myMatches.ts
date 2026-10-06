const STORAGE_KEY = 'pirate-battle:my-match-ids'

/** IDs of matches this browser actually played (as opposed to the seeded fixtures), so the
 * History tab can show only the current captain's own matches. */
export function getMyMatchIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

export function recordMyMatch(matchId: string): void {
  try {
    const ids = getMyMatchIds()
    if (ids.includes(matchId)) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, matchId]))
  } catch {
    // localStorage can be unavailable; the match will just show up under Ranking only.
  }
}
