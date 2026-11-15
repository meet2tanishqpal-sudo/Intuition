import { useEffect, useRef, useState } from 'react';
import { loadMission } from './data/load';
import { LAYERS } from './data/types';
import type { LayerId, MissionData, Point } from './data/types';
import { tickSimulation, clockText, INITIAL_STATE, routeProgress, SOL_SECONDS } from './simulation/model';
import { pointOnRoute, routeLength } from './simulation/geometry';
import { MapView } from './components/MapView';
import { DetailPanel } from './components/DetailPanel';
import { Icon } from './components/Icon';
import brandUrl from '../public/marswalk.svg?url';
export default function App() {
  const [data,setData]=useState<MissionData|null>(null),[error,setError]=useState('');
  const [layer,setLayer]=useState<LayerId>('terrain'),[state,setState]=useState(INITIAL_STATE),[probe,setProbe]=useState<Point|null>(null),[sources,setSources]=useState(false),[offline,setOffline]=useState(!navigator.onLine),[cached,setCached]=useState(false),[wide,setWide]=useState(false);
  const [mapRevision,setMapRevision]=useState(0);
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{loadMission().then(setData).catch(e=>setError(String(e)));},[]);
  useEffect(()=>{
    const online=()=>setOffline(!navigator.onLine);window.addEventListener('online',online);window.addEventListener('offline',online);
    const cacheReady=()=>setCached(!!navigator.serviceWorker?.controller);
    if(import.meta.env.PROD&&'serviceWorker'in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange',cacheReady);
      navigator.serviceWorker.ready.then(cacheReady).catch(()=>{});
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,{scope:import.meta.env.BASE_URL}).catch(()=>{/* Existing offline registration can still serve the app. */});
    }
    return()=>{window.removeEventListener('online',online);window.removeEventListener('offline',online);navigator.serviceWorker?.removeEventListener('controllerchange',cacheReady);};
  },[]);
  useEffect(()=>{if(!state.playing)return;let last=performance.now();const id=window.setInterval(()=>{const now=performance.now(),dt=(now-last)/1000;last=now;setState(s=>tickSimulation(s,dt));},100);return()=>clearInterval(id);},[state.playing]);
  useEffect(()=>{if(sources)dialog.current?.showModal();else dialog.current?.close();},[sources]);
  if(error)return <main className="loading"><div className="brand">MARSWALK</div><h1>Local data unavailable</h1><p>{error}</p><p>The app will not substitute unlabelled data. Reload after restoring the bundled assets.</p><button onClick={()=>location.reload()}>Retry loading</button></main>;
  if(!data)return <main className="loading"><div className="brand">MARSWALK</div><p>Preparing local mission data…</p></main>;
  const progress=routeProgress(state.hour),astronaut=pointOnRoute(data.route,progress),length=routeLength(data.route);
  const activeData=data.coverageTerrain?{...data,terrain:data.coverageTerrain}:data;
  return <main className="app-shell">
    <header className="app-header"><div className="brand-group"><img src={brandUrl} alt=""/><div className="brand">MARSWALK<span>SURFACE EXPLORATION SYSTEM</span></div></div><div className="mission-tag"><span className="tiny-dot"/> FIELD SIMULATION <b>GALE / 01</b></div><div className="system-state"><span className={`status-dot ${cached?'ready':''}`}/><span>{offline?'OFFLINE':cached?'OFFLINE READY':'LOCAL ASSETS'}</span><span className="version">PROTOTYPE 1.1</span></div></header>
    <div className="mission-heading"><div><span className="eyebrow">MARS · CURIOSITY LANDING AREA</span><h1>Your Mars, within reach.</h1></div><div className="eva-info"><span>SIMULATED EVA <b>04</b></span><div className="eva-line"/><span>TRAVERSE <b>{(length*progress).toFixed(2)} <small>/ {length.toFixed(2)} km</small></b></span></div><button className={`solar-button ${state.solarDemo?'active':''}`} onClick={()=>setState(s=>({...s,solarDemo:!s.solarDemo}))} aria-pressed={state.solarDemo}><Icon name="sun" size={18}/>{state.solarDemo?'End solar demo':'Solar-event demo'}<span>MANUAL</span></button></div>
    {state.solarDemo&&<div className="alert" role="alert"><Icon name="sun"/><div><b>DEMO ALERT · Simulated solar event</b><p>Manually triggered training scenario. No event detection, forecast, dose increase, or safety threshold is applied.</p></div><button aria-label="Dismiss solar-event demo" onClick={()=>setState(s=>({...s,solarDemo:false}))}><Icon name="close"/></button></div>}
    <div className="display-frame">
      <nav className="parameter-menu" aria-label="Map parameter"><span className="eyebrow">PARAMETERS</span>{LAYERS.map((l,i)=><button key={l.id} className={layer===l.id?'selected':''} onClick={()=>setLayer(l.id)} aria-pressed={layer===l.id}><span className="parameter-index">0{i+1}</span><Icon name={l.id}/><span>{l.name}</span><small>{l.short}</small>{layer===l.id&&<i/>}</button>)}<div className="menu-footer"><span>MISSION DATA</span><strong>Local bundle</strong><small>Simulation, not navigation</small></div></nav>
      <MapView key={mapRevision} data={activeData} layer={layer} hour={state.hour} astronaut={astronaut} probe={probe} onProbe={setProbe} wide={wide} onExtent={()=>{setWide(w=>!w);setProbe(null);}}/>
      <DetailPanel layer={layer} hour={state.hour} position={probe??astronaut} probe={!!probe} data={activeData} onSources={()=>setSources(true)}/>
      <footer className="time-panel"><div className="clock"><span className="eyebrow">SIMULATED LOCAL MARS TIME</span><div><span className="sol">SOL 004</span><time data-testid="mars-clock">{clockText(state.hour)}</time></div><small>1 sol = {(SOL_SECONDS/3600).toFixed(5)} Earth hours</small></div><button className="play-button" onClick={()=>setState(s=>({...s,hour:s.hour>=24?0:s.hour,playing:!s.playing}))} aria-label={state.playing?'Pause simulation':'Play simulation'}><Icon name={state.playing?'pause':'play'} size={20}/><span>{state.playing?'Pause':'Play'}</span></button><div className="timeline"><div className="timeline-title"><label htmlFor="mission-time">MISSION TIMELINE</label><span>{state.hour<8?'Before traverse':state.hour>=12?'Traverse complete':'Traverse in progress'} · 288× clock</span></div><input id="mission-time" type="range" min="0" max="24" step="0.01" value={state.hour} aria-valuetext={`${clockText(state.hour)} simulated Mars time`} onChange={e=>setState(s=>({...s,hour:Number(e.target.value),playing:false}))}/><div className="timeline-ticks">{[0,6,12,18,24].map(t=><button key={t} onClick={()=>setState(s=>({...s,hour:t,playing:false}))} aria-label={`Set simulated time to ${t}:00`}>{String(t).padStart(2,'0')}:00</button>)}</div></div><button className="reset-button" aria-label="Reset simulation" onClick={()=>{setState({...INITIAL_STATE});setLayer('terrain');setProbe(null);setWide(false);setMapRevision(v=>v+1);}}><Icon name="reset" size={19}/><span>Reset</span></button></footer>
    </div>
    <div className="app-footnote"><span><i/> Designed for exploration. Built for a demo.</span><span>NASA / USGS imagery · Simulated route & atmosphere · <button onClick={()=>setSources(true)}>View data notes</button></span></div>
    <dialog ref={dialog} onCancel={()=>setSources(false)} onClose={()=>setSources(false)}><div className="dialog-heading"><div><span className="eyebrow">TRANSPARENT BY DESIGN</span><h2>Sources & limitations</h2></div><button aria-label="Close data notes" onClick={()=>setSources(false)}><Icon name="close"/></button></div><p>This prototype is a geographic interface and a mission simulation. It is not operational navigation or a safety decision system.</p><div className="evidence-guide"><p><span className="evidence observed">Observed</span> Instrument observations, with a cited product.</p><p><span className="evidence derived">Derived</span> Processed observations, such as resampled elevation.</p><p><span className="evidence estimated">Estimated</span> Reference values or supported model estimates.</p><p><span className="evidence simulated">Simulated</span> Illustrative inputs, route, clock, and atmosphere.</p></div><h3>Regional atlas</h3><p>The NASA Mars Trek Viking MDIM 2.1 mosaic supplies continuous regional imagery from 135 to 140.625° E and 2.8125 to 8.4375° S, approximately 330 km across. This is image context, not elevation. Drag or pinch the map; use +/− to zoom and the target button to return to the astronaut. The dashed box marks the detailed DEM frame; hatching marks missing DEM cells. Grey beyond the regional image is outside the downloaded bundle.</p><h3>Coverage & geometry</h3><p>{data.terrain.description} Local grid bounds: {data.terrain.bounds.south.toFixed(5)} to {data.terrain.bounds.north.toFixed(5)}° N; {data.terrain.bounds.west.toFixed(5)} to {data.terrain.bounds.east.toFixed(5)}° E. Missing terrain cells remain masked. This is not a verified 20 km-radius dataset.</p><p>Distances use a 3,389.5 km spherical Mars radius. The route, habitat, and astronaut are fictional. Coordinates use east-positive longitude. The simulated clock starts at sol 004, 08:00 and is unrelated to the current date or Mars local solar time.</p><h3>Local data bundle</h3>{data.sources.map(s=><article className="source" key={s.title}><strong>{s.url?<a href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a>:s.title}</strong><p>{s.note}</p></article>)}<h3>Atmosphere & radiation</h3><p>Temperature and pressure are uniform spatial fixtures with illustrative daily formulas. Their values do not come from REMS tables. The radiation display is a constant illustrative absorbed-dose-rate reference of 210 µGy per Earth day in tissue-like RAD detector material; it is not equivalent dose in sieverts or a personal exposure estimate. There is no shielding, pressure scaling, or solar-event radiation model.</p><p>The manually triggered solar-event alert is a UI demonstration only. No colours indicate sourced safety thresholds. Offline reload becomes available after one successful production load and service-worker activation.</p></dialog>
  </main>;
}





