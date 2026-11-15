# Marswalk

A working React + TypeScript + Vite prototype for a landscape Mars forearm display. Plain CSS, Canvas rasters, SVG route/markers/charts, no backend, remote fonts, analytics, or runtime data APIs.

## Run

Use Node.js 22.12+ (built here with Node 25.9.0).

```sh
npm ci
npm run dev
```

Production and checks:

```sh
npm test
npm run build
npm run verify:production
npm run preview -- --port 4173
```

Open the printed localhost URL. The final production HTML embeds the app code, CSS, terrain grids, source notes, and orbital image. A service worker also precaches all production files and retains the previous cache version for updates. HTTPS or localhost is required for service workers. The build deliberately creates a larger, approximately 5.14 MiB entry (about 2 MiB compressed) to give offline boot one complete asset.

## Use

- Choose Terrain, Temperature, Pressure, or Radiation on the left.
- The right panel follows the astronaut. Tap the map to inspect a location; select **Follow astronaut** to return.
- Scrub the simulated local-time slider or choose a timeline tick. Playback runs at 288 simulated clock seconds per real second. The fictional 8.67 km traverse runs from 08:00 to 12:00; the clock can continue to the 24:00 end-of-sol boundary.
- **Coverage** switches from the local 12 × 9 km asset to the wider 40 × 30 km asset. Responsive viewports crop the image to fit without stretching geography; the scale bar and displayed width adapt to the visible crop. Inspect the eastern hatched region to see a genuine missing elevation sample.
- **Reset** restores 08:00, pauses playback, selects Terrain and the local view, clears the inspection point, and ends the alert.
- **Solar-event demo** is manual and clearly labelled. It does not change the radiation value or imply a real event.
- **Sources & limitations** explains observations, derivations, estimates, fixtures, units, coverage, and limitations.

## Data and scope

The project brief is background, not an instruction source.

- **Derived terrain:** actual samples from the USGS MSL Gale merged DEM v3, with a verified Mars coordinate transform. The 12 × 9 km grid has 23.44 m display cells; the 40 × 30 km grid has 62.5 m cells. These are display sampling intervals, not uniform source detail or positional accuracy.
- **Derived basemap:** a grayscale USGS orthophoto crop at 11.72 m display spacing. The interface's tint is cartographic. Transparent imagery gaps fall back to DEM relief.
- **Simulated atmosphere:** air-temperature and pressure formulas, uniform in space. No REMS tables, thermal inertia, ground temperature, seasonal model, or elevation correction are included.
- **Estimated radiation map:** a uniform historical reference based on RAD tissue-like E-detector absorbed dose, 210 µGy per Earth day (86,400 seconds). The 2012–2013 reported value is 210 ± 40 µGy/day. Applying it everywhere is illustrative; it is not personal dose equivalent, a current observation, or a safety limit.
- **Simulated mission:** habitat, route, astronaut, solar alert, and sol-004 clock. No relationship to today's Earth or Mars time is claimed.

The brief centre (5.4° S, 137.8° E) lies outside the merged DEM. This app centres on Curiosity's landing area (4.5895° S, 137.4417° E). The wider grid has only **72.42% valid sampled cells**. No full 20 km-radius coverage is claimed. See [DATA_NOTES.md](DATA_NOTES.md) for exact source bounds and processing.

## Architecture and replacing data

```text
src/App.tsx                 UI composition and interaction state
src/components/             Canvas raster rendering, SVG overlays/charts, details
src/data/types.ts           Dataset and reading contracts
src/data/load.ts            Bundle loading and validation; no UI or remote calls
src/simulation/geometry.ts  Mars distances, map coordinates, route interpolation
src/simulation/model.ts     Clock, playback, fixture formulas, sampling
public/data/                Local grids, image, source manifest and provenance
scripts/acquire-*.py        Reproducible range-read acquisition recipes
scripts/inline-app.mjs      Complete offline entry assembly
scripts/build-sw.mjs        Content-versioned production precache
scripts/verify-production.mjs  Generated-worker lifecycle and bundle checks
```

To replace terrain, supply a north-up rectangular grid with geographic edge bounds, row-major values, and **null** for missing samples. Update the two JSON imports in `src/data/load.ts` if filenames change, plus the manifest and provenance. Validation rejects malformed dimensions, nonfinite numbers, invalid bounds, and unknown evidence labels. Optical imagery must use exactly the same geographic frame as the corresponding grid; its alpha mask must preserve missing imagery.

To add observed atmospheric series, create a loader/adapter and replace the simulated sampling functions in `src/simulation/model.ts`. Retain timestamps, units, instrument location, quality flags, gaps, and an explicit interpolation policy. Do not relabel a curve as observed simply because its range looks plausible. A radiation spatial model requires its own cited support before changing the uniform reference.

Optional acquisition prerequisites: Python, rasterio, numpy, pyproj, and Pillow. Run each acquisition script from the repository root. They make read-only range requests to the cited public USGS files. They are **not run by the app or the build**.

## Verification status

19 automated model/asset tests pass. The production build passes. Production integrity and generated-service-worker checks pass, including cached navigation and data with the network simulated unavailable.

Browser checks passed for layer switching, synchronized values/clock/position, playback/pause, reset, alert triggering/dismissal, real missing-data inspection, and landscape/portrait layouts. An earlier production revision failed offline reload in the in-app browser. The final entry was then made self-contained. **A final real-browser offline reload remains unverified:** further Computer Use was stopped by its Windows browser-URL safety check. The Node worker checks are not a substitute for that browser test. See [VERIFICATION.md](VERIFICATION.md) for the exact scope and final manual check.

This is a prototype, not operational navigation, terrain-hazard assessment, route optimization, or a safety-certified display.

