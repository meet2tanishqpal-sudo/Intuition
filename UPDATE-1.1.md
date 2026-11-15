# Marswalk 1.1 — white theme and regional atlas

This update adds a white instrument interface, larger touch controls, a compact landscape layout, draggable map, pinch/scroll and button zoom, keyboard pan/zoom, astronaut recentering, tap inspection, and reset of the map camera. The map uses Canvas imagery and SVG markers/routes. No runtime external data calls or fonts.

NASA Mars Trek Viking MDIM 2.1 context imagery is bundled locally: 16 verified WMTS tiles (level 7, rows 66–69, columns 224–227), bounds 135–140.625° E, −8.4375 to −2.8125° N. It provides approximately 330 km of regional context, at roughly 325 m display sampling. This is not a global Google Maps service. Beyond the downloaded region the map is grey. Zooming does not create additional source detail.

USGS high-resolution orthophoto appears near the landing area. The 40 × 30 km DEM sample supplies elevation where present; its rectangle is dashed and missing samples are hatched. Regional imagery does not fill missing elevation values. There is no claim of complete 20 km-radius elevation coverage.

Resource selection: Mars Trek and USGS supply the displayed georeferenced imagery/terrain. NASA’s proposed Curiosity route is a visual reference, not the fictional EVA route. Worldview is an Earth viewer; Perseverance imagery comes from Jezero and is not used as Gale map data. All links and acquisition metadata are included in the source dialog and public/data/context-provenance.json.

Temperature and pressure remain labelled simulated fixtures. Radiation remains a spatially uniform historical absorbed-dose reference, not personal exposure. Time, habitat, astronaut and route remain simulated.

Validation: TypeScript and Vite production build passed. All 22 data/model tests passed, including regional bounds, Mars distance and no elevation inference from imagery. The production cache harness passed including exact offline HTML return, terrain, orthophoto, and the new regional mosaic. The updated UI could not be visually or interactively verified in the browser: localhost timed out and file navigation was rejected by browser policy. Pinch, drag, compact layout and real browser offline reload therefore still need device/browser acceptance testing. No physical arm device installation or hardware performance validation was performed.

Run locally: npm ci; npm run dev. Production: npm run build; npm run preview. Open outputs/Marswalk.html directly for the self-contained preview, or serve dist over localhost/HTTPS for service-worker installation and offline reload.
