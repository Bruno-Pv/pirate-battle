export interface MatchResult {
  readonly score: number
  readonly survived: boolean
  readonly elapsedSeconds: number
  readonly playerName: string
  readonly completedAt: number
}

const STORAGE_KEY = 'pirate-battle:last-result'

export function loadLastResult(): MatchResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<MatchResult>
    if (
      typeof parsed.score !== 'number' ||
      typeof parsed.survived !== 'boolean' ||
      typeof parsed.elapsedSeconds !== 'number' ||
      typeof parsed.playerName !== 'string' ||
      typeof parsed.completedAt !== 'number'
    ) {
      return null
    }
    return parsed as MatchResult
  } catch {
    return null
  }
}

export function saveLastResult(result: MatchResult): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
  } catch {
    // localStorage can be unavailable; the result just won't survive a refresh.
  }
}
