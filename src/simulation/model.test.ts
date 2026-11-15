import { describe, expect, it } from 'vitest';
import { advanceHour, airTemperature, clockText, getReading, INITIAL_STATE, pressure, routeProgress, sampleTerrain, tickSimulation } from './model';
import { distanceKm, fromMap, MARS_RADIUS_KM, pointOnRoute, routeLength, toMap } from './geometry';
import { validateTerrain } from '../data/load';
import type { TerrainGrid } from '../data/types';
const grid:TerrainGrid={width:2,height:2,bounds:{west:137,east:138,south:-5,north:-4},values:[-4500,null,-4400,-4300],evidence:'simulated',source:'test',description:'test fixture',resolution:'test',min:-4500,max:-4300};
const p={lat:-4.25,lon:137.25};
describe('Mars geometry',()=>{
  it('uses Mars rather than Earth radius',()=>expect(distanceKm({lat:0,lon:0},{lat:0,lon:1})).toBeCloseTo(MARS_RADIUS_KM*Math.PI/180,8));
  it('interpolates by distance and clamps route endpoints',()=>{const r=[{lat:0,lon:0},{lat:0,lon:1},{lat:0,lon:3}];expect(pointOnRoute(r,.5).lon).toBeCloseTo(1.5);expect(pointOnRoute(r,-1)).toEqual(r[0]);expect(pointOnRoute(r,2)).toEqual(r[2]);expect(routeLength(r)).toBeCloseTo(3*MARS_RADIUS_KM*Math.PI/180);});
  it('round-trips display coordinates without Earth projection',()=>{const [x,y]=toMap(p,grid.bounds);expect(fromMap(x,y,grid.bounds)).toEqual(p);});
});
describe('shared mission time',()=>{
  it('starts/reset at 08:00, paused and without alert',()=>expect(INITIAL_STATE).toEqual({hour:8,playing:false,solarDemo:false}));
  it('does not let an already queued playback tick restart a pause or reset',()=>{expect(tickSimulation(INITIAL_STATE,1)).toBe(INITIAL_STATE);expect(tickSimulation({hour:23.99,playing:true,solarDemo:false},1)).toEqual({hour:24,playing:false,solarDemo:false});});
  it('drives traverse only from 08 to 12',()=>{expect(routeProgress(6)).toBe(0);expect(routeProgress(10)).toBe(.5);expect(routeProgress(14)).toBe(1);});
  it('advances by elapsed time and stops at sol end',()=>{expect(advanceHour(8,10)).toBe(8.8);expect(advanceHour(23.9,10)).toBe(24);expect(clockText(8.5)).toBe('08:30:00');expect(clockText(24)).toBe('24:00:00');});
  it('synchronizes readings to the selected hour',()=>{for(const hour of [0,6,8,12,18,24]){expect(getReading('temperature',hour,p,grid).value).toBe(airTemperature(hour));expect(getReading('pressure',hour,p,grid).value).toBe(pressure(hour));}expect(airTemperature(14)).toBeGreaterThan(airTemperature(2));});
  it('keeps static elevation and radiation constant in time',()=>{expect(getReading('terrain',0,p,grid)).toEqual(getReading('terrain',12,p,grid));expect(getReading('radiation',0,p,grid).value).toBe(210);expect(getReading('radiation',18,{lat:-4.9,lon:137.9},grid).value).toBe(210);});
});
describe('missing data and validation',()=>{
  it('preserves null cells and out-of-bounds locations',()=>{expect(sampleTerrain(grid,{lat:-4.25,lon:137.75})).toBeNull();expect(sampleTerrain(grid,{lat:-3.9,lon:137.5})).toBeNull();expect(getReading('terrain',8,{lat:-4.25,lon:137.75},grid).value).toBeNull();});
  it('handles exact outer grid edges',()=>{expect(sampleTerrain(grid,{lat:-5,lon:138})).toBe(-4300);expect(sampleTerrain(grid,{lat:-4,lon:137})).toBe(-4500);});
  it('rejects malformed raster or missing provenance',()=>{expect(validateTerrain(grid)).toEqual(grid);expect(()=>validateTerrain({...grid,values:[1]})).toThrow();expect(()=>validateTerrain({...grid,evidence:'observed-ish'})).toThrow();expect(()=>validateTerrain({...grid,bounds:{...grid.bounds,east:136}})).toThrow();});
});
