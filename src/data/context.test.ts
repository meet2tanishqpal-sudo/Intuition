import { describe, expect, it } from 'vitest';
import context from '../../public/data/context-provenance.json';
import { distanceKm } from '../simulation/geometry';
import { loadMission } from './load';
import { getReading } from '../simulation/model';
describe('regional context and elevation separation',()=>{
 it('matches bundled WMTS tile coordinates to bounds',()=>{
  const step=180/2**context.matrix;
  expect(context.bounds.west).toBe(-180+context.columns[0]*step);
  expect(context.bounds.east).toBe(-180+(context.columns[1]+1)*step);
  expect(context.bounds.north).toBe(90-context.rows[0]*step);
  expect(context.bounds.south).toBe(90-(context.rows[1]+1)*step);
  expect(context.width).toBe((context.columns[1]-context.columns[0]+1)*256);
 });
 it('has roughly 330 km regional width using Mars geometry',()=>{
  const width=distanceKm({lat:-4.5895,lon:context.bounds.west},{lat:-4.5895,lon:context.bounds.east});
  expect(width).toBeGreaterThan(330);expect(width).toBeLessThan(333);
 });
 it('does not infer elevation from regional imagery and keeps radiation uniform',async()=>{
  const data=await loadMission();const grid=data.coverageTerrain!;
  expect(getReading('terrain',8,{lat:-6,lon:139},grid).value).toBeNull();
  expect(getReading('radiation',8,{lat:-6,lon:139},grid).value).toBe(getReading('radiation',12,data.center,grid).value);
 });
});
