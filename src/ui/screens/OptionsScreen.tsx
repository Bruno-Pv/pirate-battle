import { useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import {
  MATCH_DURATION_MAX_SECONDS,
  MATCH_DURATION_MIN_SECONDS,
  MAX_NAME_LENGTH,
  SPAWN_INTERVAL_MAX_SECONDS,
  SPAWN_INTERVAL_MIN_SECONDS,
  sanitizePlayerName,
  type GameOptions,
} from '../options/optionsStore'

interface OptionsScreenProps {
  options: GameOptions
  onSave: (options: GameOptions) => void
  onBack: () => void
}

interface FieldErrors {
  playerName?: string
  matchDurationSeconds?: string
  spawnIntervalSeconds?: string
}

export function OptionsScreen({ options, onSave, onBack }: OptionsScreenProps) {
  const [playerName, setPlayerName] = useState(options.playerName)
  const [soundEnabled, setSoundEnabled] = useState(options.soundEnabled)
  const [matchDurationSeconds, setMatchDurationSeconds] = useState(String(options.matchDurationSeconds))
  const [spawnIntervalSeconds, setSpawnIntervalSeconds] = useState(String(options.spawnIntervalSeconds))
  const [errors, setErrors] = useState<FieldErrors>({})

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const nextErrors: FieldErrors = {}
    const trimmedName = playerName.trim()
    if (trimmedName.length === 0) {
      nextErrors.playerName = 'Enter a name before saving.'
    }

    const duration = Number(matchDurationSeconds)
    if (!Number.isFinite(duration) || duration < MATCH_DURATION_MIN_SECONDS || duration > MATCH_DURATION_MAX_SECONDS) {
      nextErrors.matchDurationSeconds = `Enter a number between ${MATCH_DURATION_MIN_SECONDS} and ${MATCH_DURATION_MAX_SECONDS} seconds.`
    }

    const spawnInterval = Number(spawnIntervalSeconds)
    if (
      !Number.isFinite(spawnInterval) ||
      spawnInterval < SPAWN_INTERVAL_MIN_SECONDS ||
      spawnInterval > SPAWN_INTERVAL_MAX_SECONDS
    ) {
      nextErrors.spawnIntervalSeconds = `Enter a number between ${SPAWN_INTERVAL_MIN_SECONDS} and ${SPAWN_INTERVAL_MAX_SECONDS} seconds.`
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    onSave({
      playerName: sanitizePlayerName(trimmedName),
      soundEnabled,
      matchDurationSeconds: duration,
      spawnIntervalSeconds: spawnInterval,
    })
    onBack()
  }

  return (
    <div style={styles.screen}>
      <h1 style={styles.title}>Options</h1>
      <form style={styles.form} onSubmit={handleSubmit} noValidate>
        <Field
          label="Captain name"
          error={errors.playerName}
          input={
            <input
              type="text"
              value={playerName}
              maxLength={MAX_NAME_LENGTH}
              onChange={(event) => setPlayerName(event.target.value)}
              style={styles.input}
              aria-invalid={errors.playerName !== undefined}
              aria-describedby={errors.playerName ? 'playerName-error' : undefined}
            />
          }
          errorId="playerName-error"
        />

        <Field
          label={`Game session time (${MATCH_DURATION_MIN_SECONDS}–${MATCH_DURATION_MAX_SECONDS} seconds)`}
          error={errors.matchDurationSeconds}
          input={
            <input
              type="number"
              inputMode="numeric"
              min={MATCH_DURATION_MIN_SECONDS}
              max={MATCH_DURATION_MAX_SECONDS}
              value={matchDurationSeconds}
              onChange={(event) => setMatchDurationSeconds(event.target.value)}
              style={styles.input}
              aria-invalid={errors.matchDurationSeconds !== undefined}
              aria-describedby={errors.matchDurationSeconds ? 'matchDurationSeconds-error' : undefined}
            />
          }
          errorId="matchDurationSeconds-error"
        />

        <Field
          label={`Enemy spawn time (${SPAWN_INTERVAL_MIN_SECONDS}–${SPAWN_INTERVAL_MAX_SECONDS} seconds)`}
          error={errors.spawnIntervalSeconds}
          input={
            <input
              type="number"
              inputMode="numeric"
              min={SPAWN_INTERVAL_MIN_SECONDS}
              max={SPAWN_INTERVAL_MAX_SECONDS}
              value={spawnIntervalSeconds}
              onChange={(event) => setSpawnIntervalSeconds(event.target.value)}
              style={styles.input}
              aria-invalid={errors.spawnIntervalSeconds !== undefined}
              aria-describedby={errors.spawnIntervalSeconds ? 'spawnIntervalSeconds-error' : undefined}
            />
          }
          errorId="spawnIntervalSeconds-error"
        />

        <label style={styles.checkboxField}>
          <input type="checkbox" checked={soundEnabled} onChange={(event) => setSoundEnabled(event.target.checked)} />
          <span>Sound effects</span>
        </label>

        <div style={styles.actions}>
          <button type="submit" style={styles.primaryButton}>
            Save
          </button>
          <button type="button" style={styles.secondaryButton} onClick={onBack}>
            Back
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  input,
  error,
  errorId,
}: {
  label: string
  input: ReactNode
  error?: string
  errorId: string
}) {
  return (
    <label style={styles.field}>
      <span>{label}</span>
      {input}
      {error && (
        <p id={errorId} role="alert" style={styles.error}>
          {error}
        </p>
      )}
    </label>
  )
}

const styles = {
  screen: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    fontFamily: 'system-ui, sans-serif',
    color: '#e8edf2',
    overflowY: 'auto',
    padding: '24px 0',
  },
  title: {
    margin: 0,
    fontSize: 32,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    width: 280,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 14,
    color: '#cdd8e3',
  },
  input: {
    padding: '8px 10px',
    fontSize: 14,
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.3)',
    background: '#13233a',
    color: '#e8edf2',
  },
  checkboxField: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: '#cdd8e3',
  },
  error: {
    margin: 0,
    fontSize: 13,
    color: '#f87171',
  },
  actions: {
    display: 'flex',
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    padding: '10px 0',
    fontSize: 15,
    color: '#0b1a2b',
    background: '#3ba2ff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  secondaryButton: {
    flex: 1,
    padding: '10px 0',
    fontSize: 15,
    color: '#e8edf2',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 6,
    cursor: 'pointer',
  },
} as const satisfies Record<string, CSSProperties>
