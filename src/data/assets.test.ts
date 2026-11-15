import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadMission, validateTerrain } from './load';
import { sampleTerrain } from '../simulation/model';
import { distanceKm } from '../simulation/geometry';
const read=(file:string)=>JSON.parse(readFileSync(new URL(`../../public/data/${file}`,import.meta.url),'utf8'));
const local=validateTerrain(read('terrain-local.json')),wide=validateTerrain(read('terrain-coverage.json'));
const provenance=read('terrain-provenance.json');
describe('bundled USGS assets',()=>{
  it('has exactly the documented sampled coverage, retaining NoData',()=>{expect(local.values.filter(v=>v!==null)).toHaveLength(196608);expect(wide.values.filter(v=>v!==null)).toHaveLength(222466);expect(wide.values.filter(v=>v===null)).toHaveLength(84734);});
  it('covers the verified landing area and excludes the brief centre',()=>{expect(sampleTerrain(local,{lat:-4.5895,lon:137.4417})).not.toBeNull();const b=provenance.source.sourceBounds;expect(-5.4<b.south).toBe(true);expect(137.8>b.east).toBe(true);});
  it('does not extrapolate beyond the verified eastern source edge',()=>{expect(sampleTerrain(wide,{lat:-4.59,lon:137.74})).toBeNull();expect(sampleTerrain(wide,{lat:-4.59,lon:137.42})).not.toBeNull();});
  it('uses a 12 km local frame with explicit processing provenance',()=>{expect(distanceKm({lat:-4.5895,lon:local.bounds.west},{lat:-4.5895,lon:local.bounds.east})).toBeCloseTo(12,3);expect(local.evidence).toBe('derived');expect(provenance.source.sourceNodata).toBe(-32767);expect(provenance.source.sourceCRS).toContain('3396190');});
  it('aligns the optical crop to exactly the same geographic frame',()=>{const image=read('imagery-provenance.json');expect(image.bounds).toEqual(local.bounds);expect(image.validSampledCells).toBe(775123);expect(image.totalSampledCells).toBe(786432);expect(image.sourceNoData).toBe(0);});
  it('declares local data files and all public source references',()=>{const m=read('mission.json');expect(m.terrainFile).toBe('terrain-local.json');expect(m.coverageFile).toBe('terrain-coverage.json');expect(m.sources.some((s:{title:string})=>s.title.includes('REMS'))).toBe(true);expect(m.sources.some((s:{title:string})=>s.title.includes('Hassler'))).toBe(true);});
  it('loads a complete mission from bundled modules without data requests',async()=>{const mission=await loadMission();expect(mission.terrain.values).toHaveLength(196608);expect(mission.coverageTerrain?.values).toHaveLength(307200);expect(mission.terrain.imageUrl).toBeTruthy();expect(mission.route[0]).toEqual(mission.habitat);expect(mission.route.at(-1)).toEqual(mission.habitat);});
});
