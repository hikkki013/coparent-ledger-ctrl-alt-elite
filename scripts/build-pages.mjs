import './build-standalone.mjs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const output = path.join(projectRoot, 'dist-pages');
await mkdir(output, { recursive: true });
const unexpected = (await readdir(output)).filter(name => name !== 'index.html');
if (unexpected.length) {
  throw new Error(`Remove unrelated files from dist-pages before publishing: ${unexpected.join(', ')}`);
}
const html = await readFile(path.join(projectRoot, 'dist-demo', 'coparent-demo.html'));
await writeFile(path.join(output, 'index.html'), html);
console.log('Built dist-pages/index.html for Cloudflare Pages. Synthetic demo only.');
