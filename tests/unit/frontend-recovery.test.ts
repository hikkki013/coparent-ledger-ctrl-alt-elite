import test from 'node:test';
import assert from 'node:assert/strict';
import type { ExpenseDetail, Reimbursement } from '../../src/domain/types.ts';
import { deriveSettlement } from '../../src/domain/settlement.ts';
import { retainAcknowledgedExpense } from '../../src/features/expenses/commands.ts';

const record = (id: string): ExpenseDetail => ({
  expense: {
    id, householdId: 'sample-household', paidBy: 'alex', reviewerId: 'jordan', childId: 'child-1',
    childAliasSnapshot: 'Child 1', category: 'SCHOOL', description: 'School supplies', merchant: 'Sample shop',
    expenseDate: '2026-11-14', amountCents: 12001, reviewerShareBps: 4000, reviewerOwedCents: 4800,
    currency: 'USD', status: 'APPROVED', submittedAt: '2026-11-14T10:00:00.000Z', replacesExpenseId: null,
    receiptId: null, lockVersion: 3, createdAt: '2026-11-14T09:00:00.000Z',
  },
  reimbursements: [], audit: [],
});
const payment: Reimbursement = {
  id: 'sample-payment', householdId: 'sample-household', expenseId: 'expense-1', fromUserId: 'jordan', toUserId: 'alex',
  amountCents: 2000, paidOn: '2026-11-14', methodLabel: 'Sample cash', note: '', status: 'PENDING',
  createdAt: '2026-11-14T11:00:00.000Z', resolvedAt: null,
};

test('an acknowledged new expense remains available when the following list refresh fails', () => {
  const existing = record('expense-1');
  const acknowledged = record('expense-2');
  const before = [existing];
  const result = retainAcknowledgedExpense(before, acknowledged);
  assert.deepEqual(result.map(item => item.expense.id), ['expense-2', 'expense-1']);
  assert.equal(result[0], acknowledged);
  assert.equal(result[1], existing);
  assert.deepEqual(before.map(item => item.expense.id), ['expense-1']);
});

test('an acknowledged receipt confirmation replaces the pending view without duplicating an expense', () => {
  const old = record('expense-1'); old.reimbursements = [payment];
  const unrelated = record('expense-2');
  const acknowledged = structuredClone(old);
  acknowledged.reimbursements[0] = { ...payment, status: 'CONFIRMED', resolvedAt: '2026-11-14T12:00:00.000Z' };
  acknowledged.expense.lockVersion = 4;
  const result = retainAcknowledgedExpense([old, unrelated], acknowledged);
  assert.equal(result.length, 2);
  assert.equal(result[1], unrelated);
  assert.equal(deriveSettlement(4800, result[0].reimbursements).remainingCents, 2800);
  assert.equal(deriveSettlement(4800, result[0].reimbursements).pendingCents, 0);
  assert.equal(old.reimbursements[0].status, 'PENDING');
});

test('household and child command results cannot erase the currently displayed expenses', () => {
  const before = [record('expense-1')];
  assert.equal(retainAcknowledgedExpense(before, { userId: 'alex', household: null, members: [], children: [] }), before);
  assert.equal(retainAcknowledgedExpense(before, { id: 'child-2', householdId: 'sample-household', alias: 'Child 2' }), before);
});

test('a malformed response is not displayed as an acknowledged financial record', () => {
  const before = [record('expense-1')];
  for (const response of [null, undefined, { expense: null }, { expense: { id: 'expense-1' } }]) {
    assert.equal(retainAcknowledgedExpense(before, response), before);
  }
});
