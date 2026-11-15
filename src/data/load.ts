import type { MissionData, TerrainGrid } from './types';
import { offsetPoint } from '../simulation/geometry';
import manifest from '../../public/data/mission.json';
import localTerrain from '../../public/data/terrain-local.json';
import wideTerrain from '../../public/data/terrain-coverage.json';
import localImageUrl from '../../public/data/orthophoto-local.png?url';
const center = {lat:-4.5895,lon:137.4417};
function fixtureTerrain(): TerrainGrid {
  const width=320,height=240;
  const nw=offsetPoint(center,-6,4.5),se=offsetPoint(center,6,-4.5);
  const values: (number|null)[]=[];
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const u=x/width,v=y/height;
    const ridge=Math.sin(u*19+Math.sin(v*9)*1.5)*Math.cos(v*15+u*3);
    const detail=Math.sin(u*109+v*18)*Math.cos(v*93-u*12)*8+Math.sin(u*39-v*32)*13;
    values.push(u>.79 && v>.55 ? null : Math.round(-4550+v*180+u*70+ridge*35+detail));
  }
  return {width,height,bounds:{west:nw.lon,east:se.lon,north:nw.lat,south:se.lat},values,evidence:'simulated',source:'Marswalk illustrative terrain fixture',description:'Synthetic relief in a geographic display frame near Curiosity. These elevations are not observations and the texture is not a georeferenced Mars image.',resolution:'Illustrative grid · no observational resolution',min:-4620,max:-4240};
}
export function validateTerrain(value: unknown): TerrainGrid {
  const g=value as TerrainGrid;
  if(!g||!Number.isInteger(g.width)||!Number.isInteger(g.height)||g.width<2||g.height<2||g.width*g.height>4000000||!Array.isArray(g.values)||g.values.length!==g.width*g.height||g.values.some(v=>v!==null&&!Number.isFinite(v))) throw new Error('Invalid terrain grid');
  if(!g.bounds||![g.bounds.west,g.bounds.east,g.bounds.south,g.bounds.north].every(Number.isFinite)||g.bounds.west>=g.bounds.east||g.bounds.south>=g.bounds.north) throw new Error('Invalid terrain bounds');
  if(!['observed','derived','estimated','simulated'].includes(g.evidence)||!g.source||!g.description||!g.resolution||!Number.isFinite(g.min)||!Number.isFinite(g.max)||g.min>=g.max) throw new Error('Invalid terrain provenance');
  return g;
}
export async function loadMission(): Promise<MissionData> {
  // Compile the local bundle into the production entry. This preserves a single
  // offline boot boundary: no data fetch can race a service-worker update.
  let terrain=fixtureTerrain();
  if(manifest.terrainFile) {
    terrain={...validateTerrain(localTerrain),imageUrl:localImageUrl};
  }
  let coverageTerrain: TerrainGrid | undefined;
  if(manifest.coverageFile) {
    coverageTerrain=validateTerrain(wideTerrain);
  }
  const habitat=offsetPoint(center,-1.6,1.2);
  const route=[habitat,offsetPoint(center,-1.0,.55),offsetPoint(center,.1,.8),offsetPoint(center,1.05,.1),offsetPoint(center,1.4,-.7),offsetPoint(center,.5,-1.2),offsetPoint(center,-.7,-.8),offsetPoint(center,-1.5,.1),habitat];
  return {terrain,coverageTerrain,center,habitat,route,sources:manifest.sources??[]};
}
