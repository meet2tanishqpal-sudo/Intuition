import type { LayerId, Point, Reading, TerrainGrid } from '../data/types';
export const SOL_SECONDS = 88775.244;
export const INITIAL_HOUR = 8;
export const INITIAL_STATE = { hour: INITIAL_HOUR, playing: false, solarDemo: false };
export function tickSimulation(state: typeof INITIAL_STATE, elapsedRealSeconds: number): typeof INITIAL_STATE {
  if(!state.playing)return state;
  const hour=advanceHour(state.hour,elapsedRealSeconds);
  return {...state,hour,playing:hour<24};
}
export function routeProgress(hour: number): number { return Math.max(0,Math.min(1,(hour-8)/4)); }
export function advanceHour(hour: number, elapsedRealSeconds: number): number { return Math.min(24,hour+elapsedRealSeconds*.08); }
export function clockText(hour: number): string {
  const s=Math.floor(Math.max(0,Math.min(24,hour))*3600);
  return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(n=>String(n).padStart(2,'0')).join(':');
}
export function sampleTerrain(grid: TerrainGrid,p: Point): number | null {
  const b=grid.bounds;
  if(p.lon<b.west||p.lon>b.east||p.lat<b.south||p.lat>b.north) return null;
  const x=Math.min(grid.width-1,Math.floor((p.lon-b.west)/(b.east-b.west)*grid.width));
  const y=Math.min(grid.height-1,Math.floor((b.north-p.lat)/(b.north-b.south)*grid.height));
  return grid.values[y*grid.width+x] ?? null;
}
// Deliberately illustrative formulas; not fitted to REMS observations.
export function airTemperature(hour: number): number { return -47+30*Math.cos(2*Math.PI*(hour-14)/24); }
export function pressure(hour: number): number { return 735+24*Math.cos(2*Math.PI*(hour-8)/24)+9*Math.cos(4*Math.PI*(hour-9)/24); }
export function getReading(layer: LayerId,hour: number,p: Point,terrain: TerrainGrid): Reading {
  if(layer==='terrain') return {value:sampleTerrain(terrain,p),unit:'m',quantity:'Elevation',evidence:terrain.evidence,description:terrain.description};
  if(layer==='temperature') return {value:airTemperature(hour),unit:'°C',quantity:'Air temperature',evidence:'simulated',description:'Illustrative diurnal curve. Uniform across this view; no REMS samples or thermal-inertia model are loaded.'};
  if(layer==='pressure') return {value:pressure(hour),unit:'Pa',quantity:'Surface pressure',evidence:'simulated',description:'Illustrative pressure cycle. Uniform across this view; no altitude correction or REMS observations are applied.'};
  return {value:210,unit:'µGy/day',quantity:'Absorbed dose rate',evidence:'estimated',description:'Uniform reference from the 2012–2013 RAD tissue-like E detector: 210 ± 40 µGy/Earth day (Hassler et al., 2014). Map-wide application is illustrative, not personal dose or a safety limit.'};
}
