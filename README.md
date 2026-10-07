# Pirate Battle

A top-down pirate naval combat game built with React, TypeScript, and PixiJS. Sink enemy ships
for points before time runs out, climb the ranking, and don't let your HP reach zero.

Live demo: https://pirate-battle-theta.vercel.app

## Setup

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. No environment variables or `.env` file are required — the
backend is fully mocked in the browser (see [Scenarios](#scenarios) below).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Starts the Vite dev server |
| `npm run build` | Type-checks and builds the production bundle into `dist/` |
| `npm run preview` | Serves the production build locally (`dist/`) |
| `npm run lint` | Runs ESLint |
| `npm run typecheck` | Runs the TypeScript compiler in no-emit mode (app + tests) |
| `npm run test:e2e` | Runs the Playwright end-to-end suite (builds and serves the production build itself) |

After `npm run test:e2e`, open the HTML report with `npx playwright show-report`. A copy of the
latest report is committed under [`reports/playwright-report/`](./reports/playwright-report/).

### Visual regression baselines

The screenshot baselines in `tests/snapshots.spec.ts-snapshots/` were generated on **Windows**
(the files are suffixed `-win32`). On another OS (macOS/Linux) font and anti-aliasing differences
make those baselines not match, so run this once on the first run there:

```bash
npx playwright test --update-snapshots
```

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | `W` `A` `S` `D` or arrow keys | Virtual analog joystick (left): the ship turns toward the stick angle and its speed follows how far the stick is pushed |
| Front cannon | `Space` | Center fire button |
| Left / right broadside | `Q` / `E` | Left / right fire buttons |
| Pause / Resume | `Escape` | Pause automatically on tab switch; Resume button on screen |

On phones, the in-game fullscreen button (top right) hides the browser address bar. It is hidden
where the Fullscreen API isn't available (e.g. iPhone Safari), and the layout uses `100dvh` so the
arena and HUD always fit the visible area.

The game also pauses automatically when the tab loses focus or is hidden, and on mobile when the
device is held in portrait — a prompt asks the player to rotate to landscape. In every case,
resuming is always an explicit action the player takes (clicking Resume), never automatic.

## Config

Game balance lives in two places:

- **`src/config/gameConfig.ts`** — static values not exposed to the player (ship speed, weapon
  damage/cooldowns, projectile speed/range, enemy stats, scoring). Change these to rebalance the
  game.
- **Options screen** (in-game, persisted to `localStorage`) — the two values the player can
  tune per match: **game session time** (60–180s) and **enemy spawn interval** (1–10s), plus
  their captain name and a sound on/off toggle. Each match snapshots these settings at start, so
  changing Options never affects a match already in progress, and the Ranking only ever compares
  matches played under the *same* configuration.

## Scenarios

The backend is mocked with [MSW](https://mswjs.io/) and persisted to `localStorage`, so Ranking
and Match History work the same in `npm run dev` and in the deployed production build. Append
`?scenario=<name>` to the URL to exercise specific network conditions:

| Scenario | Behavior |
|---|---|
| `slow` | Responses resolve after a 2.5s delay (loading states) |
| `empty` | Responses return no data (empty states) |
| `error` | Responses return HTTP 500 (error state + Retry) |
| `timeout` | Responses never arrive before the client's 8s timeout |
| `timeoutAfterSave` | A match submission is saved server-side immediately, but the *response* is delayed past the client timeout — proves a retry of the same match doesn't create a duplicate |
| `reorder` | GET requests resolve after a random delay, so concurrent requests can resolve out of order — proves a stale response never overwrites newer data |
| `reset` | Clears the mock database back to its seed data |

Example: `http://localhost:5173/?scenario=error`.

### Test hook

Append `?seed=<number>` to put the game in a deterministic test mode: the RNG becomes
reproducible and simulation time is driven by `window.__game`, a small API Playwright uses to
advance exact fixed steps without waiting on real time (see `src/game/testHook.ts` and
`tests/helpers.ts`). Not intended for normal play.

## Assets and licenses

See [ASSETS.md](./ASSETS.md) for the sources and licenses of the art, sounds and third-party
libraries.

## Documentation

See [ARCHITECTURE.md](./ARCHITECTURE.md) for how the project is put together, including known
limitations and suggested next steps.
