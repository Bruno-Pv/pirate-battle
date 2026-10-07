# Performance measurements

Measured on 2026-10-07 with `scripts/measure-performance.mjs` against the production build
(`npm run build && npm run preview`). Raw data: [`performance-raw.json`](./performance-raw.json)
(summary plus every frame time in ms) and [`performance-summary.json`](./performance-summary.json).

Reproduce:

```bash
npm run build && npm run preview -- --port 4174 --strictPort
BASE_URL=http://localhost:4174 node scripts/measure-performance.mjs
```

## Environment

| Item | Value |
|---|---|
| Build under test | Production (`vite build` + `vite preview`) |
| Browser | Chromium 153.0.8010.12, headless (Playwright `channel: 'chromium'`) |
| Hardware | AMD Ryzen 5 5500 (6 cores / 12 threads), 15.9 GB RAM, Radeon RX 470 (ANGLE / Direct3D 11) |
| OS | Windows 11 (10.0.26200) |
| Display | 75 Hz refresh rate |
| Resolution | 1280×720 viewport, device pixel ratio 1 |

## Match configuration

Spawn interval 4.5 s (default), session length 180 s (the default is 120 s; raised to get a full
three minutes). A bot holds every cannon, sails forward and toggles a right turn every 1.2 s. It is
not invincible, so each match ended when the ship sank (45–91 s); matches were repeated until at
least 180 s of real gameplay frames were collected.

## Results

### Frame time, real-time mode (no `?seed`, the game's own loop)

3 matches, 14,265 frames, 190.3 s, first 10 frames of each match dropped.

| Metric | Result |
|---|---|
| Average FPS | **75.0** (mean 13.34 ms/frame) |
| Median frame time | 13.30 ms |
| p95 frame time | **13.40 ms** |
| p99 frame time | 13.50 ms |
| Worst frame | 26.7 ms (a single missed refresh) |

The display runs at 75 Hz, so rendering is vsync-bound at 13.33 ms. These numbers show the game
holds the display's refresh rate under combat; they do not measure how much headroom is left.

### Entity counts (test mode, 3 matches)

| Metric | Result |
|---|---|
| Max enemies alive | 3 (configured cap: 4) |
| Max projectiles alive | 17 |
| Max entities including the player | 21 |

Counts come from `window.__game`, which only exists with `?seed=`. Its `step()` also advances
the frozen test clock so the page's loop takes an extra step; the script therefore calls it every
other frame to keep the simulation at about one step per rendered frame.

### Memory over 5 play cycles

Cycle = Play → match end → Play Again. Garbage collection is forced before each reading (CDP
`HeapProfiler.collectGarbage`, `JSHeapUsedSize`). 60 s matches were run to completion with bulk
test-mode steps; the Pixi mount and teardown path is the same as in normal play.

| Cycle | JS heap (MB) |
|---|---|
| 0 (first match started) | 7.59 |
| 1 | 7.94 |
| 2 | 8.11 |
| 3 | 8.21 |
| 4 | 8.32 |
| 5 | 8.43 |

Total growth +0.84 MB, with per-cycle growth shrinking (+0.35, +0.17, +0.10, +0.11, +0.11 MB).

## Limitations

- **Vsync-bound.** At 75 Hz the frame time cannot go below 13.3 ms, so headroom is unknown. A
  run with vsync disabled (or a 4x CPU throttle) would be needed to see it.
- **Desktop hardware only.** A Ryzen 5 5500 with a discrete GPU is far from a low-end phone.
  Touch input, the joystick and Android/iOS GPUs were not measured.
- **Synthetic player.** The bot is simple and dies in 45–91 s, so late-match behavior, with
  long-lived enemies, was not exercised. Entity maxima come from only 3 short matches.
- **Headless Chromium**, one short session, no long soak test. Memory was checked over only 5
  cycles; the shrinking growth is encouraging but not proof against a slow leak.
- **Different measurement path per metric.** Frame time uses the real loop; entity counts and
  memory use the `?seed=` test hook, which is not available in normal play.
- No code-splitting: PixiJS ships in the same chunk as the menus (main chunk ~1.03 MB, ~345 KB
  gzipped), which hurts initial load rather than frame time.
