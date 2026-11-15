> Current update: see [UPDATE-1.1.md](UPDATE-1.1.md) for the white theme, regional map, and current verification limits. Earlier verification below describes version 1.0.

# Marswalk data record

Acquisition date: 15 November 2026. Acquisition pass: approximately 07:25–07:34 UTC, under the user's 20-minute limit. No multi-gigabyte source file was downloaded in full.

## Terrain

Source: [USGS Mars MSL Gale Merged DEM 1m, version 3](https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_dem_1m), Timothy Parker and Fred J. Calef III, 2016. Credit NASA/JPL-Caltech, USGS Astrogeology Science Center, University of Arizona; CTX and HRSC inputs as described by the catalogue.

GeoTIFF: `MSL_Gale_DEM_Mosaic_1m_v3.tif`, 32-bit float, 32,980 × 57,440 cells, 1 m grid, NoData = −32767. Projection and raster transform were read from the actual file, not inferred from a thumbnail.

Verified source bounds, planetocentric latitude and east-positive longitude:

| Edge | Degrees |
|---|---:|
| West | 137.124166506125 |
| East | 137.680559054345 |
| South | −5.098652339316 |
| North | −4.129604796266 |

Source projection: Mars equirectangular, central meridian 0°, standard parallel 0°, spherical radius 3,396,190 m. Heights are tied to MOLA. The UI's geographic distance calculations separately use a 3,389.5 km mean-radius Mars sphere; they never use Earth geometry.

The catalogue's source-control accuracy and changing source resolution preclude any claim of 1 m positional accuracy. HiRISE is preferred where available, then CTX, HRSC, and MOLA. Nearest-neighbour sampling does not compute a cell average and can miss sub-cell features. No slopes or hazard classes are claimed.

| Bundled grid | Cells | Display interval | Valid sampled cells |
|---|---:|---:|---:|
| Local, 12 × 9 km | 512 × 384 | 23.4375 m | 196,608 / 196,608 (100%) |
| Coverage, 40 × 30 km | 640 × 480 | 62.5 m | 222,466 / 307,200 (72.4173%) |

Every output value is the nearest source pixel at that output cell centre. Source NoData and coordinates outside the source raster become JSON null. No interpolation fills gaps. These coverage percentages describe the bundled sampled grids; they are not a pixel-by-pixel inventory of the full-resolution source, and neither is a circular 20 km-radius coverage claim.

Local grid: 137.339950327–137.543449673° E; −4.665567564 to −4.513432436° N. Coverage grid: 137.102534424–137.780865576° E; −4.843058546 to −4.335941454° N. The display crops to fit its viewport while preserving the map's geographic proportions.

Detailed machine-readable record: `public/data/terrain-provenance.json`. Reproduction: `scripts/acquire-terrain.py`.

## Optical raster

Source: [USGS MSL Gale Merged Orthophoto Mosaic 25cm v3](https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_orthophoto_mosaic_25cm), Fred J. Calef III and Timothy Parker, 2016. Credit NASA/JPL-Caltech, USGS, University of Arizona; CTX NASA/JPL/MSSS; HRSC ESA/DLR/FU Berlin.

Actual grayscale raster metadata: 180,000 × 280,000 pixels, 0.25 m grid, NoData = 0, Mars equirectangular with radius 3,396,190 m. Verified bounds: 137.094718987–137.853896206° E; −5.249524890 to −4.068582550° N.

The bundled 1,024 × 768 PNG uses exactly the local DEM frame and nearest-neighbour sampling at 11.71875 m display spacing. It has 775,123 valid sampled image cells out of 786,432 (98.56199%). Missing imagery is transparent; the terrain canvas shows DEM relief underneath. Colour tint and hillshade are visualizations, not observed surface colour. Coverage mode uses DEM relief without this image.

The newer HiRISE colour mosaic was inspected but not used: its actual footprint is narrower than this local frame. No imagery was assigned guessed bounds.

Detailed record: `public/data/imagery-provenance.json`. Reproduction: `scripts/acquire-imagery.py`.

## Atmosphere fixtures

No [REMS archive](https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems.html) samples are bundled. For simulated hour h on a 0–24 local clock:

```text
Air temperature (°C) = −47 + 30 cos(2π(h−14)/24)
Pressure (Pa) = 735 + 24 cos(2π(h−8)/24) + 9 cos(4π(h−9)/24)
```

These are author-created demonstration formulas, not fitted NASA observations. Both are spatially uniform. There is no altitude, season, dust, or thermal-inertia dependence.

## Radiation reference

[Hassler et al., Science (2014), DOI 10.1126/science.1244797](https://doi.org/10.1126/science.1244797), Table 1, gives a 2012–2013 tissue-like E-detector GCR absorbed dose rate of 0.21 ± 0.04 mGy/day. [NASA's radiation description](https://science.nasa.gov/resource/radiation-measurements-on-mars/) also reports approximately 210 µGy/day.

The app uses 210 µGy per **Earth day (86,400 s)** as a uniform illustrative reference. The historical instrument result is observed context; its map-wide application is labelled estimated. This is absorbed dose rate in tissue-like detector material, not absorbed dose accumulated by the astronaut, not dose equivalent in sieverts, and not a current radiation map. The demo alert does not alter this reference. No shielding or pressure adjustment is applied.

## Mission geometry and clock

The [NASA landing reconstruction](https://ntrs.nasa.gov/citations/20130010129) supports the chosen display centre, 4.5895° S, 137.4417° E. The brief's 5.4° S, 137.8° E centre is outside the DEM's southern and eastern bounds.

Habitat, astronaut, and the 8.67 km route are invented demonstration fixtures. Route interpolation is by cumulative spherical Mars distance. The clock starts at sol 004, 08:00; the traverse spans 08:00–12:00. One sol is represented as 88,775.244 Earth seconds divided into 24 local hours. At the 24:00 endpoint playback stops. This is simulated mission time, not a live Mars clock, UTC conversion, or an astronomical season calculation.

No NASA crew observations, actual habitat, validated hazard zones, operational route suitability, or safety thresholds are asserted.
