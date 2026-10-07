// Measures frame time (real-time mode), entity counts and heap growth against a running
// production build.
//
//   npm run build && npm run preview -- --port 4174 --strictPort
//   BASE_URL=http://localhost:4174 node scripts/measure-performance.mjs
//
// Output: reports/performance-raw.json (summary + every frame time) and
// reports/performance-summary.json (summary only).
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4174'
const TARGET_SECONDS = 180
const MATCH_DURATION_SECONDS = 180
const SPAWN_INTERVAL_SECONDS = 4.5
const MAX_MATCHES = 12
const ENTITY_MATCHES = 3
const MEMORY_CYCLES = 5
const VIEWPORT = { width: 1280, height: 720 }

const browser = await chromium.launch({ channel: 'chromium', args: ['--enable-precise-memory-info'] })
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 })
const page = await context.newPage()
const cdp = await context.newCDPSession(page)
await cdp.send('Performance.enable')

async function setOptions(duration, spawn) {
  await page.getByRole('button', { name: 'Options' }).click()
  await page.locator('input[type=number]').first().fill(String(duration))
  await page.locator('input[type=number]').nth(1).fill(String(spawn))
  await page.getByRole('button', { name: 'Save' }).click()
}

async function heapMB() {
  await cdp.send('HeapProfiler.collectGarbage')
  const { metrics } = await cdp.send('Performance.getMetrics')
  return metrics.find((m) => m.name === 'JSHeapUsedSize').value / 1024 / 1024
}

// Bot: every cannon firing, sailing forward and weaving, so enemies stay engaged. It is not
// invincible, so matches end when the ship sinks.
async function botWhile(isRunning) {
  for (const key of ['Space', 'KeyQ', 'KeyE', 'KeyW']) await page.keyboard.down(key)
  let turning = false
  while (isRunning()) {
    await page.waitForTimeout(1200)
    if (!isRunning()) break
    if (turning) await page.keyboard.up('KeyD')
    else await page.keyboard.down('KeyD')
    turning = !turning
  }
  for (const key of ['Space', 'KeyQ', 'KeyE', 'KeyW', 'KeyD']) await page.keyboard.up(key)
}

const percentile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]

// ---- 1. Frame time, real mode ---------------------------------------------------------------
// No ?seed: the game runs on its own real-time fixed-step loop exactly as a player sees it.
// Frame times come from a requestAnimationFrame logger running beside the game.
await page.goto(`${BASE_URL}/`)
await setOptions(MATCH_DURATION_SECONDS, SPAWN_INTERVAL_SECONDS)

const gpu = await page.evaluate(() => {
  const gl = document.createElement('canvas').getContext('webgl')
  const ext = gl?.getExtension('WEBGL_debug_renderer_info')
  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unavailable'
})

const frameTimesMs = []
const realMatches = []

for (let m = 0; m < MAX_MATCHES && frameTimesMs.length < TARGET_SECONDS * 60; m += 1) {
  if (m > 0) {
    await page.getByRole('button', { name: 'Play Again' }).click()
  } else {
    await page.getByRole('tab', { name: 'Play', exact: true }).click()
    await page.getByRole('button', { name: 'Play' }).click()
  }
  await page.locator('canvas').waitFor()
  await page.waitForTimeout(1500) // textures loaded, first frames settled

  let running = true
  const bot = botWhile(() => running)
  const frames = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const samples = []
        let last = performance.now()
        let n = 0
        function tick(now) {
          samples.push(now - last)
          last = now
          n += 1
          const over =
            n % 15 === 0 && [...document.querySelectorAll('button')].some((b) => b.textContent === 'Play Again')
          if (over) resolve(samples)
          else requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }),
  )
  running = false
  await bot

  const usable = frames.slice(10) // drop warm-up
  frameTimesMs.push(...usable)
  const seconds = usable.reduce((a, b) => a + b, 0) / 1000
  realMatches.push({ index: m + 1, realSeconds: Number(seconds.toFixed(1)), frames: usable.length })
  console.log(`real-time match ${m + 1}: ${seconds.toFixed(1)}s, ${usable.length} frames`)
}

const sorted = [...frameTimesMs].sort((a, b) => a - b)
const mean = frameTimesMs.reduce((a, b) => a + b, 0) / frameTimesMs.length
const frameStats = {
  frames: frameTimesMs.length,
  totalSeconds: Number((frameTimesMs.reduce((a, b) => a + b, 0) / 1000).toFixed(1)),
  meanFrameMs: Number(mean.toFixed(2)),
  averageFps: Number((1000 / mean).toFixed(1)),
  p50FrameMs: Number(percentile(sorted, 50).toFixed(2)),
  p95FrameMs: Number(percentile(sorted, 95).toFixed(2)),
  p99FrameMs: Number(percentile(sorted, 99).toFixed(2)),
  maxFrameMs: Number(sorted[sorted.length - 1].toFixed(2)),
}

// ---- 2. Entity counts, test mode ------------------------------------------------------------
// window.__game only exists with ?seed=. Its step() advances the frozen test clock, which makes
// the page's own loop run one extra step, so the hook is called every other frame to keep the
// simulation at roughly one step per rendered frame.
await page.goto(`${BASE_URL}/?seed=7001`)
await setOptions(MATCH_DURATION_SECONDS, SPAWN_INTERVAL_SECONDS)
const entityMatches = []
let maxEnemies = 0
let maxProjectiles = 0
let maxEntities = 0

for (let m = 0; m < ENTITY_MATCHES; m += 1) {
  if (m > 0) {
    await page.getByRole('button', { name: 'Play Again' }).click()
  } else {
    await page.getByRole('tab', { name: 'Play', exact: true }).click()
    await page.getByRole('button', { name: 'Play' }).click()
  }
  await page.waitForFunction(() => typeof window.__game?.step === 'function')

  let running = true
  const bot = botWhile(() => running)
  const result = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let maxE = 0
        let maxP = 0
        let maxTotal = 0
        let n = 0
        function tick() {
          n += 1
          if (n % 2 === 0) window.__game.step(1)
          const state = window.__game.getSimState()
          maxE = Math.max(maxE, state.enemies.length)
          maxP = Math.max(maxP, state.projectiles.length)
          maxTotal = Math.max(maxTotal, 1 + state.enemies.length + state.projectiles.length)
          if (state.status === 'ended') {
            resolve({ maxE, maxP, maxTotal, elapsed: state.elapsedSeconds, frames: n })
            return
          }
          requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }),
  )
  running = false
  await bot
  maxEnemies = Math.max(maxEnemies, result.maxE)
  maxProjectiles = Math.max(maxProjectiles, result.maxP)
  maxEntities = Math.max(maxEntities, result.maxTotal)
  entityMatches.push({
    index: m + 1,
    simulatedSeconds: Number(result.elapsed.toFixed(1)),
    renderedFrames: result.frames,
    maxEnemies: result.maxE,
    maxProjectiles: result.maxP,
  })
  console.log(`entity match ${m + 1}: ${result.elapsed.toFixed(1)}s simulated over ${result.frames} frames`)
  await page.getByRole('button', { name: 'Play Again' }).waitFor({ timeout: 10_000 })
}

// ---- 3. Memory over 5 play cycles -----------------------------------------------------------
// Fresh page so the heap baseline is not inflated by the measurements above. Matches are run to
// completion with bulk steps (test mode); the Pixi mount/teardown path is the same.
await page.goto(`${BASE_URL}/?seed=7002`)
await setOptions(60, SPAWN_INTERVAL_SECONDS)
await page.getByRole('tab', { name: 'Play', exact: true }).click()
await page.getByRole('button', { name: 'Play' }).click()
await page.waitForFunction(() => typeof window.__game?.step === 'function')
await page.waitForTimeout(1500)
const heapReadings = [{ cycle: 0, label: 'first match started', heapMB: Number((await heapMB()).toFixed(2)) }]

for (let cycle = 1; cycle <= MEMORY_CYCLES; cycle += 1) {
  await page.evaluate(() => {
    let state = window.__game.getSimState()
    for (let i = 0; i < 200 && state.status !== 'ended'; i += 1) state = window.__game.step(300)
  })
  await page.getByRole('button', { name: 'Play Again' }).click()
  await page.waitForFunction(() => typeof window.__game?.step === 'function' && window.__game.getSimState().elapsedSeconds < 1)
  await page.waitForTimeout(1500)
  heapReadings.push({
    cycle,
    label: 'new match started after Play Again',
    heapMB: Number((await heapMB()).toFixed(2)),
  })
}

const cpu = os.cpus()
const summary = {
  measuredAt: new Date().toISOString(),
  build: 'production (vite build + vite preview)',
  browser: { name: 'Chromium', version: browser.version(), mode: 'headless (channel: chromium)', gpuRenderer: gpu },
  viewport: `${VIEWPORT.width}x${VIEWPORT.height} @ DPR 1`,
  hardware: {
    cpu: cpu[0].model.trim(),
    logicalCpus: cpu.length,
    totalMemoryGB: Number((os.totalmem() / 1024 ** 3).toFixed(1)),
    os: `${os.type()} ${os.release()}`,
  },
  config: {
    durationSeconds: MATCH_DURATION_SECONDS,
    spawnIntervalSeconds: SPAWN_INTERVAL_SECONDS,
    note: 'Default spawn interval, 180s session. The bot is not invincible, so matches end when the ship sinks; matches are repeated until at least 180s of gameplay frames are collected.',
  },
  combat: { ...frameStats, matches: realMatches },
  entities: { maxEnemies, maxProjectiles, maxEntitiesIncludingPlayer: maxEntities, matches: entityMatches },
  memory: {
    cycles: MEMORY_CYCLES,
    readings: heapReadings,
    deltaMB: Number((heapReadings.at(-1).heapMB - heapReadings[0].heapMB).toFixed(2)),
  },
}

mkdirSync('reports', { recursive: true })
writeFileSync(
  'reports/performance-raw.json',
  JSON.stringify({ summary, frameTimesMs: frameTimesMs.map((v) => Number(v.toFixed(2))) }),
)
writeFileSync('reports/performance-summary.json', JSON.stringify(summary, null, 2))
console.log(JSON.stringify(summary, null, 2))
await browser.close()
