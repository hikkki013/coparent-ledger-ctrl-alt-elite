import './build-demo.mjs';
import http from 'node:http';
import path from 'node:path';
import {readFile,stat} from 'node:fs/promises';
const root = path.resolve(import.meta.dirname,'../dist-demo');
const port = Number(process.env.DEMO_PORT || 4173);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const server = http.createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    // Only the synthetic /demo route and its static modules are served here.
    const requested = pathname === '/' || pathname === '/demo' ? '/index.html' : pathname;
    const file = path.resolve(root, '.' + requested);
    if (!file.startsWith(root + path.sep)) { res.writeHead(403);res.end('Forbidden');return; }
    const data = await readFile(file);
    res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"});
    res.end(data);
  } catch {res.writeHead(404,{'Content-Type':'text/plain'});res.end('Only the standalone synthetic demo is available here. Open /demo.');}
});
server.listen(port,'127.0.0.1',() => console.log(`Synthetic demo: http://127.0.0.1:${port}/demo (local browser session only)`));
