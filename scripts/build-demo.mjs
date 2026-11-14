import { mkdir, readdir, readFile, writeFile, cp } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'dist-demo');
await mkdir(out, {recursive:true});
for (const folder of ['domain', 'data']) {
  await mkdir(path.join(out, 'src', folder), {recursive:true});
  for (const name of await readdir(path.join(root,'src',folder))) {
    if (!name.endsWith('.ts') || name === 'supabase-ledger.ts') continue;
    const source = await readFile(path.join(root,'src',folder,name),'utf8');
    const js = stripTypeScriptTypes(source, {mode:'strip'}).replace(/(from\s+['"][^'"]+)\.ts(['"])/g,'$1.js$2');
    await writeFile(path.join(out,'src',folder,name.replace(/\.ts$/,'.js')),js);
  }
}
await cp(path.join(root,'demo'),out,{recursive:true});
await cp(path.join(root,'public'),out,{recursive:true});
console.log('Built standalone synthetic demo in dist-demo. No real authentication or backend is included.');
