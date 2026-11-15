export type LayerId = 'terrain' | 'temperature' | 'pressure' | 'radiation';
export type Evidence = 'observed' | 'derived' | 'estimated' | 'simulated';
export interface Point { lat: number; lon: number }
export interface Bounds { west: number; east: number; south: number; north: number }
export interface TerrainGrid { width: number; height: number; bounds: Bounds; values: (number | null)[]; evidence: Evidence; source: string; description: string; resolution: string; min: number; max: number; imageFile?: string; imageUrl?: string; }
export interface MissionData { terrain: TerrainGrid; coverageTerrain?: TerrainGrid; center: Point; route: Point[]; habitat: Point; sources: { title: string; url: string; note: string }[]; }
export interface Reading { value: number | null; unit: string; quantity: string; evidence: Evidence; description: string }
export const LAYERS: { id: LayerId; name: string; short: string; unit: string }[] = [
  { id: 'terrain', name: 'Terrain', short: 'Elevation', unit: 'm' },
  { id: 'temperature', name: 'Temperature', short: 'Air temperature', unit: '°C' },
  { id: 'pressure', name: 'Pressure', short: 'Surface pressure', unit: 'Pa' },
  { id: 'radiation', name: 'Radiation', short: 'Absorbed dose rate', unit: 'µGy/day' },
];
