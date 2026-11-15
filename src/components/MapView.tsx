import { useEffect, useMemo, useRef, useState } from 'react';
import type { LayerId, MissionData, Point, Bounds } from '../data/types';
import { distanceKm, fromMap, toMap } from '../simulation/geometry';
import { airTemperature, pressure } from '../simulation/model';
import contextUrl from '../../public/data/gale-context.jpg?url';
import contextMeta from '../../public/data/context-provenance.json';
import localUrl from '../../public/data/orthophoto-local.png?url';
import localGrid from '../../public/data/terrain-local.json';
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export function MapView({data,layer,hour,astronaut,probe,onProbe,wide,onExtent}:{data:MissionData;layer:LayerId;hour:number;astronaut:Point;probe:Point|null;onProbe:(p:Point|null)=>void;wide:boolean;onExtent:()=>void}) {
 const stage=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 const [size,setSize]=useState({w:700,h:500}),[camera,setCamera]=useState({x:500,y:375,zoom:1}),[images,setImages]=useState<HTMLImageElement[]>([]),[imageFailed,setImageFailed]=useState(false);
 const pointers=useRef(new Map<number,{x:number;y:number}>());
 const drag=useRef({x:0,y:0,moved:false,distance:0});
 const terrain=data.coverageTerrain??data.terrain;
 const worldWidth=distanceKm({lat:data.center.lat,lon:terrain.bounds.west},{lat:data.center.lat,lon:terrain.bounds.east});
 const vw=1000/camera.zoom,vh=vw*size.h/size.w;
 const left=camera.x-vw/2,top=camera.y-vh/2;
 useEffect(()=>{const el=stage.current;if(!el)return;const stop=(e:WheelEvent)=>e.preventDefault();el.addEventListener('wheel',stop,{passive:false});return()=>el.removeEventListener('wheel',stop);},[]);
 useEffect(()=>{const o=new ResizeObserver(([e])=>setSize({w:e.contentRect.width,h:e.contentRect.height}));if(stage.current)o.observe(stage.current);return()=>o.disconnect();},[]);
 useEffect(()=>{let active=true;Promise.all([contextUrl,localUrl].map(url=>new Promise<HTMLImageElement>((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=url;}))).then(im=>{if(active)setImages(im);}).catch(()=>{if(active)setImageFailed(true);});return()=>{active=false;};},[]);
 useEffect(()=>{const [x,y]=toMap(data.center,terrain.bounds);setCamera({x,y,zoom:wide?.16:3.33});},[wide,data.center,terrain.bounds]);
 const raster=useMemo(()=>{const c=document.createElement('canvas');c.width=terrain.width;c.height=terrain.height;const ctx=c.getContext('2d')!;const im=ctx.createImageData(c.width,c.height);
 for(let i=0;i<terrain.values.length;i++){const z=terrain.values[i];if(z===null){if((i%terrain.width+Math.floor(i/terrain.width))%12<2)im.data.set([70,80,75,85],i*4);continue;}const t=(z-terrain.min)/(terrain.max-terrain.min);let rgb=[90+110*t,102+75*t,83+57*t];
 if(layer==='temperature'){const t=clamp((airTemperature(hour)+80)/70,0,1);rgb=[48+152*t,93+23*t,139-66*t];}
 if(layer==='pressure'){const t=clamp((pressure(hour)-700)/70,0,1);rgb=[39+71*t,78+95*t,105+66*t];}
 if(layer==='radiation')rgb=[111,91,139];im.data.set([...rgb,layer==='terrain'?100:190],i*4);}
 ctx.putImageData(im,0,0);return c;},[terrain,layer,layer==='temperature'||layer==='pressure'?hour:0]);
 useEffect(()=>{const ctx=canvas.current?.getContext('2d');if(!ctx)return;const dpr=Math.min(devicePixelRatio,2);canvas.current!.width=size.w*dpr;canvas.current!.height=size.h*dpr;ctx.scale(dpr,dpr);ctx.fillStyle='#e6e3db';ctx.fillRect(0,0,size.w,size.h);
 const draw=(image:CanvasImageSource,b:Bounds)=>{const [x,y]=toMap({lon:b.west,lat:b.north},terrain.bounds),[x2,y2]=toMap({lon:b.east,lat:b.south},terrain.bounds);ctx.drawImage(image,(x-left)/vw*size.w,(y-top)/vh*size.h,(x2-x)/vw*size.w,(y2-y)/vh*size.h);};
 if(images[0])draw(images[0],contextMeta.bounds);if(images[1]&&camera.zoom>1)draw(images[1],localGrid.bounds);
 // Context imagery supplies no elevation. Only measured DEM cells receive elevation tint.
 if(layer==='terrain')draw(raster,terrain.bounds);
 else {ctx.fillStyle=layer==='radiation'?'rgba(111,91,139,.70)':layer==='temperature'?`rgba(${Math.round(48+152*clamp((airTemperature(hour)+80)/70,0,1))},116,100,.65)`:'rgba(65,145,155,.65)';ctx.fillRect(0,0,size.w,size.h);}
 },[images,raster,camera,size,layer,hour,terrain,left,top,vw,vh]);
 const zoom=(factor:number)=>setCamera(c=>({...c,zoom:clamp(c.zoom*factor,.16,16)}));
 const pan=(dx:number,dy:number)=>setCamera(c=>{const [minX,minY]=toMap({lon:contextMeta.bounds.west,lat:contextMeta.bounds.north},terrain.bounds),[maxX,maxY]=toMap({lon:contextMeta.bounds.east,lat:contextMeta.bounds.south},terrain.bounds);return {...c,x:clamp(c.x-dx/size.w*vw,minX,maxX),y:clamp(c.y-dy/size.h*vh,minY,maxY)};});
 const recenter=()=>{const [x,y]=toMap(astronaut,terrain.bounds);setCamera({x,y,zoom:3.33});onProbe(null);};
 const path=data.route.map((p,i)=>`${i?'L':'M'}${toMap(p,terrain.bounds).join(',')}`).join(' ');
 const [ax,ay]=toMap(astronaut,terrain.bounds),[hx,hy]=toMap(data.habitat,terrain.bounds),marker=vw/size.w;
 const scaleKm=worldWidth*vw/1000>100?20:worldWidth*vw/1000>20?5:1;
 return <section className="map-area" aria-label="Gale Crater exploration map"><div className="map-top"><div><span className="eyebrow">OFFLINE MARS ATLAS</span><h2>Gale Crater <span>NASA / USGS imagery</span></h2></div><div className="map-controls"><button onClick={onExtent}>{wide?'Landing area':'Explore crater'}</button></div></div>
 <div className="map-stage" ref={stage}><canvas ref={canvas} aria-label="NASA Viking context imagery and USGS local elevation"/>
 <svg className="map-overlay" viewBox={`${left} ${top} ${vw} ${vh}`} tabIndex={0} role="application" aria-label="Interactive Mars map. Drag to pan, plus and minus to zoom, arrow keys to pan, Home to recenter. Tap to inspect."
 onWheel={e=>zoom(e.deltaY<0?1.15:1/1.15)} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','Home'].includes(e.key))e.preventDefault();if(e.key==='+'||e.key==='=')zoom(1.4);if(e.key==='-')zoom(1/1.4);if(e.key==='Home')recenter();if(e.key==='ArrowLeft')pan(80,0);if(e.key==='ArrowRight')pan(-80,0);if(e.key==='ArrowUp')pan(0,80);if(e.key==='ArrowDown')pan(0,-80);}}
 onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});drag.current={x:e.clientX,y:e.clientY,moved:false,distance:0};}}
 onPointerMove={e=>{if(!pointers.current.has(e.pointerId))return;const previous=pointers.current.get(e.pointerId)!;pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.current.size===2){const [a,b]=[...pointers.current.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(drag.current.distance)zoom(d/drag.current.distance);drag.current.distance=d;drag.current.moved=true;}else if(Math.hypot(e.clientX-drag.current.x,e.clientY-drag.current.y)>4||drag.current.moved){drag.current.moved=true;pan(e.clientX-previous.x,e.clientY-previous.y);}}}
 onPointerUp={e=>{if(!drag.current.moved&&pointers.current.size===1){const rect=e.currentTarget.getBoundingClientRect();onProbe(fromMap(left+(e.clientX-rect.left)/rect.width*vw,top+(e.clientY-rect.top)/rect.height*vh,terrain.bounds));}pointers.current.delete(e.pointerId);drag.current.distance=0;}}
 onPointerCancel={e=>{pointers.current.delete(e.pointerId);drag.current.moved=true;}}>
 <rect x="0" y="0" width="1000" height="750" fill="none" stroke="#fff" strokeDasharray="6 5" vectorEffect="non-scaling-stroke"/>
 <path d={path} fill="none" stroke="#fff" strokeWidth="6" vectorEffect="non-scaling-stroke"/><path d={path} fill="none" stroke="#1b665e" strokeWidth="3" strokeDasharray="8 5" vectorEffect="non-scaling-stroke"/>
 <g transform={`translate(${hx} ${hy}) scale(${marker})`}><rect x="-13" y="-13" width="26" height="26" rx="5" fill="white" stroke="#1b665e" strokeWidth="2"/><path d="m-7 0 7-6 7 6v6H-7Z" fill="#1b665e"/><text x="18" y="-16" className="map-label">HABITAT</text></g>
 <g transform={`translate(${ax} ${ay}) scale(${marker})`}><circle r="18" fill="#ed8a54" opacity=".3"/><circle r="9" fill="#dc6129" stroke="white" strokeWidth="3"/><text x="16" y="6" className="map-label">YOU</text></g>
 {probe&&(()=>{const [x,y]=toMap(probe,terrain.bounds);return <circle cx={x} cy={y} r={12*marker} stroke="white" strokeWidth="3" fill="none" vectorEffect="non-scaling-stroke"/>;})()}
 </svg><div className="north">N ↑</div><div className="map-tools"><button aria-label="Zoom in" onClick={()=>zoom(1.5)}>+</button><button aria-label="Zoom out" onClick={()=>zoom(1/1.5)}>−</button><button aria-label="Recenter on astronaut" onClick={recenter}>⌖</button></div><div className="map-context">{imageFailed?'Imagery unavailable • elevation only':layer==='terrain'?'NASA Viking • USGS detail':layer==='radiation'?'Uniform radiation reference':'Simulated atmosphere • uniform'}</div><div className="scale"><div style={{width:`${scaleKm/(worldWidth*vw/1000)*100}%`}}/><span>{scaleKm} km · Mars</span></div><div className="map-coverage">Dashed boundary: DEM extent<br/>Hatching / outside: no elevation</div></div>
 <div className="map-bottom"><span><i className="route-key"/> Demo route</span><span className="map-hint">Drag · pinch / scroll · tap to inspect</span><span className="map-span">{(worldWidth*vw/1000).toFixed(1)} km view</span></div></section>;
}
