import { Application, Container } from 'pixi.js'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { gameConfig } from '../../config/gameConfig'
import { createArenaLayer } from './arena'
import { loadArenaTexture } from './textures'

type LoadState =
  | { status: 'loading'; progress: number }
  | { status: 'error'; message: string }
  | { status: 'ready' }

export function PixiStage() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading', progress: 0 })
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let cancelled = false
    let app: Application | null = null

    async function boot(host: HTMLDivElement) {
      setLoadState({ status: 'loading', progress: 0 })

      let tilesTexture
      try {
        tilesTexture = await loadArenaTexture((progress) => {
          if (!cancelled) setLoadState({ status: 'loading', progress })
        })
      } catch (error) {
        if (!cancelled) {
          setLoadState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to load assets',
          })
        }
        return
      }
      if (cancelled) return

      const nextApp = new Application()
      await nextApp.init({
        resizeTo: host,
        backgroundColor: 0x0b1a2b,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })
      if (cancelled) {
        nextApp.destroy(true, { children: true, texture: false })
        return
      }
      app = nextApp

      host.appendChild(nextApp.canvas)

      const world = new Container({ label: 'world' })
      world.addChild(createArenaLayer(tilesTexture))
      nextApp.stage.addChild(world)

      function layout() {
        const screenW = nextApp.screen.width
        const screenH = nextApp.screen.height
        const scale = Math.min(screenW / gameConfig.arena.width, screenH / gameConfig.arena.height)
        world.scale.set(scale)
        world.position.set(
          (screenW - gameConfig.arena.width * scale) / 2,
          (screenH - gameConfig.arena.height * scale) / 2,
        )
      }
      layout()
      nextApp.renderer.on('resize', layout)

      setLoadState({ status: 'ready' })
    }

    void boot(host)

    return () => {
      cancelled = true
      if (app) {
        app.destroy(true, { children: true, texture: false })
        app = null
      }
    }
  }, [retryToken])

  return (
    <div ref={hostRef} style={styles.host}>
      {loadState.status === 'loading' && <LoadingOverlay progress={loadState.progress} />}
      {loadState.status === 'error' && (
        <ErrorOverlay message={loadState.message} onRetry={() => setRetryToken((token) => token + 1)} />
      )}
    </div>
  )
}

function LoadingOverlay({ progress }: { progress: number }) {
  const percent = Math.round(progress * 100)
  return (
    <div style={styles.overlay}>
      <p style={styles.overlayText}>Loading assets… {percent}%</p>
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${percent}%` }} />
      </div>
    </div>
  )
}

function ErrorOverlay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={styles.overlay}>
      <p style={styles.overlayText}>Failed to load assets</p>
      <p style={styles.overlayDetail}>{message}</p>
      <button type="button" onClick={onRetry} style={styles.retryButton}>
        Retry
      </button>
    </div>
  )
}

const styles = {
  host: {
    position: 'absolute',
    inset: 0,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    background: '#0b1a2b',
    color: '#e8edf2',
  },
  overlayText: {
    margin: 0,
    fontSize: 18,
  },
  overlayDetail: {
    margin: 0,
    fontSize: 14,
    color: '#9fb0c0',
  },
  progressTrack: {
    width: 240,
    height: 8,
    borderRadius: 4,
    background: '#1c3147',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#3ba2ff',
  },
  retryButton: {
    marginTop: 8,
    padding: '8px 20px',
    fontSize: 14,
    color: '#0b1a2b',
    background: '#3ba2ff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
} as const satisfies Record<string, CSSProperties>
