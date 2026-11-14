import test from 'node:test';
import assert from 'node:assert/strict';
import { DemoAccess, TRIAL_MS } from '../../src/data/demo-access.ts';
import { DemoLedger } from '../../src/data/demo-ledger.ts';

function storage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
}

test('trial expires after fourteen days; test access and reset persist separately', () => {
  const store = storage(); let now = 1_000_000;
  const access = new DemoAccess(store, () => now);
  assert.equal(access.status(), 'trial'); assert.equal(access.canCreate(), true);
  now += TRIAL_MS - 1; assert.equal(access.canCreate(), true);
  now += 1; assert.equal(access.status(), 'expired'); assert.equal(access.canCreate(), false);
  access.enableTestAccess(); assert.equal(new DemoAccess(store, () => now).status(), 'test-access');
  access.reset(); assert.equal(new DemoAccess(store, () => now).status(), 'trial');
  access.simulateExpiry(); assert.equal(access.status(), 'expired');
});

test('paywall blocks new draft but preserves existing history and receipt confirmation', async () => {
  const access = new DemoAccess(storage(), () => 1_000_000);
  const ledger = new DemoLedger(storage(), 'alex', access);
  const before = await ledger.getExpense('e1');
  assert.equal(before.reimbursements.find(p => p.status === 'PENDING')?.amountCents, 1000);
  access.simulateExpiry();
  await assert.rejects(ledger.createDraft({ childId: 'child-1', category: 'SCHOOL', description: 'A new book', merchant: '', expenseDate: '2026-11-14', amountCents: 2000, reviewerShareBps: 5000 }, { idempotencyKey: 'blocked' }), /trial|test access/i);
  const stillVisible = await ledger.getExpense('e1');
  assert.equal(stillVisible.audit.length, before.audit.length);
  assert.ok((await ledger.exportExpensesCsv()).includes('School supplies'));
  const pending = stillVisible.reimbursements.find(p => p.status === 'PENDING')!;
  const confirmed = await ledger.resolveReimbursement(pending.id, 'CONFIRM', '', { expectedRevision: stillVisible.expense.lockVersion, idempotencyKey: 'confirm-existing' });
  assert.equal(confirmed.reimbursements.find(p => p.id === pending.id)?.status, 'CONFIRMED');
  access.enableTestAccess();
  const created = await ledger.createDraft({ childId: 'child-1', category: 'SCHOOL', description: 'A new book', merchant: '', expenseDate: '2026-11-14', amountCents: 2000, reviewerShareBps: 5000 }, { idempotencyKey: 'allowed' });
  assert.equal(created.expense.description, 'A new book');
});
