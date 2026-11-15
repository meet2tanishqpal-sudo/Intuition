// Production integrity + service-worker lifecycle checks in a Node VM.
// This exercises the real generated worker; it is not a browser offline test.
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const origin='http://localhost:4173';
const shell=await readFile('dist/index.html','utf8');
assert(!/<script\b[^>]*\bsrc=/i.test(shell),'Boot must not depend on external script requests');
assert(!/<link\b[^>]*rel="stylesheet"/i.test(shell),'Styles must be embedded');
assert(shell.includes('data:image/png;base64,'),'Orbital image must be embedded');
assert(shell.includes('196608')&&shell.includes('222466'),'Both terrain grids must be embedded');
assert(!shell.includes('fonts.googleapis.com'),'No remote fonts');
const script=shell.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
assert(script,'Inline application module exists');
new vm.Script(script,{filename:'production-inline.js'});
const listeners=new Map(),stores=new Map();let offline=false,claims=0,waiting=0;
function key(input){return new URL(typeof input==='string'?input:input.url,origin+'/').href.split('?')[0];}
async function network(input){if(offline)throw new TypeError('Simulated unavailable network');const url=new URL(key(input));const pathname=url.pathname==='/'?'/index.html':url.pathname;const path=resolve('dist','.'+pathname);assert(path.startsWith(resolve('dist')));const body=await readFile(path);return new Response(body,{status:200});}
const cacheApi={
  async open(name){if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);return{async addAll(files){for(const file of files)store.set(key(file),await network(file));},async match(request){return store.get(key(request))?.clone();}};},
  async keys(){return [...stores.keys()];},async delete(name){return stores.delete(name);},async match(request){for(const store of stores.values()){const value=store.get(key(request));if(value)return value.clone();}}
};
const self={location:new URL(origin+'/sw.js'),registration:{scope:origin+'/'},clients:{async claim(){claims++;}},async skipWaiting(){waiting++;},addEventListener(type,handler){listeners.set(type,handler);}};
const worker=await readFile('dist/sw.js','utf8');
vm.runInNewContext(worker,{self,caches:cacheApi,fetch:network,URL,Response,Promise},{filename:'sw.js'});
async function lifecycle(type){let done;listeners.get(type)({waitUntil(p){done=p;}});await done;}
await lifecycle('install');await lifecycle('activate');
assert.equal(claims,1);assert.equal(waiting,1);
const cacheName=[...stores.keys()][0],cachedCount=stores.get(cacheName).size;
assert(cachedCount>=11,'App and local assets were precached');
offline=true;
async function cachedRequest(path,mode='cors'){let response;listeners.get('fetch')({request:{url:origin+path,method:'GET',mode},respondWith(p){response=p;}});return response;}
const navigation=await cachedRequest('/','navigate');
assert.equal(await navigation.text(),shell,'Offline navigation returns exact self-contained production entry');
const terrain=await cachedRequest('/data/terrain-local.json');assert.equal((await terrain.json()).values.length,196608);
const wide=await cachedRequest('/data/terrain-coverage.json');assert.equal((await wide.json()).values.filter(v=>v===null).length,84734);
const photo=await cachedRequest('/data/orthophoto-local.png');assert.equal((await photo.arrayBuffer()).byteLength,(await stat('dist/data/orthophoto-local.png')).size);
const context=await cachedRequest('/data/gale-context.jpg');assert.equal((await context.arrayBuffer()).byteLength,(await stat('dist/data/gale-context.jpg')).size);
let intercepted=false;listeners.get('fetch')({request:{url:'https://example.org/external',method:'GET',mode:'cors'},respondWith(){intercepted=true;}});assert.equal(intercepted,false);
console.log(JSON.stringify({result:'PASS',checkGroups:['self-contained entry','inline JavaScript syntax','worker lifecycle','offline navigation','terrain cache','imagery cache','regional atlas cache','origin isolation'],cacheName,cachedAssets:cachedCount,entryBytes:Buffer.byteLength(shell),offlineNavigation:'Exact embedded entry returned with network unavailable',terrain:'Local and coverage grids returned from cache',imagery:'Complete PNG returned from cache',verificationLimit:'Node lifecycle simulation; final browser offline reload not reverified after browser automation stopped'},null,2));

