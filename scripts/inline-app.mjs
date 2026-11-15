import { readFile, writeFile } from 'node:fs/promises';
let html=await readFile('dist/index.html','utf8');
const script=html.match(/<script\b[^>]*src="(\.\/assets\/[^"?]+\.js)"[^>]*><\/script>/);
const style=html.match(/<link\b[^>]*rel="stylesheet"[^>]*href="(\.\/assets\/[^"?]+\.css)"[^>]*>/);
if(!script||!style)throw new Error('Expected Vite entry script and stylesheet');
const js=(await readFile('dist/'+script[1].slice(2),'utf8')).replace(/<\/script/gi,'<\\/script');
const css=(await readFile('dist/'+style[1].slice(2),'utf8')).replace(/<\/style/gi,'<\\/style');
html=html.replace(script[0],()=>`<script type="module">${js}</script>`).replace(style[0],()=>`<style>${css}</style>`);
// These are optional install metadata, not required by the offline boot path.
await writeFile('dist/index.html',html);
console.log(`Self-contained entry: ${(Buffer.byteLength(html)/1024/1024).toFixed(2)} MiB; app, style, data and raster embedded.`);
