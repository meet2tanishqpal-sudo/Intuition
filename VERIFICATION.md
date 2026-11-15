> Current update: see [UPDATE-1.1.md](UPDATE-1.1.md) for the white theme, regional map, and current verification limits. Earlier verification below describes version 1.0.

# Verification record

## Passed automated checks

`npm test`: **19 tests passed** across two files. Coverage includes Mars-radius distances, route interpolation and clamps, coordinate round trips, initial/reset state, pause/reset tick races, route timing, clock/value synchronization, static terrain, spatially uniform radiation, null/bounds handling, schema validation, actual data masks and counts, source bounds, landing-area inclusion, optical alignment, source declarations, and complete module loading.

`npm run build`: **passed**, including strict TypeScript checking, Vite compilation, complete entry embedding, and content-versioned service-worker generation.

`npm run verify:production`: **production checks passed**. The actual generated service worker is evaluated in a Node VM with a cache implementation and network stub. Installation caches all assets; activation claims clients; switching the network stub off returns the exact self-contained HTML, both terrain grids, and the complete local image. External origins are not intercepted. The entry contains inline code/styles/data/imagery and no external script or stylesheet dependency. The inline JavaScript parses successfully.

Dependency audit after patching the test runner: **0 reported vulnerabilities** at installation time.

## Passed browser checks

Completed in the in-app browser against the production Vite preview before the final entry-embedding change:

| Check | Observed result |
|---|---|
| All four layers | Selected state, quantity, units, legend, provenance, raster mode update |
| Slider at 10:00 | Clock 10:00:00; traverse 4.33/8.67 km; astronaut moved |
| Temperature at 10:00 | −32 °C and chart marker agree |
| Pressure at 10:00 | 764 Pa and chart marker agree |
| Radiation | 210 µGy/day remains fixed through time/position changes and alert |
| Play/Pause | Clock and position advance; Pause returns to Play |
| Reset | 08:00, Terrain, local view, habitat position, and paused state restored |
| Solar demo | Manual alert visible; dismiss clears it; no value mutation |
| Missing data | Coverage view inspection at about 137.7343° E, 4.6090° S shows a dash and explicit No data |
| Responsive | 1440 × 900 desktop, 1024 × 600 landscape, 390 × 844 portrait fallback; no horizontal overflow; clock controls visible in landscape |

The compact layout keeps the detail panel scrollable. Geographic proportions are preserved by cropping the raster and SVG to the same view, not stretching them.

## Remaining browser verification

An earlier external-entry build failed to restart in the in-app browser after its local server was stopped: HTML returned but dependent app resources did not start. The final production entry now embeds its code, styles, data, image, and brand asset, removing those separate boot requests. The generated-worker and entry-integrity tests pass for this final architecture.

**The final real-browser offline reload has not been reverified.** A desktop Chrome cross-check could not proceed because Computer Use stopped when its Windows browser-URL safety check could not establish the current URL. No browser-control workaround was used. Code-level worker simulation must not be described as a successful browser offline test.

Final browser acceptance procedure:

1. Serve the final `dist` over localhost or HTTPS and load it in Chrome/Edge.
2. Wait for **OFFLINE READY**, which requires an active controlling service worker.
3. Switch that tab's DevTools Network setting to Offline, or stop the local static server.
4. Reload. Confirm the app, local raster, coverage view, all layer readings, timeline, and demo alert work.
5. Restore normal network settings afterward. Open `dist/index.html` again after a subsequent deployment to check the update path as well.

No hardware forearm display, glove use, field safety, geodetic ground-truth accuracy, real REMS/RAD time-series ingestion, or full 20 km-radius source coverage has been validated.

