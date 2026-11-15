import type { LayerId, MissionData, Point } from '../data/types';
import { getReading } from '../simulation/model';
import { distanceKm } from '../simulation/geometry';
export function DetailPanel({layer,hour,position,probe,data,onSources}:{layer:LayerId;hour:number;position:Point;probe:boolean;data:MissionData;onSources:()=>void}) {
  const r=getReading(layer,hour,position,data.terrain);
  const temporal=layer==='temperature'||layer==='pressure';
  const values=Array.from({length:97},(_,i)=>getReading(layer,i/4,position,data.terrain).value??0);
  const min=layer==='temperature'?-80:700,max=layer==='temperature'?-10:780;
  const y=(v:number)=>69-(v-min)/(max-min)*54;
  const path=values.map((v,i)=>`${i?'L':'M'}${i/96*240},${y(v)}`).join(' ');
  return <aside className="detail-panel" aria-label="Selected layer details">
    <div className="detail-heading"><span className="eyebrow">{probe?'INSPECTED LOCATION':'AT ASTRONAUT'}</span><span className={`evidence ${r.evidence}`}>{r.evidence}</span></div>
    <h2>{r.quantity}</h2>
    <div className="reading"><strong data-testid="reading-value">{r.value===null?'—':Math.round(r.value).toLocaleString('en-US')}</strong><span>{r.unit}</span></div>
    <p className="reading-sub">{layer==='terrain'?(r.value===null?'No terrain coverage here':data.terrain.evidence==='simulated'?'Illustrative elevation':'Elevation relative to MOLA datum'):layer==='radiation'?'Per Earth day (86,400 s)':'At current simulated local time'}</p>
    {r.value===null?<div className="no-data"><b>No data</b><p>This cell is masked. No elevation is inferred from neighbouring pixels.</p></div>:temporal?<div className="mini-chart"><div className="chart-title"><span>ILLUSTRATIVE SOL PROFILE</span><span>{Math.round(r.value)} {r.unit}</span></div><svg viewBox="0 0 240 90" role="img" aria-label={`Illustrative ${r.quantity.toLowerCase()} curve with current time marker`}><path d="M0 25H240M0 50H240M0 75H240" stroke="#303a3a" strokeWidth="1"/><path d={path} fill="none" stroke={layer==='temperature'?'#e8a57c':'#83b7b3'} strokeWidth="2"/><path d={`M${hour/24*240} 8V80`} stroke="#d7dfd5" strokeDasharray="2 3"/><circle cx={hour/24*240} cy={y(r.value)} r="4" fill="#e9eee5"/></svg><div className="chart-axis"><span>00h</span><span>12h</span><span>24h</span></div></div>:<div className="static-note"><span className="static-symbol">{layer==='terrain'?'▧':'◎'}</span><div><b>{layer==='terrain'?'Static terrain layer':'Spatially uniform reference'}</b><span>{layer==='terrain'?'Changes with location, not time.':'No pressure or shielding adjustment.'}</span></div></div>}
    <div className={`legend legend-${layer}`}><div className="legend-heading"><span>MAP LEGEND</span><span>{layer==='terrain'?'Elevation':layer==='radiation'?'Reference':r.unit}</span></div><div className="legend-bar"/><div className="legend-labels">{layer==='terrain'?<><span>{data.terrain.min.toLocaleString()} m</span><span>{data.terrain.max.toLocaleString()} m</span></>:layer==='temperature'?<><span>−80 °C</span><span>−10 °C</span></>:layer==='pressure'?<><span>700 Pa</span><span>770 Pa</span></>:<span>210 µGy/day everywhere</span>}</div><div className="missing-key"><i/> No terrain coverage</div></div>
    <div className="position"><div><span>LATITUDE</span><b>{Math.abs(position.lat).toFixed(4)}° S</b></div><div><span>LONGITUDE</span><b>{position.lon.toFixed(4)}° E</b></div><div className="from-hab"><span>FROM HABITAT</span><b>{distanceKm(data.habitat,position).toFixed(2)} km <small>direct</small></b></div></div>
    <div className="provenance"><span className="eyebrow">DATA PROVENANCE</span><p>{r.description}</p>{layer==='terrain'&&<small>{data.terrain.resolution}</small>}<button onClick={onSources}>Sources & limitations <span>↗</span></button></div>
  </aside>;
}
