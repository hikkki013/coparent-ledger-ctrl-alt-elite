import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReceiptBytes } from '../../supabase/functions/_shared/receipt-validation.ts';
import { handleUpload } from '../../supabase/functions/receipt-upload/index.ts';
import { handleAccess } from '../../supabase/functions/receipt-access/index.ts';
import type { ReceiptRuntime } from '../../supabase/functions/_shared/http.ts';

const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0xff, 0xd9]);
const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const webp = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 4, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);

test('accepts a JPEG only with its matching declared MIME type', () => {
  assert.deepEqual(validateReceiptBytes(jpeg, 'image/jpeg'), { mimeType: 'image/jpeg', extension: 'jpg' });
});

test('accepts a PNG signature with matching MIME type', () => {
  assert.deepEqual(validateReceiptBytes(png, 'image/png'), { mimeType: 'image/png', extension: 'png' });
});

test('accepts a WEBP RIFF signature with matching MIME type', () => {
  assert.deepEqual(validateReceiptBytes(webp, 'image/webp'), { mimeType: 'image/webp', extension: 'webp' });
});

test('rejects a renamed file whose MIME disagrees with its bytes', () => {
  assert.throws(() => validateReceiptBytes(jpeg, 'image/png'), { code: 'UPLOAD_INVALID' });
});

test('rejects active documents and unsupported MIME types', () => {
  for (const mime of ['image/svg+xml', 'text/html', 'application/pdf', 'application/octet-stream', '']) {
    assert.throws(() => validateReceiptBytes(png, mime), { code: 'UPLOAD_INVALID' });
  }
});

test('rejects missing, truncated, and unknown signatures', () => {
  for (const bytes of [new Uint8Array(), Uint8Array.from([0xff, 0xd8]), new TextEncoder().encode('<script>alert(1)</script>')]) {
    assert.throws(() => validateReceiptBytes(bytes, 'image/jpeg'), { code: 'UPLOAD_INVALID' });
  }
});

test('rejects RIFF data which is not WEBP', () => {
  const wave = new Uint8Array(webp);
  wave.set(new TextEncoder().encode('WAVE'), 8);
  assert.throws(() => validateReceiptBytes(wave, 'image/webp'), { code: 'UPLOAD_INVALID' });
});

test('accepts the 5 MiB limit and rejects one byte above it', () => {
  const maximum = new Uint8Array(5 * 1024 * 1024);
  maximum.set(png);
  assert.equal(validateReceiptBytes(maximum, 'image/png').mimeType, 'image/png');
  const oversized = new Uint8Array(5 * 1024 * 1024 + 1);
  oversized.set(png);
  assert.throws(() => validateReceiptBytes(oversized, 'image/png'), { code: 'UPLOAD_INVALID' });
});

const actorId = '11111111-1111-4111-8111-111111111111';
const draftId = '22222222-2222-4222-8222-222222222222';
const previousReceiptId = '33333333-3333-4333-8333-333333333333';
const previousPath = '44444444-4444-4444-8444-444444444444.png';
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });

function fakeBackend(options: { preflightDenied?: boolean; finalizeError?: string; lostFinalizeResponse?: boolean; replay?: boolean; lookupDenied?: boolean } = {}) {
  const objects = new Set<string>([previousPath]);
  const calls: { url: string; payload: Record<string, unknown> | null }[] = [];
  let committedReceiptId: string | null = null;
  let committedPath: string | null = null;
  const runtime: ReceiptRuntime = {
    env: (name) => ({ SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_ROLE_KEY: 'server-secret', ALLOWED_ORIGINS: 'http://localhost:5173' })[name],
    fetch: async (input, init) => {
      const url = String(input);
      const payload = typeof init?.body === 'string' ? JSON.parse(init.body) : null;
      calls.push({ url, payload });
      if (url.endsWith('/auth/v1/user')) {
        assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer session-token');
        return json({ id: actorId });
      }
      assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer server-secret');
      if (url.endsWith('/ledger_receipt_preflight')) {
        assert.deepEqual(payload, { p_actor_id: actorId, p_draft_id: draftId });
        return options.preflightDenied ? json({ message: 'FORBIDDEN: private details' }, 403) : json({ ok: true });
      }
      if (url.includes('/storage/v1/object/receipts/') && init?.method === 'POST') {
        const path = url.split('/').at(-1)!;
        assert.match(path, /^[0-9a-f-]{36}\.png$/);
        assert.equal(new Headers(init.headers).get('x-upsert'), 'false');
        objects.add(path);
        return json({ Key: `receipts/${path}` });
      }
      if (url.endsWith('/ledger_receipt_finalize')) {
        assert.equal(payload.p_actor_id, actorId);
        assert.equal(payload.p_draft_id, draftId);
        assert.equal(payload.p_expected_revision, 2);
        assert.equal(payload.p_mime_type, 'image/png');
        assert.equal(payload.p_size_bytes, 8);
        assert.match(payload.p_sha256, /^[a-f0-9]{64}$/);
        if (options.finalizeError) return json({ message: `${options.finalizeError}: sensitive SQL text` }, 400);
        committedReceiptId = options.replay ? previousReceiptId : payload.p_receipt_id;
        committedPath = options.replay ? previousPath : payload.p_object_path;
        if (options.lostFinalizeResponse) throw new Error('Response lost after database commit');
        return json({ expense: { id: draftId, receiptId: committedReceiptId }, reimbursements: [], audit: [] });
      }
      if (url.endsWith('/storage/v1/object/receipts') && init?.method === 'DELETE') {
        for (const path of payload.prefixes as string[]) objects.delete(path);
        return json([]);
      }
      if (url.endsWith('/ledger_receipt_lookup')) {
        assert.deepEqual(payload, { p_actor_id: actorId, p_receipt_id: previousReceiptId });
        return options.lookupDenied ? json({ message: 'FORBIDDEN' }, 403) : json({ objectPath: previousPath, mimeType: 'image/png' });
      }
      if (url.endsWith(`/storage/v1/object/sign/receipts/${previousPath}`)) {
        assert.deepEqual(payload, { expiresIn: 60 });
        return json({ signedURL: `/object/sign/receipts/${previousPath}?token=short-lived` });
      }
      throw new Error(`Unexpected fake backend route: ${url}`);
    },
  };
  return { runtime, objects, calls, get committedPath() { return committedPath; } };
}

function uploadRequest(): Request {
  const form = new FormData();
  form.set('draftId', draftId);
  form.set('expectedRevision', '2');
  form.set('idempotencyKey', 'upload-1');
  form.set('file', new File([png], 'private-child-name.png', { type: 'image/png' }));
  return new Request('https://edge.test/receipt-upload', { method: 'POST', headers: { Authorization: 'Bearer session-token', Origin: 'http://localhost:5173' }, body: form });
}

function accessRequest(): Request {
  return new Request('https://edge.test/receipt-access', { method: 'POST', headers: { Authorization: 'Bearer session-token', 'Content-Type': 'application/json' }, body: JSON.stringify({ receiptId: previousReceiptId }) });
}

test('requires a bearer session before reading any receipt data', async () => {
  const backend = fakeBackend();
  const response = await handleAccess(new Request('https://edge.test/receipt-access', { method: 'POST' }), backend.runtime);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).code, 'UNAUTHENTICATED');
  assert.equal(backend.calls.length, 0);
});

test('rejects disallowed browser origins before calling the backend', async () => {
  const backend = fakeBackend();
  const response = await handleAccess(new Request('https://edge.test/receipt-access', { method: 'OPTIONS', headers: { Origin: 'https://attacker.test' } }), backend.runtime);
  assert.equal(response.status, 403);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
  assert.equal(backend.calls.length, 0);
});

test('does not upload a file when current ownership preflight denies access', async () => {
  const backend = fakeBackend({ preflightDenied: true });
  const response = await handleUpload(uploadRequest(), backend.runtime);
  assert.equal(response.status, 403);
  assert.deepEqual([...backend.objects], [previousPath]);
  assert.equal(backend.calls.some((call) => call.url.includes('/storage/')), false);
});

test('saves a valid receipt with a session-derived actor and a random storage path', async () => {
  const backend = fakeBackend();
  const response = await handleUpload(uploadRequest(), backend.runtime);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).expense.id, draftId);
  assert.equal(backend.objects.size, 2);
  assert.ok(backend.committedPath && backend.objects.has(backend.committedPath));
  assert.equal(backend.calls.some((call) => call.url.includes('private-child-name')), false);
});

test('removes only this invocation upload when finalization rejects a stale revision', async () => {
  const backend = fakeBackend({ finalizeError: 'STALE_REVISION' });
  const response = await handleUpload(uploadRequest(), backend.runtime);
  assert.equal(response.status, 409);
  const error = await response.json();
  assert.equal(error.code, 'STALE_REVISION');
  assert.equal(error.message.includes('sensitive'), false);
  assert.deepEqual([...backend.objects], [previousPath]);
});

test('cleans the extra upload on replay without deleting the previously saved receipt', async () => {
  const backend = fakeBackend({ replay: true });
  const response = await handleUpload(uploadRequest(), backend.runtime);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).expense.receiptId, previousReceiptId);
  assert.deepEqual([...backend.objects], [previousPath]);
});

test('preserves a receipt when the finalizer commits but its network response is lost', async () => {
  const backend = fakeBackend({ lostFinalizeResponse: true });
  const response = await handleUpload(uploadRequest(), backend.runtime);
  assert.equal(response.status, 503);
  assert.ok(backend.committedPath && backend.objects.has(backend.committedPath));
});

test('does not sign another household receipt when lookup denies access', async () => {
  const backend = fakeBackend({ lookupDenied: true });
  const response = await handleAccess(accessRequest(), backend.runtime);
  assert.equal(response.status, 403);
  assert.equal(backend.calls.some((call) => call.url.includes('/object/sign/')), false);
});

test('returns a no-store receipt link signed for 60 seconds after authorized lookup', async () => {
  const backend = fakeBackend();
  const started = Date.now();
  const response = await handleAccess(accessRequest(), backend.runtime);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const access = await response.json();
  assert.equal(access.url, `https://supabase.test/storage/v1/object/sign/receipts/${previousPath}?token=short-lived`);
  assert.ok(Date.parse(access.expiresAt) >= started + 59_000 && Date.parse(access.expiresAt) <= Date.now() + 60_000);
});
