import { Application, Container, type Sprite } from 'pixi.js'
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { playSound } from '../audio/sounds'
import type { GameBridge } from '../bridge/gameBridge'
import { gameConfig } from '../../config/gameConfig'
import { combineIntents } from '../input/combineIntents'
import { createJoystickIntentSource } from '../input/joystickInput'
import { createKeyboardIntentSource } from '../input/keyboardInput'
import { createTouchIntentSource } from '../input/touchInput'
import { systemClock } from '../sim/clock'
import { enemyConfig } from '../sim/enemyConfig'
import { createFixedStepLoop } from '../sim/fixedStepLoop'
import { stepSimulation } from '../sim/simulation'
import { createTestClock } from '../sim/testClock'
import type { Enemy, GameEvent, Projectile } from '../sim/types'
import type { GameTestHook } from '../testHook'
import { isTestMode } from '../testMode'
import { createArenaLayer } from './arena'
import { createEffectTextures } from './effectTextures'
import { createEffectsLayer } from './effectsLayer'
import { syncEntitySprites } from './entityLayer'
import { createProjectileSprite, createProjectileTexture, syncProjectileSprite } from './projectileSprite'
import { createShipSprite, syncShipSprite, type ShipSprite } from './shipSprite'
import { createHullTextureSet } from './shipTexture'
import { loadGameTextures } from './textures'

const PLAYER_SPRITE = { scale: 1, healthBarOffsetY: -70 } as const
const ENEMY_SPRITE = { scale: 0.8, healthBarOffsetY: -56 } as const

type LoadState =
  | { status: 'loading'; progress: number }
  | { status: 'error'; message: string }
  | { status: 'ready' }

interface PixiStageProps {
  bridge: GameBridge
  touchContainerRef: RefObject<HTMLElement | null>
}

export function PixiStage({ bridge, touchContainerRef }: PixiStageProps) {
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
      // Pixi can still report progress for the other file after one has failed; that late
      // event must not replace the error screen with a loading bar that never finishes.
      let loadFailed = false
      try {
        textures = await loadGameTextures((progress) => {
          if (!cancelled && !loadFailed) setLoadState({ status: 'loading', progress })
        })
      } catch (error) {
        loadFailed = true
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
      try {
        await nextApp.init({
          resizeTo: host,
          backgroundColor: 0x0b1a2b,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        })
      } catch (error) {
        try {
          nextApp.destroy(true, { children: true, texture: false })
        } catch {
          // A renderer that never initialized may not be destroyable; nothing else to release.
        }
        if (!cancelled) {
          const detail = error instanceof Error ? ` (${error.message})` : ''
          setLoadState({
            status: 'error',
            message: `Could not start the graphics renderer. WebGL may be unavailable${detail}`,
          })
        }
        return
      }
      if (cancelled) {
        nextApp.destroy(true, { children: true, texture: false })
        return
      }
      app = nextApp

      host.appendChild(nextApp.canvas)

      const world = new Container({ label: 'world' })
      world.addChild(createArenaLayer(textures.tiles))

      const enemyLayer = new Container({ label: 'enemies' })
      const projectileLayer = new Container({ label: 'projectiles' })
      world.addChild(enemyLayer)
      world.addChild(projectileLayer)

      const playerHull = createHullTextureSet(textures.ships, 'white')
      const chaserHull = createHullTextureSet(textures.ships, 'black')
      const shooterHull = createHullTextureSet(textures.ships, 'blue')
      const projectileTexture = createProjectileTexture(textures.ships)
      const effectTextures = createEffectTextures(textures.ships)
      const effectsLayer = createEffectsLayer()

      const playerSprite = createShipSprite({
        ...PLAYER_SPRITE,
        label: 'player',
        hullStages: playerHull,
        damageFireTexture: effectTextures.damageFire,
      })
      world.addChild(playerSprite)
      world.addChild(effectsLayer.container)

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

      const keyboard = createKeyboardIntentSource()
      keyboard.attach()
      const touch = createTouchIntentSource()
      const touchContainer = touchContainerRef.current
      if (touchContainer) touch.attach(touchContainer)
      const joystick = createJoystickIntentSource(() => bridge.getSimState().player.heading)
      if (touchContainer) joystick.attach(touchContainer)

      let pendingEvents: GameEvent[] = []

      function runFixedStep(dt: number) {
        const intent = combineIntents(combineIntents(keyboard.getIntent(), joystick.getIntent()), touch.getIntent())
        const result = stepSimulation(bridge.getSimState(), intent, dt)
        bridge.setSimState(result.state)
        if (result.events.length > 0) pendingEvents = pendingEvents.concat(result.events)
        return result.state
      }

      const testClock = isTestMode() ? createTestClock() : null

      const loop = createFixedStepLoop({
        stepSeconds: 1 / 60,
        clock: testClock ?? systemClock,
        onFixedStep: runFixedStep,
      })

      if (testClock) {
        const hook: GameTestHook = {
          getSimState: () => bridge.getSimState(),
          getSnapshot: () => bridge.getSnapshot(),
          step(frames = 1) {
            let state = bridge.getSimState()
            for (let i = 0; i < frames; i += 1) {
              if (bridge.getPaused()) break
              state = runFixedStep(1 / 60)
              testClock.advance(1000 / 60)
            }
            return state
          },
        }
        window.__game = hook
      }

      // Held keys/buttons must not survive a pause or a lost focus: the matching keyup/pointerup
      // may never reach the page, which would leave the ship moving or firing after Resume.
      function resetInputs() {
        keyboard.reset()
        touch.reset()
        joystick.reset()
      }
      function onVisibilityChange() {
        if (document.hidden) resetInputs()
      }
      window.addEventListener('blur', resetInputs)
      document.addEventListener('visibilitychange', onVisibilityChange)

      function applyPaused(paused: boolean) {
        if (paused) {
          loop.stop()
          resetInputs()
        } else {
          loop.start()
        }
      }
      applyPaused(bridge.getPaused())
      const unsubscribePause = bridge.subscribe(() => applyPaused(bridge.getPaused()))

      const enemySprites = new Map<number, ShipSprite>()
      const projectileSprites = new Map<number, Sprite>()

      function handleEvent(event: GameEvent) {
        switch (event.type) {
          case 'shotFired':
            effectsLayer.spawn({
              texture: effectTextures.muzzleFlash,
              x: event.position.x,
              y: event.position.y,
              lifeMs: 120,
              startScale: 1,
              endScale: 1.8,
            })
            playSound(event.faction === 'player' ? 'cannonFirePlayer' : 'cannonFireEnemy', 0.5)
            break
          case 'enemyDestroyed':
            effectsLayer.spawn({
              texture: effectTextures.explosion,
              x: event.position.x,
              y: event.position.y,
              lifeMs: 400,
              startScale: 0.6,
              endScale: 1.3,
            })
            playSound('explosion', 0.7)
            // Only kills by the player's weapons score; chasers that ram the player don't.
            if (event.cause === 'weapon') playSound('scorePoint', 0.6)
            break
          case 'playerHit':
            playSound('hit', 0.6)
            break
        }
      }

      function syncFrame() {
        const state = bridge.getSimState()
        syncShipSprite(playerSprite, state.player, state.player.hp / gameConfig.player.maxHp)
        syncEntitySprites<Enemy, ShipSprite>(
          enemyLayer,
          state.enemies,
          enemySprites,
          (enemy) =>
            createShipSprite({
              ...ENEMY_SPRITE,
              label: `enemy-${enemy.kind}`,
              hullStages: enemy.kind === 'chaser' ? chaserHull : shooterHull,
              damageFireTexture: effectTextures.damageFire,
            }),
          (sprite, enemy) => syncShipSprite(sprite, enemy, enemy.hp / enemyConfig(enemy.kind).maxHp),
        )
        syncEntitySprites<Projectile, Sprite>(
          projectileLayer,
          state.projectiles,
          projectileSprites,
          (projectile) => createProjectileSprite(projectileTexture, projectile.faction),
          syncProjectileSprite,
        )

        if (pendingEvents.length > 0) {
          for (const event of pendingEvents) handleEvent(event)
          pendingEvents = []
        }
        effectsLayer.update(nextApp.ticker.deltaMS)
      }
      nextApp.ticker.add(syncFrame)

      cleanupGameplay = () => {
        loop.stop()
        unsubscribePause()
        window.removeEventListener('blur', resetInputs)
        document.removeEventListener('visibilitychange', onVisibilityChange)
        keyboard.detach()
        touch.detach()
        joystick.detach()
        nextApp.ticker.remove(syncFrame)
        if (testClock) delete window.__game
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
  }, [retryToken, bridge, touchContainerRef])

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
    // Above the full-screen touch layer that follows the stage, or the Retry button can't be clicked.
    zIndex: 5,
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
