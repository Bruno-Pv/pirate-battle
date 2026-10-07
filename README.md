# Pirate Battle

A top-down pirate naval combat game built with React, TypeScript, and PixiJS. Sink enemy ships
for points before time runs out, climb the ranking, and don't let your HP reach zero.

Live demo: https://pirate-battle-theta.vercel.app

## Setup

Requirements: Node.js 20.19+ (or 22.12+, as required by Vite 8) and npm.

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

While paused, a dialog takes focus (Resume is focused first, Tab cycles inside it, Escape resumes).
Pausing, losing window focus and hiding the tab also release every held key, touch button and the
joystick, so nothing keeps firing or moving after Resume.

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
| `empty` | Ranking and History return no data (empty states) |
| `error` | Every endpoint answers HTTP 500 (error state + Retry) |
| `clientError` | Every endpoint answers HTTP 400 |
| `networkError` | Every request fails at the connection level (no HTTP response) |
| `submitError` | Only the match submission fails (HTTP 503); Ranking and History work, so a finished match stays Pending |
| `rankingError` | Only the Ranking query fails (HTTP 503) |
| `historyError` | Only the Match History query fails (HTTP 503) |
| `timeout` | Responses never arrive before the client's 8s timeout |
| `timeoutAfterSave` | A match submission is saved server-side immediately, but the *response* is delayed past the client timeout — proves a retry of the same match doesn't create a duplicate |
| `reorder` | GET requests resolve after a fixed, repeating pattern of delays (2.2s, 0.3s, 1.5s, 0.1s, 1.8s, 0.6s), so concurrent requests finish out of order — deterministic, so it reproduces — and a stale response never overwrites newer data |
| `reset` | On every page load with this parameter, clears the mock database back to its seed data and forgets this browser's own matches, pending submissions and last result (Options are kept). After that it behaves like normal |

A failed submission is not lost: it stays in a pending queue (see ARCHITECTURE.md) and is sent
again on the next page load, when the browser goes back online, or from the **Retry** button on
the Result screen. To reproduce recovery, finish a match under `?scenario=submitError` (it shows
**Pending**), then reload without the parameter: the match is registered exactly once. The
Result screen's badge follows the queue, so it switches to **Saved** by itself.

Example: `http://localhost:5173/?scenario=error`.

The most recent finished match is also kept in `localStorage`; the Play tab of the main menu shows
it as **Last result** (also after a refresh) and opens the Result screen with its current
Saved/Pending status.

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
