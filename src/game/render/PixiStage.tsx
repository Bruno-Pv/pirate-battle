import { Application, Container } from 'pixi.js'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { gameConfig } from '../../config/gameConfig'
import { createSimStore } from '../bridge/simStore'
import { createKeyboardIntentSource } from '../input/keyboardInput'
import { systemClock } from '../sim/clock'
import { createFixedStepLoop } from '../sim/fixedStepLoop'
import { createInitialState, stepSimulation } from '../sim/simulation'
import { createArenaLayer } from './arena'
import { createPlayerSprite, syncPlayerSprite } from './playerSprite'
import { createPlayerShipTexture } from './shipTexture'
import { loadGameTextures } from './textures'

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
    let cleanupGameplay: (() => void) | null = null

    async function boot(host: HTMLDivElement) {
      setLoadState({ status: 'loading', progress: 0 })

      let textures
      try {
        textures = await loadGameTextures((progress) => {
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
      world.addChild(createArenaLayer(textures.tiles))

      const playerSprite = createPlayerSprite(createPlayerShipTexture(textures.ships))
      world.addChild(playerSprite)

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

      const simStore = createSimStore(createInitialState())
      const intentSource = createKeyboardIntentSource()
      intentSource.attach()

      const loop = createFixedStepLoop({
        stepSeconds: 1 / 60,
        clock: systemClock,
        onFixedStep: (dt) => {
          simStore.setState(stepSimulation(simStore.getState(), intentSource.getIntent(), dt))
        },
      })
      loop.start()

      function syncFrame() {
        syncPlayerSprite(playerSprite, simStore.getState().player)
      }
      nextApp.ticker.add(syncFrame)

      cleanupGameplay = () => {
        loop.stop()
        intentSource.detach()
        nextApp.ticker.remove(syncFrame)
      }

      setLoadState({ status: 'ready' })
    }

    void boot(host)

    return () => {
      cancelled = true
      cleanupGameplay?.()
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
