import { ReceiptError, rpcError } from './errors.ts';

interface DenoRuntime {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response>): unknown;
}

export interface ReceiptRuntime {
  env(name: string): string | undefined;
  fetch: typeof fetch;
}

export interface BackendConfig { url: string; key: string }
export interface ReceiptContext { actorId: string; config: BackendConfig; runtime: ReceiptRuntime }

const deno = (globalThis as unknown as { Deno?: DenoRuntime }).Deno;
export const defaultRuntime: ReceiptRuntime = {
  env: (name) => deno?.env.get(name),
  fetch: (...args) => globalThis.fetch(...args),
};

export function serve(handler: (request: Request) => Promise<Response>): void {
  deno?.serve(handler);
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function backendConfig(runtime: ReceiptRuntime): BackendConfig {
  const rawUrl = runtime.env('SUPABASE_URL');
  const key = runtime.env('SUPABASE_SERVICE_ROLE_KEY');
  if (!rawUrl || !key) throw new ReceiptError('BACKEND_UNAVAILABLE');
  try {
    const url = new URL(rawUrl);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error();
    return { url: url.href.replace(/\/+$/, ''), key };
  } catch {
    throw new ReceiptError('BACKEND_UNAVAILABLE');
  }
}

export function serviceHeaders(config: BackendConfig): Record<string, string> {
  return { apikey: config.key, Authorization: `Bearer ${config.key}` };
}

export async function requestBackend(context: Pick<ReceiptContext, 'runtime'>, url: string, init: RequestInit): Promise<Response> {
  try {
    return await context.runtime.fetch(url, { ...init, signal: AbortSignal.timeout(15_000), redirect: 'error' });
  } catch {
    throw new ReceiptError('BACKEND_UNAVAILABLE');
  }
}

export async function readJson(response: Response): Promise<unknown> {
  try { return await response.json(); } catch { throw new ReceiptError('BACKEND_UNAVAILABLE'); }
}

export async function callRpc<T>(context: ReceiptContext, name: string, payload: Record<string, unknown>): Promise<T> {
  const response = await requestBackend(context, `${context.config.url}/rest/v1/rpc/${name}`, {
    method: 'POST', headers: { ...serviceHeaders(context.config), 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  const result = await readJson(response);
  if (!response.ok) throw rpcError(result);
  return result as T;
}

async function authenticate(request: Request, runtime: ReceiptRuntime, config: BackendConfig): Promise<string> {
  const authorization = request.headers.get('Authorization');
  if (!authorization || authorization.length > 8192 || !/^Bearer [^\s]+$/i.test(authorization)) throw new ReceiptError('UNAUTHENTICATED');
  const response = await requestBackend({ runtime }, `${config.url}/auth/v1/user`, { method: 'GET', headers: { apikey: config.key, Authorization: authorization } });
  if (!response.ok) throw new ReceiptError(response.status >= 500 ? 'BACKEND_UNAVAILABLE' : 'UNAUTHENTICATED');
  const user = await readJson(response);
  if (typeof user !== 'object' || user === null || !('id' in user) || !isUuid(user.id)) throw new ReceiptError('UNAUTHENTICATED');
  return user.id;
}

/** Bounds bytes before multipart/JSON parsing, including requests without Content-Length. */
export async function readBoundedBody(request: Request, limit: number, errorCode: 'VALIDATION' | 'UPLOAD_INVALID'): Promise<Uint8Array> {
  const declaredLength = request.headers.get('Content-Length');
  if (declaredLength !== null && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > limit)) throw new ReceiptError(errorCode);
  if (!request.body) throw new ReceiptError(errorCode);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      length += item.value.byteLength;
      if (length > limit) {
        await reader.cancel();
        throw new ReceiptError(errorCode);
      }
      chunks.push(item.value);
    }
  } catch (error) {
    if (error instanceof ReceiptError) throw error;
    throw new ReceiptError(errorCode);
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

export async function handleReceiptRequest(
  request: Request,
  runtime: ReceiptRuntime,
  action: (context: ReceiptContext) => Promise<unknown>,
): Promise<Response> {
  const headers = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin' });
  const origin = request.headers.get('Origin');
  const allowed = (runtime.env('ALLOWED_ORIGINS') ?? 'http://localhost:5173').split(',').map((entry) => entry.trim()).filter(Boolean);
  try {
    if (origin && !allowed.includes(origin)) throw new ReceiptError('FORBIDDEN');
    if (origin) headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'authorization, apikey, content-type, x-client-info');
    headers.set('Access-Control-Max-Age', '600');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') {
      headers.set('Allow', 'POST, OPTIONS');
      throw new ReceiptError('VALIDATION', 405);
    }
    const config = backendConfig(runtime);
    const actorId = await authenticate(request, runtime, config);
    const result = await action({ actorId, config, runtime });
    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (error) {
    const safe = error instanceof ReceiptError ? error : new ReceiptError('BACKEND_UNAVAILABLE');
    return new Response(JSON.stringify({ code: safe.code, message: safe.message }), { status: safe.status, headers });
  }
}
