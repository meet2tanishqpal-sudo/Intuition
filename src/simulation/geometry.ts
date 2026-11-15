import type { Bounds, Point } from '../data/types';
// IAU mean Mars radius, spherical approximation. Never use an Earth distance helper.
export const MARS_RADIUS_KM = 3389.5;
const rad = Math.PI / 180;
export function distanceKm(a: Point, b: Point): number {
  const h = Math.sin((b.lat-a.lat)*rad/2)**2 + Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin((b.lon-a.lon)*rad/2)**2;
  return 2*MARS_RADIUS_KM*Math.asin(Math.sqrt(Math.min(1, h)));
}
export function offsetPoint(center: Point, eastKm: number, northKm: number): Point {
  return { lat: center.lat + northKm/MARS_RADIUS_KM/rad, lon: center.lon + eastKm/(MARS_RADIUS_KM*Math.cos(center.lat*rad))/rad };
}
export function routeLength(route: Point[]): number { return route.slice(1).reduce((sum,p,i)=>sum+distanceKm(route[i],p),0); }
export function pointOnRoute(route: Point[], progress: number): Point {
  if (!route.length) throw new Error('Route requires at least one point');
  let remaining = Math.max(0,Math.min(1,progress))*routeLength(route);
  for (let i=1;i<route.length;i++) { const length=distanceKm(route[i-1],route[i]); if (remaining<=length && length>0) { const t=remaining/length; return {lat:route[i-1].lat+(route[i].lat-route[i-1].lat)*t,lon:route[i-1].lon+(route[i].lon-route[i-1].lon)*t}; } remaining-=length; }
  return route[route.length-1];
}
export function toMap(p: Point, b: Bounds): [number,number] { return [(p.lon-b.west)/(b.east-b.west)*1000,(b.north-p.lat)/(b.north-b.south)*750]; }
export function fromMap(x: number,y: number,b: Bounds): Point { return {lon:b.west+x/1000*(b.east-b.west),lat:b.north-y/750*(b.north-b.south)}; }
