# Architecture

## Overview

```
src/
  config/        gameConfig.ts (static balancing values), assetManifest.ts (every asset the game
                 loads), storageKeys.ts (all localStorage keys)
  lib/           small shared helpers (math)
  game/
    sim/         pure TypeScript: fixed-step loop, entities, collisions, AI, spawning, RNG
    render/      PixiJS: reads sim state and draws it (textures, pools, health bars, effects)
    input/       keyboard + touch buttons + virtual joystick -> "intents" (only active during gameplay)
    bridge/      external store -> React via useSyncExternalStore
    audio/       one-shot sound playback
  ui/            React screens: Menu, Options, Game (HUD/pause/touch), Result, Ranking, History
  api/           typed contracts, Axios client, TanStack Query hooks, pending-submission queue
  mocks/         MSW handlers, fixtures, scenario selector, localStorage-backed mock database
tests/           Playwright (core flows, extra behavior/mobile joystick specs, asset publishing checks
                 in assets.spec.ts, visual snapshots)
scripts/         measure-performance.mjs — reproduces the numbers in reports/PERFORMANCE.md
reports/         committed Playwright HTML report and performance measurements (with raw data)
assets/          the full challenge asset pack; the build publishes only what the manifest lists
```

## Published assets

`assets/` keeps the whole challenge pack, but the production build copies only the files listed in
`src/config/assetManifest.ts` (textures, sounds, `favicon.svg` and MSW's `mockServiceWorker.js`).
The same manifest is what the game code loads from, and `vite.config.ts` reads it to decide what to
emit, so a file the game uses can't be left out of the build. The dev server still serves
everything in `assets/`.

## React ↔ PixiJS split

The simulation is plain, framework-free TypeScript: `stepSimulation(state, intent, dt)` is a
pure function that takes the previous `SimState` and returns the next one plus a list of
discrete `GameEvent`s (shot fired, enemy destroyed, player hit) that happened during that step.
Nothing about React or Pixi leaks into `src/game/sim/`.

`PixiStage.tsx` owns the only `Application` instance and the render loop. On every rendered
frame it reads the latest `SimState` from a small external store (`GameBridge`, in
`src/game/bridge/gameBridge.ts`) and syncs Pixi sprites to match — positions, rotations, health
bar fills, and damage-stage textures. Render never *writes* simulation state, and the simulation
never touches Pixi.

React needs some of that same state for the HUD (HP, score, time, pause, match status), but
re-rendering React on every simulation tick (60/s) would be wasteful. `GameBridge` diffs an
incoming `SimState` against a small derived `HudSnapshot` and only notifies subscribers when one
of those fields actually changes; `useGameSnapshot` wraps that in `useSyncExternalStore`. The
same snapshot feeds the `aria-live` region, so it also only announces on real changes, never per
frame.

## Fixed-step simulation loop

`src/game/sim/fixedStepLoop.ts` is a classic accumulator: it measures real elapsed time via an
injectable `Clock`, and calls `onFixedStep` with a constant `dt` (1/60s) as many times as needed
to catch up, capped per real frame to avoid a "spiral of death" on a slow frame. The clock is
injected rather than read globally so the simulation can be driven deterministically in tests
(see `src/game/sim/testClock.ts` and the `window.__game` test hook) without waiting on real time.

Pausing (manual, on blur/hidden, or portrait-on-mobile) simply calls `loop.stop()` /
`loop.start()` — no time or queued input accumulates while paused, and resuming is always an
explicit player action. Every input source has a `reset()`; `PixiStage` calls them on pause, on
window `blur` and when the tab becomes hidden, because the matching keyup/pointerup may never reach
the page and a stuck key would otherwise keep the ship moving or firing after Resume.

The pause dialog (`PauseOverlay`) is modal: Resume is focused when it opens, Tab/Shift+Tab cycle
inside it, and Escape (handled by `GameScreen`'s global listener) resumes.

## Input layer and the virtual joystick

Every input source (keyboard, touch fire buttons, virtual joystick) reduces to the same discrete
`PlayerIntent` (`thrust`, `turn`, three fire flags); `combineIntents` merges them and the
simulation only ever sees that. The joystick (`input/joystickInput.ts`) is analog on the input
side only: it turns toward the stick angle using the ship's current heading (stopping within one
step of turning to avoid oscillation), and converts the stick's distance from center into an
average speed by duty-cycling `thrust` across fixed steps. `stepSimulation` is unchanged.

## Collisions

All collision is circle-vs-circle (ship/projectile/island radii), resolved by pushing the moving
circle back outside the overlap along the center-to-center vector. This is cheap and good enough
for an arcade game, but it is not pixel-perfect and does not model momentum on impact.

Enemies don't just walk straight at the player and stall against an island: `steerAroundIslands`
checks whether an island lies ahead on the enemy's current heading and, if so, deflects the
desired direction to the nearer tangent of that island's circle, so they visibly slide around
obstacles instead of pushing into them. The Shooter enemy additionally keeps a configured minimum
distance from the player — inside it, it flees (through the same steering/collision pipeline);
between that and its attack range, it holds position and fires; beyond attack range, it closes
in.

## Resource lifecycle

Textures are loaded once via `PIXI.Assets` with a progress callback shown as a loading bar. Pixi's
default load strategy is `'skip'` (a failed file resolves as `undefined`), so `loadGameTextures`
passes `strategy: 'throw'` and also validates the result; any failure — a texture, or the renderer
itself failing to initialize because WebGL is unavailable — shows an error with a Retry button
that boots again. Entity sprites are destroyed with their children when they leave the arena. The `Application`, canvas, and all its sprites/listeners are
created and torn down inside a single `useEffect` in `PixiStage`, guarded by a `cancelled` flag
checked after every `await` — this makes it safe under React's Strict Mode double-invoke in dev
(mount → cleanup → mount never leaks a second canvas or a second set of event listeners, so a
Strict Mode remount always leaves exactly one `<canvas>`).

## Persistence

Everything is `localStorage`-backed (no real server):

| Key | What |
|---|---|
| `pirate-battle:options` | Player name, sound, match duration, spawn interval |
| `pirate-battle:last-result` | The most recent match's result; shown by the menu's "Last result" button and the Result screen, also after a refresh |
| `pirate-battle:mock-matches` | The mocked backend's "database" of match records |
| `pirate-battle:my-match-ids` | Which of those records this browser actually played (History is scoped to these; Ranking shows everyone) |
| `pirate-battle:pending-submissions` | Match records not yet confirmed saved, retried on load and on `online` |

## API / mock backend

Axios + MSW + TanStack Query, entirely client-side:

- **Idempotent writes.** Each match gets a client-generated `matchId` the moment it ends. The
  record is pushed into the pending-submission queue *before* the network call, so a refresh
  mid-request never loses it; `POST /api/matches` upserts by `matchId`, so retrying a submission
  that already landed server-side (e.g. after a client-side timeout) returns the existing record
  instead of creating a duplicate.
- **Registration is a mutation.** `useSubmitMatch` (`useMutation`) queues the record, sends it with
  Axios and, in `onSuccess`, removes it from the queue and invalidates the Ranking and History
  queries. Page-load and `online` retries of older queued records use the same upsert endpoint.
- **Queue status on the Result screen.** `submissionQueue` notifies subscribers when the queue
  changes, so the Result badge is derived from "is this match still queued?": it starts as Pending
  after a refresh if the record was never confirmed, and turns Saved when a background retry
  succeeds. Only the latest submitted match controls the badge.
- **Mock startup failures.** If MSW can't start (e.g. service workers blocked), the app still
  renders; Ranking and History then show their error state with Retry.
- **Cross-tab updates.** A successful submission invalidates the local tab's Ranking/History
  queries directly; other tabs pick it up via the native `storage` event, which only fires in
  tabs that didn't make the write.
- **Stale responses can't win.** TanStack Query passes an `AbortSignal` through to Axios, so a
  superseded request (e.g. flipping pages quickly) is cancelled rather than resolving later and
  overwriting newer data — verified under `?scenario=reorder`, which adds random delay
  specifically to make that race likely to happen if it weren't handled.
- **Ranking fairness.** Entries are filtered to the exact `{durationSeconds, spawnIntervalSeconds}`
  the viewer is currently configured for (each match snapshots its own config at start), and tied
  scores break deterministically (survival time, then submission time, then `matchId`).

## Mock scenarios

`src/mocks/scenario.ts` reads `?scenario=` per request and the handlers in `handlers.ts` apply
it per endpoint (`submit`, `ranking`, `history`): delays (`slow`, `timeout`, `reorder`), HTTP
failures (`error` 500, `clientError` 400, and 503 for the single-endpoint `submitError`,
`rankingError`, `historyError`), connection failures (`networkError` uses `HttpResponse.error()`),
`empty` results and `timeoutAfterSave`. `reorder` cycles through a fixed list of latencies instead
of using randomness, so out-of-order responses are reproducible. `reset` runs once at startup
(`applyResetScenario`, called from `main.tsx` before rendering) and clears the mock database, the
list of own matches, the pending queue and the last result. A 4xx on submission is treated like any
other failure and stays queued; a real backend would likely drop records it rejects as invalid.
The README lists every scenario.

## Accessibility notes

The HUD's live region (`Hud.tsx`) announces only real changes — a higher score, pause/resume, the
end of the match and the 60/30/10-second marks — never the per-second clock. The hull bar is a
`progressbar` for assistive technology. The History table shows each match's date and time and the
configuration it was played under.

## Performance

Measured against the production build (`npm run build && npm run preview`) with Chromium 153
(headless) on an AMD Ryzen 5 5500 (6 cores / 12 threads), 16 GB RAM, Radeon RX 470, Windows 11,
1280×720 viewport at DPR 1. The full method, per-cycle numbers and raw frame times are in
[`reports/PERFORMANCE.md`](./reports/PERFORMANCE.md) and `reports/performance-raw.json`;
`scripts/measure-performance.mjs` reproduces them.

- **Frame time under combat** (default 4.5 s spawn interval, 180 s sessions, a bot firing all
  cannons and weaving; 190 s / 14,265 frames collected): **75 FPS average** (13.34 ms/frame),
  **p95 13.4 ms**, p99 13.5 ms, worst frame 26.7 ms. The display refreshes at 75 Hz, so the game
  is vsync-bound here: the numbers show it never drops below the refresh rate on this machine,
  not how much headroom it has.
- **Entity counts**: at most **3 enemies, 17 projectiles (21 entities including the player)**
  alive at once across three matches; the configured enemy cap (`spawn.maxAliveEnemies`) is 4.
- **Memory over 5 play cycles** (Play → match end → Play Again, ×5, forcing GC before each
  reading): JS heap went from **7.59 MB to 8.43 MB (+0.84 MB)**, with per-cycle growth shrinking
  (+0.35, +0.17, +0.10, +0.11, +0.11 MB). That suggests the Pixi teardown in `PixiStage`'s cleanup
  isn't leaking sprites/textures in any major way, though this was only checked over 5 cycles,
  not a long-running session.
- **Bundle size**: the main JS chunk is ~1.03 MB (~345 KB gzipped) — PixiJS, React, MSW, and
  TanStack Query all ship in one chunk today (see Limitations).

## Limitations and next steps

- **No code-splitting.** Menu/Options/Ranking don't need PixiJS at all, but it's in the same
  chunk as everything else. Lazy-loading `GameScreen` (and therefore Pixi) behind `React.lazy`
  would cut the initial bundle significantly.
- **No real backend.** Ranking and Match History are entirely mocked and local to one browser;
  nothing is shared across devices or survives clearing site data. The API layer (typed
  contracts, idempotent submission, pagination) is written to be a realistic shape for swapping
  in a real backend later.
- **Simple AI and collision.** Enemies have three behaviors (seek, hold, flee) and circle-based
  collision/steering — no pathfinding, no formation or difficulty-scaling behavior over a match.
- **Spawn and steering tunables live in `gameConfig`** (`spawn.chaserProbability`,
  `edgeMarginPx`, `maxPlacementAttempts`, `enemies.contactDamageCooldownSeconds`,
  `enemies.islandAvoidLookaheadPx`), so rebalancing doesn't touch the simulation code.
- **Visual damage has 3 discrete stages**, not continuous deformation, and reuses the sheet's
  existing hull art rather than custom damage sprites.
- **Touch controls always render**, even on desktop (they're unobtrusive and double as a quick
  way to test touch input with a mouse, but a production app would likely hide them behind a
  touch-capability check).
- **No account system.** A captain is just a typed display name with no uniqueness check —
  acceptable for a local leaderboard, not for a real multi-user one.
- **Accessibility was spot-checked**, not validated with a full screen-reader pass: labeled
  controls, an `aria-live` HUD region, and accessible form errors exist, but a dedicated a11y
  audit would likely find more to improve.
- **Performance was measured on one machine over a short session.** A longer soak test and a
  profile on actual low-end mobile hardware would give more confidence for that audience
  specifically.
