import './build-demo.mjs';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../dist-demo');
const receipt='data:image/svg+xml;base64,'+Buffer.from(await readFile(path.join(root,'samples/receipt.svg'))).toString('base64');
const imports={};
function rewrite(source,dir) {
  return source.replace(/(from\s+['"])([^'"]+)(['"])/g,(match,start,spec,end)=>{
    if(spec.startsWith('.')) return start+'coparent/'+path.posix.normalize(path.posix.join(dir,spec))+end;
    if(spec.startsWith('/src/')) return start+'coparent/'+spec.slice(5)+end;
    return match;
  }).replaceAll('/samples/receipt.svg',receipt);
}
for (const dir of ['domain','data']) {
  for(const file of await readdir(path.join(root,'src',dir))) {
    if(!file.endsWith('.js'))continue;
    const source=rewrite(await readFile(path.join(root,'src',dir,file),'utf8'),dir);
    imports[`coparent/${dir}/${file}`]='data:text/javascript;base64,'+Buffer.from(source).toString('base64');
  }
}
const css=await readFile(path.join(root,'base-demo.css'),'utf8');
const app=rewrite(await readFile(path.join(root,'app.js'),'utf8'),'');
const html=`<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>CoParent Ledger · Offline synthetic demo</title><style>${css}</style><script type="importmap">${JSON.stringify({imports}).replaceAll('<','\\u003c')}</script></head><body><div id="app">Loading synthetic demo…</div><script type="module">${app}</script></body></html>`;
await writeFile(path.join(root,'coparent-demo.html'),html);
console.log('Built dist-demo/coparent-demo.html: self-contained synthetic demo; open directly in a current browser.');
