/** Formats a duration in seconds as `m:ss`. */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = Math.floor(seconds % 60)
  return `${minutes}:${rest.toString().padStart(2, '0')}`
}

/** Formats a timestamp as a short local date and time, e.g. "Oct 7, 2026, 3:04 PM". */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
