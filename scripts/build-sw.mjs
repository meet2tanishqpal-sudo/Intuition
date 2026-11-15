import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
async function walk(dir) { const files=[]; for(const item of await readdir(dir,{withFileTypes:true})) {const path=`${dir}/${item.name}`;if(item.isDirectory())files.push(...await walk(path));else files.push(path);}return files; }
const files=(await walk('dist')).filter(p=>!p.endsWith('/sw.js'));
const hash=createHash('sha256');for(const f of files)hash.update(await readFile(f));
const cache=`marswalk-${hash.digest('hex').slice(0,12)}`;
await writeFile('dist/sw.js',`const CACHE=${JSON.stringify(cache)};const FILES=${JSON.stringify(files.map(f=>'./'+f.slice(5)))};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('marswalk-')).slice(0,-2).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;event.respondWith(caches.open(CACHE).then(async cache=>{if(event.request.mode==='navigate'){try{const online=await fetch(event.request);if(online.ok)return online;}catch{}return await cache.match(new URL('./index.html',self.registration.scope).href)||Response.error();}const found=await cache.match(event.request,{ignoreSearch:true})||await caches.match(event.request,{ignoreSearch:true});return found||fetch(event.request);}));});`);
console.log(`Offline cache ${cache}: ${files.length} local assets`);
