import {createRequire} from 'node:module';
import {readdir} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url);
let ts;
try { ts=require(process.env.TYPESCRIPT_PATH || 'typescript'); }
catch { console.error('BLOCKED: install development dependencies first (npm install), or provide TYPESCRIPT_PATH to an installed official TypeScript compiler.'); process.exit(2); }
const root=path.resolve(import.meta.dirname,'..');
async function files(dir) {const found=[];for(const entry of await readdir(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())found.push(...await files(full));else if(/\.tsx?$/.test(entry.name)&&entry.name!=='vite-env.d.ts')found.push(full);}return found;}
const options={target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,jsx:ts.JsxEmit.ReactJSX,allowImportingTsExtensions:true,noEmit:true,strict:true,skipLibCheck:true,esModuleInterop:true,types:[]};
if(process.env.TYPECHECK_DEPS){const deps=path.resolve(process.env.TYPECHECK_DEPS);options.paths={'react':[path.join(deps,'@types/react/index.d.ts')],'react/jsx-runtime':[path.join(deps,'@types/react/jsx-runtime.d.ts')],'react-dom':[path.join(deps,'@types/react-dom/index.d.ts')],'react-dom/client':[path.join(deps,'@types/react-dom/client.d.ts')],'csstype':[path.join(deps,'csstype/index.d.ts')]};}
const roots=await files(path.join(root,'src'));
const program=ts.createProgram(roots,options);
const diagnostics=ts.getPreEmitDiagnostics(program);
if(diagnostics.length){console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>root,getNewLine:()=> '\n'}));process.exit(1);}
console.log(`TypeScript ${ts.version}: semantic check passed for ${roots.length} source files. This is not a Vite production build or browser integration test.`);
