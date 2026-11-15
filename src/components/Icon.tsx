import type { LayerId } from '../data/types';
export function Icon({name,size=24}:{name:LayerId|'play'|'pause'|'reset'|'sun'|'close'|'arrow';size?:number}) {
  const paths:Record<string,React.ReactNode>={
    terrain:<><path d="m2 19 6-11 4 6 4-10 6 15H2Z"/><path d="m5 14 3 1 2-2m4-3 2 1 2-1"/></>,
    temperature:<><path d="M9 14.5V5a3 3 0 0 1 6 0v9.5a5 5 0 1 1-6 0Z"/><path d="M12 8v10m6-12h3m-3 4h2"/></>,
    pressure:<><path d="M4 18a9 9 0 1 1 16 0M5 12h2m10 0h2M12 3v3m-6 0 2 2m10-2-2 2"/><path d="m12 14 4-4m-9 9h10"/><circle cx="12" cy="14" r="1"/></>,
    radiation:<><circle cx="12" cy="12" r="2"/><path d="m10 8-3-5a10 10 0 0 1 10 0l-3 5M8 12H2a10 10 0 0 0 5 9l3-5m6-4h6a10 10 0 0 1-5 9l-3-5"/></>,
    play:<path d="m8 4 12 8-12 8Z"/>,pause:<><path d="M8 4v16M16 4v16"/></>,reset:<><path d="M4 10a8 8 0 1 1 1 8M4 3v7h7"/></>,sun:<><circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/></>,close:<path d="m6 6 12 12M6 18 18 6"/>,arrow:<path d="M5 12h14m-6-6 6 6-6 6"/>
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
