// Runs against a dedicated, migrated Supabase TEST project. Creates synthetic accounts;
// it never sends invitation email and never deletes an existing household.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const url = process.env.SUPABASE_TEST_URL?.replace(/\/$/, '');
const anon = process.env.SUPABASE_TEST_ANON_KEY;
const service = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
if (!url || !anon || !service || process.env.SUPABASE_TEST_ALLOW_MUTATION !== 'yes') {
  console.error('BLOCKED: Set SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY, SUPABASE_TEST_SERVICE_ROLE_KEY and SUPABASE_TEST_ALLOW_MUTATION=yes for a dedicated test project. No live checks ran.');
  process.exit(2);
}
const run = randomUUID().slice(0, 8);
const headers = (token = anon) => ({ apikey: anon, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
async function request(path, { token, method = 'POST', body, key = anon } = {}) {
  const response = await fetch(`${url}${path}`, { method, headers: { ...headers(token), apikey: key }, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await response.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { ok: response.ok, status: response.status, data };
}
function success(result) { assert.ok(result.ok, JSON.stringify(result.data)); return result.data; }
function denied(result, code) { assert.equal(result.ok, false, 'Request unexpectedly succeeded'); if (code) assert.match(JSON.stringify(result.data), new RegExp(code)); }
async function account(label) {
  const email = `coparent-${run}-${label}@example.invalid`;
  const password = `T3st-${randomUUID()}!`;
  const user = success(await request('/auth/v1/admin/users', { token: service, key: service, body: { email, password, email_confirm: true, user_metadata: { display_name: `Synthetic ${label}` } } }));
  const session = success(await request('/auth/v1/token?grant_type=password', { body: { email, password } }));
  return { id: user.id, email, token: session.access_token };
}
const A = await account('A'); const B = await account('B'); const C = await account('C');
const rpc = (who, name, body) => request(`/rest/v1/rpc/${name}`, { token: who?.token, body });
const command = (who, operation, payload = {}, revision = null, key = randomUUID()) => rpc(who, 'ledger_command', { p_operation: operation, p_payload: payload, p_expected_revision: revision, p_idempotency_key: key });
const read = (who, operation, id = null) => rpc(who, 'ledger_read', { p_operation: operation, p_id: id });
let passed = 0;
async function check(name, fn) { await fn(); passed++; console.log(`PASSED: ${name}`); }
let context, child, draft, approved, pending;
await check('Real auth, create household replay, and email-bound one-use invite', async () => {
  const key = randomUUID();
  context = success(await command(A, 'createHousehold', {}, null, key));
  assert.deepEqual(success(await command(A, 'createHousehold', {}, null, key)), context);
  const invite = success(await rpc(A, 'ledger_create_invite', { p_email: B.email, p_base_url: 'http://localhost:5173' }));
  const token = invite.url.split('/').at(-1);
  denied(await command(C, 'acceptInvite', { token }), 'INVITE_INVALID');
  const acceptKey = randomUUID();
  const joined = success(await command(B, 'acceptInvite', { token }, null, acceptKey));
  assert.equal(joined.members.length, 2);
  assert.deepEqual(success(await command(B, 'acceptInvite', { token }, null, acceptKey)), joined);
  denied(await command(C, 'acceptInvite', { token }), 'INVITE_INVALID');
  denied(await rpc(A, 'ledger_create_invite', { p_email: C.email, p_base_url: 'http://localhost:5173' }), 'HOUSEHOLD_FULL');
  success(await command(C, 'createHousehold'));
  child = success(await command(A, 'createChild', { alias: 'Child 1' }));
});
const input = () => ({ childId: child.id, category: 'SCHOOL', description: 'SAMPLE school supplies', merchant: 'SAMPLE store', expenseDate: '2026-01-15', amountCents: 12001, reviewerShareBps: 4000 });
await check('Private drafts, audit and direct table access; no financial writes', async () => {
  draft = success(await command(A, 'createDraft', { input: input() }));
  assert.equal(draft.expense.reviewerOwedCents, 4800);
  assert.equal(success(await read(B, 'listExpenses')).length, 0);
  denied(await read(B, 'getExpense', draft.expense.id), 'FORBIDDEN');
  denied(await read(C, 'getExpense', draft.expense.id), 'FORBIDDEN');
  denied(await read(null, 'getExpense', draft.expense.id));
  for (const table of ['expenses', 'audit_events', 'receipts', 'reimbursements']) {
    assert.deepEqual(success(await request(`/rest/v1/${table}?select=*`, { token: C.token, method: 'GET' })), []);
  }
  assert.deepEqual(success(await request('/rest/v1/audit_events?select=*', { token: B.token, method: 'GET' })), []);
  denied(await request('/rest/v1/expenses', { token: A.token, body: { household_id: context.household.id } }));
  denied(await request('/rest/v1/household_members', { token: A.token, body: { household_id: context.household.id, user_id: C.id, slot: 2 } }));
  denied(await request('/rest/v1/command_results?select=*', { token: B.token, method: 'GET' }));
});
await check('Exact integer validation and cross-household child rejection', async () => {
  for (const changes of [{ amountCents: -1 }, { amountCents: 1.5 }, { amountCents: 100000001 }, { reviewerShareBps: 10001 }, { expenseDate: '2026-02-31' }]) {
    denied(await command(A, 'createDraft', { input: { ...input(), ...changes } }), 'VALIDATION');
  }
  const foreignChild = success(await command(C, 'createChild', { alias: 'Child C' }));
  denied(await command(A, 'createDraft', { input: { ...input(), childId: foreignChild.id } }), 'FORBIDDEN');
  const penny = success(await command(A, 'createDraft', { input: { ...input(), amountCents: 1, reviewerShareBps: 5000 } }));
  assert.equal(penny.expense.reviewerOwedCents, 1);
});
await check('Submit freezes content; payer cannot approve; stale updates rejected', async () => {
  pending = success(await command(A, 'submitExpense', { id: draft.expense.id }, draft.expense.lockVersion));
  denied(await command(A, 'reviewExpense', { id: pending.expense.id, decision: 'APPROVE', note: '' }, pending.expense.lockVersion), 'FORBIDDEN');
  denied(await command(A, 'saveDraft', { id: pending.expense.id, input: input() }, pending.expense.lockVersion), 'INVALID_STATE');
  denied(await command(B, 'reviewExpense', { id: pending.expense.id, decision: 'APPROVE', note: '' }, 0), 'STALE_REVISION');
  approved = success(await command(B, 'reviewExpense', { id: pending.expense.id, decision: 'APPROVE', note: '' }, pending.expense.lockVersion));
  denied(await command(A, 'withdrawExpense', { id: approved.expense.id, reason: 'Wrong amount' }, approved.expense.lockVersion), 'INVALID_STATE');
  denied(await command(A, 'replaceExpenseWithDraft', { id: approved.expense.id, reason: 'Wrong amount' }, approved.expense.lockVersion), 'INVALID_STATE');
});
await check('Report reserves without settling; only creditor confirms; replay exactly once', async () => {
  const payload = { expenseId: approved.expense.id, amountCents: 2000, paidOn: '2026-01-16', methodLabel: 'External transfer', note: 'SAMPLE' };
  denied(await command(A, 'reportReimbursement', payload, approved.expense.lockVersion), 'FORBIDDEN');
  const reportKey = randomUUID();
  let detail = success(await command(B, 'reportReimbursement', payload, approved.expense.lockVersion, reportKey));
  assert.deepEqual(success(await command(B, 'reportReimbursement', payload, approved.expense.lockVersion, reportKey)), detail);
  denied(await command(B, 'reportReimbursement', { ...payload, amountCents: 2001 }, approved.expense.lockVersion, reportKey), 'IDEMPOTENCY_CONFLICT');
  assert.equal(detail.reimbursements[0].status, 'PENDING');
  const resolve = { reportId: detail.reimbursements[0].id, decision: 'CONFIRM', note: '' };
  denied(await command(B, 'resolveReimbursement', resolve, detail.expense.lockVersion), 'FORBIDDEN');
  const key = randomUUID(); const revision = detail.expense.lockVersion;
  detail = success(await command(A, 'resolveReimbursement', resolve, revision, key));
  assert.deepEqual(success(await command(A, 'resolveReimbursement', resolve, revision, key)), detail);
  assert.equal(detail.reimbursements.filter(x => x.status === 'CONFIRMED').reduce((s, x) => s + x.amountCents, 0), 2000);
  assert.equal(detail.expense.reviewerOwedCents - 2000, 2800);
  denied(await command(A, 'resolveReimbursement', resolve, detail.expense.lockVersion), 'INVALID_STATE');
  approved = detail;
});
await check('Concurrent reports cannot reserve more than remaining; failures leave no audit', async () => {
  const before = approved.audit.length;
  const results = await Promise.all([1700, 1600].map(amountCents => command(B, 'reportReimbursement', { expenseId: approved.expense.id, amountCents, paidOn: '2026-01-17', methodLabel: '', note: '' }, approved.expense.lockVersion)));
  assert.equal(results.filter(x => x.ok).length, 1);
  const detail = success(await read(A, 'getExpense', approved.expense.id));
  const reserved = detail.reimbursements.filter(x => x.status !== 'REJECTED').reduce((s, x) => s + x.amountCents, 0);
  assert.ok(reserved <= detail.expense.reviewerOwedCents);
  assert.equal(detail.audit.length, before + 1);
});
await check('Correction withdraws old snapshot and produces a private receipt-free draft', async () => {
  let expense = success(await command(A, 'createDraft', { input: input() }));
  expense = success(await command(A, 'submitExpense', { id: expense.expense.id }, expense.expense.lockVersion));
  expense = success(await command(B, 'reviewExpense', { id: expense.expense.id, decision: 'DISPUTE', note: 'Please clarify this SAMPLE charge.' }, expense.expense.lockVersion));
  const corrected = success(await command(A, 'replaceExpenseWithDraft', { id: expense.expense.id, reason: 'SAMPLE correction' }, expense.expense.lockVersion));
  assert.equal(corrected.expense.status, 'DRAFT'); assert.equal(corrected.expense.receiptId, null);
  assert.equal(corrected.expense.replacesExpenseId, expense.expense.id);
  assert.equal(success(await read(B, 'getExpense', expense.expense.id)).expense.status, 'WITHDRAWN');
  denied(await read(B, 'getExpense', corrected.expense.id), 'FORBIDDEN');
  const withdrawn = success(await command(A, 'withdrawExpense', { id: corrected.expense.id, reason: '' }, corrected.expense.lockVersion));
  assert.equal(success(await read(A, 'getExpense', withdrawn.expense.id)).expense.status, 'WITHDRAWN');
  denied(await read(B, 'getExpense', withdrawn.expense.id), 'FORBIDDEN');
});
await check('Edge receipt upload/signing, private draft visibility and frozen storage', async () => {
  let expense = success(await command(A, 'createDraft', { input: input() }));
  // Transparent one-pixel synthetic PNG; no personal material is sent.
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/XioAAAAASUVORK5CYII=', 'base64');
  const upload = async (who, bytes, mime, key = randomUUID()) => {
    const form = new FormData(); form.set('draftId', expense.expense.id); form.set('expectedRevision', String(expense.expense.lockVersion)); form.set('idempotencyKey', key); form.set('file', new Blob([bytes], { type: mime }), 'SAMPLE.png');
    const response = await fetch(`${url}/functions/v1/receipt-upload`, { method: 'POST', headers: { apikey: anon, Authorization: `Bearer ${who.token}` }, body: form });
    return { ok: response.ok, status: response.status, data: await response.json() };
  };
  denied(await upload(B, png, 'image/png'));
  denied(await upload(A, Buffer.from('<svg/>'), 'image/png'));
  expense = success(await upload(A, png, 'image/png'));
  const receiptId = expense.expense.receiptId; assert.ok(receiptId);
  const receiptAccess = who => request('/functions/v1/receipt-access', { token: who.token, body: { receiptId } });
  denied(await receiptAccess(B));
  const access = success(await receiptAccess(A)); assert.ok(access.url); assert.ok(Date.parse(access.expiresAt) <= Date.now() + 61000);
  const row = success(await request(`/rest/v1/receipts?id=eq.${receiptId}&select=object_path`, { token: service, key: service, method: 'GET' }))[0];
  assert.ok(row.object_path);
  const publicDownload = await fetch(`${url}/storage/v1/object/public/receipts/${row.object_path}`);
  assert.equal(publicDownload.ok, false, 'Private receipt must not have public access');
  const authorizedDownload = await fetch(access.url);
  assert.ok(authorizedDownload.ok);
  assert.deepEqual(Buffer.from(await authorizedDownload.arrayBuffer()), png);
  expense = success(await command(A, 'submitExpense', { id: expense.expense.id }, expense.expense.lockVersion));
  success(await receiptAccess(B));
  const overwrite = await fetch(`${url}/storage/v1/object/receipts/${row.object_path}`, { method: 'PUT', headers: { apikey: anon, Authorization: `Bearer ${A.token}`, 'Content-Type': 'image/png' }, body: png });
  assert.equal(overwrite.ok, false);
  // Storage may answer 200 with zero deleted rows when RLS hides every target.
  // Verify the outcome instead of assuming a particular status code for a no-op.
  await request(`/storage/v1/object/receipts`, { token: A.token, method: 'DELETE', body: { prefixes: [row.object_path] } });
  const afterDeniedDelete = success(await receiptAccess(B));
  const retained = await fetch(afterDeniedDelete.url, { headers: { 'Cache-Control': 'no-cache' } });
  assert.ok(retained.ok);
  assert.deepEqual(Buffer.from(await retained.arrayBuffer()), png);
});
console.log(`PASSED: ${passed} live integration groups. Synthetic fixture prefix: coparent-${run}. Fixtures remain in the dedicated test project; no existing data was deleted.`);
