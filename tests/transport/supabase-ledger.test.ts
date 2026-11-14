import test from 'node:test';
import assert from 'node:assert/strict';
import { SupabaseLedger } from '../../src/data/supabase-ledger.ts';
import type { RpcTransport } from '../../src/data/supabase-ledger.ts';

test('resolution sends parent expense revision without accepting an actor from UI', async () => {
  const calls: unknown[] = [];
  const transport: RpcTransport = {
    async rpc<T>(name: string, args: Record<string, unknown>) { calls.push({ name, args }); return {} as T; },
    async upload<T>() { return {} as T; },
    async receiptAccess() { return { url: 'https://test.invalid/receipt', expiresAt: '2026-11-14T00:00:00Z' }; },
  };
  await new SupabaseLedger(transport).resolveReimbursement('payment-1', 'CONFIRM', '', {expectedRevision: 7, idempotencyKey: 'same-key'});
  assert.deepEqual(calls, [{name:'ledger_command',args:{p_operation:'resolveReimbursement',p_payload:{reportId:'payment-1',decision:'CONFIRM',note:''},p_expected_revision:7,p_idempotency_key:'same-key'}}]);
});

test('private reads request a specific expense rather than a client-controlled household', async () => {
  let observed: unknown;
  const transport: RpcTransport = { async rpc<T>(name,args) { observed={name,args}; return [] as T; }, async upload<T>() { return {} as T; }, async receiptAccess() { throw Error('unused'); } };
  await new SupabaseLedger(transport).getExpense('expense-1');
  assert.deepEqual(observed, {name:'ledger_read',args:{p_operation:'getExpense',p_id:'expense-1'}});
});

test('invite creation bypasses replay cache and passes only intended email and origin', async () => {
  const calls: unknown[] = [];
  const transport: RpcTransport = { async rpc<T>(name,args) { calls.push({name,args}); return {} as T; }, async upload<T>() { return {} as T; }, async receiptAccess() { throw Error('unused'); } };
  const ledger = new SupabaseLedger(transport, 'https://ledger.example');
  await ledger.createInvite('second@example.test'); await ledger.createInvite('second@example.test');
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0], {name:'ledger_create_invite',args:{p_email:'second@example.test',p_base_url:'https://ledger.example'}});
});
