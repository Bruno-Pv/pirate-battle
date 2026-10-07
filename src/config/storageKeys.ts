/** Every `localStorage` key the app uses, in one place so readers and writers can't drift. */
export const STORAGE_KEYS = {
  options: 'pirate-battle:options',
  lastResult: 'pirate-battle:last-result',
  mockMatches: 'pirate-battle:mock-matches',
  myMatchIds: 'pirate-battle:my-match-ids',
  pendingSubmissions: 'pirate-battle:pending-submissions',
} as const
