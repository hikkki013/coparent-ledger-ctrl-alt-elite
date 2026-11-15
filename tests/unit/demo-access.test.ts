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

test('replaying an already-created draft remains safe after trial expiration', async () => {
  const access = new DemoAccess(storage(), () => 1_000_000);
  const ledger = new DemoLedger(storage(), 'alex', access);
  const input = { childId: 'child-1', category: 'SCHOOL' as const, description: 'Replay sample', merchant: '', expenseDate: '2026-11-14', amountCents: 2500, reviewerShareBps: 5000 };
  const first = await ledger.createDraft(input, { idempotencyKey: 'same-key' });
  access.simulateExpiry();
  const replay = await ledger.createDraft(input, { idempotencyKey: 'same-key' });
  assert.equal(replay.expense.id, first.expense.id);
  assert.equal((await ledger.listExpenses()).filter(row => row.expense.description === input.description).length, 1);
});

for (const { actor, expenseId } of [{ actor: 'alex' as const, expenseId: 'e3' }, { actor: 'jordan' as const, expenseId: 'e4' }]) {
  test(`expired trial blocks correction of ${expenseId} without withdrawing or changing history`, async () => {
    const access = new DemoAccess(storage(), () => 1_000_000);
    const ledgerStore = storage();
    const ledger = new DemoLedger(ledgerStore, actor, access);
    const before = await ledger.getExpense(expenseId);
    const meta = { expectedRevision: before.expense.lockVersion, idempotencyKey: 'correction-after-expiry' };
    const savedBefore = ledgerStore.getItem('coparent-ledger.demo.v1');
    access.simulateExpiry();

    await assert.rejects(ledger.replaceExpenseWithDraft(expenseId, 'Correct the purchase details', meta), /trial|test access/i);
    assert.equal(ledgerStore.getItem('coparent-ledger.demo.v1'), savedBefore);
    assert.deepEqual(await ledger.getExpense(expenseId), before);

    access.enableTestAccess();
    const replacement = await ledger.replaceExpenseWithDraft(expenseId, 'Correct the purchase details', meta);
    assert.equal(replacement.expense.status, 'DRAFT');
    assert.equal(replacement.expense.replacesExpenseId, expenseId);
    assert.equal(replacement.expense.receiptId, null);
    assert.equal((await ledger.getExpense(expenseId)).expense.status, 'WITHDRAWN');
  });
}

test('an existing correction replays after expiry without creating or withdrawing again', async () => {
  const access = new DemoAccess(storage(), () => 1_000_000);
  const ledgerStore = storage();
  const ledger = new DemoLedger(ledgerStore, 'alex', access);
  const before = await ledger.getExpense('e3');
  const meta = { expectedRevision: before.expense.lockVersion, idempotencyKey: 'successful-correction' };
  const first = await ledger.replaceExpenseWithDraft('e3', 'Update purchase details', meta);
  const savedAfter = ledgerStore.getItem('coparent-ledger.demo.v1');
  access.simulateExpiry();
  const replay = await ledger.replaceExpenseWithDraft('e3', 'Update purchase details', meta);
  assert.deepEqual(replay, first);
  assert.equal(ledgerStore.getItem('coparent-ledger.demo.v1'), savedAfter);
});
