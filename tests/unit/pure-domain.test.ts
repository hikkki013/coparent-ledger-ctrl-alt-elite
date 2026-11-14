import test from 'node:test';
import assert from 'node:assert/strict';
import { parseUsdToCents, parsePercentToBps, splitExpense, formatUsd } from '../../src/domain/money.ts';
import { deriveSettlement } from '../../src/domain/settlement.ts';
import { validateDraft, validateDate, validateText } from '../../src/domain/validation.ts';
import { exportExpensesCsv } from '../../src/domain/csv.ts';
import { LedgerError } from '../../src/domain/types.ts';
import type { DraftInput, ExpenseDetail, Reimbursement } from '../../src/domain/types.ts';

const validationError = (error: unknown) => error instanceof LedgerError && error.code === 'VALIDATION';
const input: DraftInput = { childId: 'child-1', category: 'SCHOOL', description: 'School supplies', merchant: 'Sample store', expenseDate: '2026-11-14', amountCents: 12001, reviewerShareBps: 4000 };
const payment = (id: string, amountCents: number, status: Reimbursement['status']): Reimbursement => ({ id, householdId: 'household', expenseId: 'expense', fromUserId: 'jordan', toUserId: 'alex', amountCents, paidOn: '2026-11-14', methodLabel: 'External transfer', note: '', status, createdAt: '2026-11-14T10:00:00.000Z', resolvedAt: status === 'PENDING' ? null : '2026-11-14T11:00:00.000Z' });
const record = (status: ExpenseDetail['expense']['status'], overrides: Partial<ExpenseDetail['expense']> = {}): ExpenseDetail => ({ expense: { ...input, id: 'expense', householdId: 'household', paidBy: 'alex', reviewerId: 'jordan', childAliasSnapshot: 'Child 1', currency: 'USD', reviewerOwedCents: 4800, status, submittedAt: '2026-11-14T10:00:00.000Z', replacesExpenseId: null, receiptId: 'receipt-secret', lockVersion: 2, createdAt: '2026-11-14T09:00:00.000Z', ...overrides }, reimbursements: [], audit: [] });

test('decimal input is parsed exactly without rounding excessive precision', () => {
  assert.equal(parseUsdToCents('120.01'), 12001);
  assert.equal(parseUsdToCents(' 0.01 '), 1);
  assert.equal(parseUsdToCents('1000000.00'), 100000000);
  assert.equal(parsePercentToBps('33.33'), 3333);
  assert.equal(parsePercentToBps('0'), 0);
  assert.equal(parsePercentToBps('100.00'), 10000);
  for (const value of ['0', '-1', '12.345', '1e3', 'Infinity', 'NaN', '1,000', '$2.00', '.5', '', '1000000.01']) assert.throws(() => parseUsdToCents(value), validationError, value);
  for (const value of ['-1', '100.01', '1.001', '50%', '1e1', 'NaN', '']) assert.throws(() => parsePercentToBps(value), validationError, value);
  assert.throws(() => parseUsdToCents(12 as unknown as string), validationError);
});

test('split rounds reviewer half up and assigns the exact residual to payer', () => {
  assert.deepEqual(splitExpense(1, 5000), { reviewerOwedCents: 1, payerShareCents: 0 });
  assert.deepEqual(splitExpense(8555, 5000), { reviewerOwedCents: 4278, payerShareCents: 4277 });
  assert.deepEqual(splitExpense(4005, 3333), { reviewerOwedCents: 1335, payerShareCents: 2670 });
  for (const total of [1, 99, 12001, 100000000]) {
    for (const bps of [0, 1, 3333, 5000, 9999, 10000]) {
      const result = splitExpense(total, bps);
      assert.equal(result.reviewerOwedCents + result.payerShareCents, total);
      assert.equal(result.reviewerOwedCents, Number((BigInt(total) * BigInt(bps) + 5000n) / 10000n));
    }
  }
  for (const total of [0, -1, 1.1, NaN, Infinity, 100000001]) assert.throws(() => splitExpense(total, 5000), validationError);
  for (const bps of [-1, 1.5, 10001, NaN]) assert.throws(() => splitExpense(100, bps), validationError);
  assert.equal(formatUsd(12001), '$120.01');
  assert.equal(formatUsd(100000000), '$1,000,000.00');
  assert.equal(formatUsd(Number.MAX_SAFE_INTEGER), '$90,071,992,547,409.91');
});

test('pending reserves capacity without reducing remaining; rejected reports release it', () => {
  assert.deepEqual(deriveSettlement(4800, [payment('r1', 2000, 'CONFIRMED'), payment('r2', 1000, 'PENDING')]), { confirmedCents: 2000, pendingCents: 1000, remainingCents: 2800, availableToReportCents: 1800, status: 'PARTIAL' });
  assert.deepEqual(deriveSettlement(4800, [payment('r1', 2000, 'CONFIRMED'), payment('r2', 1000, 'REJECTED')]), { confirmedCents: 2000, pendingCents: 0, remainingCents: 2800, availableToReportCents: 2800, status: 'PARTIAL' });
  assert.equal(deriveSettlement(4800, [payment('r1', 4800, 'PENDING')]).status, 'UNPAID');
  assert.equal(deriveSettlement(4800, [payment('r1', 4800, 'CONFIRMED')]).status, 'SETTLED');
  assert.equal(deriveSettlement(0, []).status, 'NOT_REQUIRED');
});

test('invalid settlement states fail instead of hiding corruption with zero balance', () => {
  assert.throws(() => deriveSettlement(1000, [payment('r1', 700, 'CONFIRMED'), payment('r2', 600, 'PENDING')]), validationError);
  assert.throws(() => deriveSettlement(0, [payment('r1', 1, 'CONFIRMED')]), validationError);
  assert.throws(() => deriveSettlement(1000, [payment('r1', -1, 'REJECTED')]), validationError);
  assert.throws(() => deriveSettlement(1000, [payment('r1', 200, 'MYSTERY' as Reimbursement['status'])]), validationError);
  assert.throws(() => deriveSettlement(NaN, []), validationError);
  assert.throws(() => deriveSettlement(1000, [payment('same', 100, 'PENDING'), payment('same', 100, 'PENDING')]), validationError);
});

test('draft validation returns a clean copy and rejects hidden actor/status fields', () => {
  const copy = validateDraft({ ...input, description: ' School supplies ', merchant: ' Sample store ' });
  assert.deepEqual(copy, input);
  assert.notEqual(copy, input);
  assert.throws(() => validateDraft({ ...input, paidBy: 'jordan' } as DraftInput), validationError);
  assert.throws(() => validateDraft({ ...input, status: 'APPROVED' } as DraftInput), validationError);
  assert.throws(() => validateDraft({ ...input, amountCents: 0 }), validationError);
  assert.throws(() => validateDraft({ ...input, description: '  ' }), validationError);
  assert.throws(() => validateDraft({ ...input, category: 'UNKNOWN' as DraftInput['category'] }), validationError);
  assert.throws(() => validateDraft({ ...input, childId: '' }), validationError);
});

test('date-only validation rejects impossible calendar days and text validation enforces bounds', () => {
  assert.equal(validateDate('2024-02-29'), '2024-02-29');
  for (const date of ['2023-02-29', '2026-04-31', '2026-1-01', '2026-11-14T00:00:00Z', '0000-01-01']) assert.throws(() => validateDate(date), validationError, date);
  assert.equal(validateText(' hello ', 'Note', 5), 'hello');
  assert.equal(validateText('  ', 'Note', 10, false), '');
  assert.throws(() => validateText('hello!', 'Note', 5), validationError);
  assert.throws(() => validateText('\u0000', 'Note', 5), validationError);
});

test('CSV keeps agreed totals separate, preserves both directions and excludes receipt links', () => {
  const approved = record('APPROVED');
  approved.reimbursements = [payment('r1', 2000, 'CONFIRMED'), payment('r2', 1000, 'PENDING')];
  const disputed = record('DISPUTED', { id: 'disputed', description: 'Activity fee', amountCents: 9999, reviewerShareBps: 7000, reviewerOwedCents: 6999 });
  const reverse = record('APPROVED', { id: 'reverse', paidBy: 'jordan', reviewerId: 'alex', amountCents: 8555, reviewerShareBps: 5000, reviewerOwedCents: 4278 });
  const csv = exportExpensesCsv([approved, disputed, reverse]);
  const rows = csv.split('\r\n').filter(Boolean).map(line => line.split(',').map(value => value.replace(/^"|"$/g, '')));
  const index = (name: string) => rows[0].indexOf(name);
  assert.equal(rows[1][index('agreed_share_cents')], '4800');
  assert.equal(rows[1][index('confirmed_cents')], '2000');
  assert.equal(rows[1][index('pending_cents')], '1000');
  assert.equal(rows[1][index('remaining_cents')], '2800');
  assert.equal(rows[2][index('proposed_share_cents')], '6999');
  assert.equal(rows[2][index('agreed_share_cents')], '');
  assert.equal(rows[2][index('remaining_cents')], '');
  assert.equal(rows[1][index('direction')], 'jordan → alex');
  assert.equal(rows[3][index('direction')], 'alex → jordan');
  assert.ok(!csv.includes('receipt-secret'));
  assert.ok(!csv.includes('signed'));
});

test('CSV neutralizes formula prefixes including whitespace and correctly quotes embedded delimiters', () => {
  for (const text of ['=HYPERLINK("bad")', '+SUM(1,2)', '-5+2', '@A1', '\t=SUM(1)', '\n=SUM(1)', '  =SUM(1)']) {
    const csv = exportExpensesCsv([record('DRAFT', { description: text })]);
    assert.ok(csv.includes('"\'' + text.replaceAll('"', '""') + '"'), text);
  }
  const csv = exportExpensesCsv([record('DRAFT', { description: 'One, "two"\nthree' })]);
  assert.ok(csv.includes('"One, ""two""\nthree"'));
});
