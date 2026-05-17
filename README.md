# World Clock App

[![build](https://github.com/wfreitag/world-clock-app/actions/workflows/build.yml/badge.svg)](https://github.com/wfreitag/world-clock-app/actions/workflows/build.yml)

A minimal desktop clock app built with **Tauri 2 + React + TypeScript**. Toggles between a retro LCD digital view and an analog clock face. Shows up to four clocks at once for comparing time across regions, with city/timezone lookup powered by an offline geo-cities database.

## Screenshots

The UI follows a "vehicle dashboard" aesthetic — amber LCD digits on a dark instrument panel background, inspired by 80s/90s bedside alarm clocks.

- **Digital view**: Seven-segment LCD font (DSEG7) with ghost segments behind the active time
- **Analog view**: SVG clock face with amber hour/minute hands and a chrome second hand
- **Multi-clock layout**: 1 clock fills the window, 2 sit side-by-side, 3–4 use a 2×2 grid. Typography and the analog face scale with the cell.

## Architecture

```
world-clock-app/
├── src/                          # React frontend (Vite)
│   ├── App.tsx                   # Main component: view toggle, live tick, multi-clock state, search
│   ├── App.css                   # All styles (vehicle dashboard palette, adaptive grid)
│   ├── AnalogClock.tsx           # SVG analog clock (fills its container via viewBox)
│   ├── timezones.ts              # Search wrapper around city-timezones (~7,300 cities)
│   ├── main.tsx                  # React entry point
│   └── assets/fonts/
│       ├── DSEG7Classic-Bold.woff2   # Seven-segment LCD font (bundled)
│       └── DSEG-LICENSE.txt          # SIL Open Font License 1.1
├── src-tauri/                    # Tauri Rust backend
│   ├── tauri.conf.json           # Window config: 520x460, resizable
│   ├── src/main.rs               # Rust entry point (default, no custom commands)
│   └── Cargo.toml
├── package.json
└── README.md
```

### How it works

- The frontend is a standard React SPA rendered inside the OS native webview (WebKit on macOS, WebView2 on Windows, WebKitGTK on Linux).
- A single `setInterval` ticks every second and updates a shared `now: Date`. Every clock cell formats this date through `Intl.DateTimeFormat` with its own IANA timezone (or no `timeZone` option for the local clock).
- The clock list is React state (`CityEntry[]`, max 4). The first entry is always the user's local zone and cannot be removed. Searching adds a clock; the × button removes it.
- The grid uses a `--cell-scale` CSS variable per layout (`grid-1` through `grid-4`) combined with `clamp(min, k·vmin, max)` formulas, so digits and the analog face scale smoothly with the window.
- City lookup uses the [`city-timezones`](https://www.npmjs.com/package/city-timezones) package: ~7,300 cities globally, each mapped to an IANA timezone. Results are ranked prefix > substring, ties broken by population.
- The Rust backend is the default Tauri scaffold — no custom commands are exposed. All logic lives in the frontend.

## Design tokens

| Role             | Value     |
|------------------|-----------|
| Background       | `#0A0A0A` |
| Panel surface    | `#111111` |
| Panel border     | `#1A1A1A` |
| Primary (amber)  | `#FF8C00` |
| Ghost segments   | `#2A1800` |
| Secondary (chrome) | `#C0C0C0` |
| Muted text       | `#555555` |
| Input placeholder | `#444444` |

## Prerequisites

- **Node.js** >= 18
- **Rust** (install via [rustup](https://rustup.rs/))
- macOS: Xcode Command Line Tools
- Windows: WebView2, Visual Studio Build Tools
- Linux: `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`

## Development

```bash
npm install
npm run tauri dev
```

The first run compiles the Rust backend (~1-2 min). Subsequent runs are fast due to Cargo caching.

## Build

```bash
npm run tauri build
```

Outputs:
- **macOS**: `.app` bundle + `.dmg` in `src-tauri/target/release/bundle/`
- **Windows**: `.msi` + `.exe` installer
- **Linux**: `.deb` + `.AppImage`

> Note: The app is not code-signed. On macOS, right-click → Open (or System Settings → Privacy & Security → Open Anyway) to bypass Gatekeeper on first launch.

## Continuous integration

Tauri does not cross-compile — each platform's bundle has to be built on that OS. To produce builds for all three desktop targets without local VMs, this repo includes a GitHub Actions workflow at [`.github/workflows/build.yml`](.github/workflows/build.yml) that runs on every push to `main`, on pull requests, and on manual dispatch.

The workflow uses a matrix of `macos-latest`, `windows-latest`, and `ubuntu-22.04` runners. Each job:

1. Checks out the repo
2. Installs the platform's webview dependencies (Linux only — macOS and Windows ship them)
3. Restores Cargo and npm caches
4. Runs `tauri build` via [`tauri-apps/tauri-action`](https://github.com/tauri-apps/tauri-action)
5. Uploads the resulting bundle as a downloadable artifact (`world-clock-macos`, `world-clock-windows`, `world-clock-linux`)

Artifacts are retained for 14 days and can be downloaded from the run summary page on GitHub Actions. They are unsigned, same caveat as local builds.

## Releases

For tagged builds that should persist beyond 14 days, push a semver tag and the [`release.yml`](.github/workflows/release.yml) workflow will build all three platforms and attach the binaries to a draft GitHub Release.

```bash
# Cut a release locally
git tag v0.1.0
git push origin v0.1.0
```

This kicks off the `release` workflow, which:

1. Builds on macOS, Windows, and Linux runners in parallel
2. Creates (or updates) a **draft** release named `World Clock v0.1.0`
3. Attaches the `.dmg`/`.app.tar.gz`, `.msi`/`.exe`, and `.deb`/`.AppImage` to that draft

Once all jobs finish, open the release on GitHub, edit notes if needed, and click **Publish release**. You can also trigger the workflow manually from the Actions tab via *Run workflow* and pass an existing tag — useful for re-running a failed release without re-tagging.

## Key files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main component — manages view state (Digital/Analog), the clock list, the live tick, and the search/add flow |
| `src/AnalogClock.tsx` | Pure SVG component — fills its container; computes hour/minute/second angles from time props |
| `src/timezones.ts` | Search wrapper around `city-timezones`; exports `searchCities()` and `localEntry()` |
| `src/App.css` | All styles — `@font-face` for DSEG7, adaptive grid, responsive LCD/analog sizing, search dropdown |
| `src-tauri/tauri.conf.json` | Tauri window config — 520×460px default, resizable, title "World Clock" |

## Fonts

- **DSEG7 Classic Bold** — seven-segment LCD display font by [keshikan](https://github.com/keshikan/DSEG)
- Licensed under SIL Open Font License 1.1 (free for commercial and non-commercial use)
- In DSEG7, `~` renders all segments on (used for ghost digits), `!` renders all segments off

## License

MIT
