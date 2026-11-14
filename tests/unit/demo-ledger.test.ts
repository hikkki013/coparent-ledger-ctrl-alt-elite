import test from 'node:test';
import assert from 'node:assert/strict';
import { DemoLedger } from '../../src/data/demo-ledger.ts';
import { deriveSettlement } from '../../src/domain/settlement.ts';
import { LedgerError } from '../../src/domain/types.ts';
import type { DraftInput, ExpenseDetail, ErrorCode } from '../../src/domain/types.ts';

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}
const input: DraftInput = { childId: 'child-1', category: 'SCHOOL', description: 'School supplies', merchant: 'Sample store', expenseDate: '2026-11-14', amountCents: 12001, reviewerShareBps: 4000 };
const meta = (detail: ExpenseDetail, idempotencyKey: string) => ({ expectedRevision: detail.expense.lockVersion, idempotencyKey });
const failure = (code: ErrorCode) => (error: unknown) => error instanceof LedgerError && error.code === code;
function clean(): { ledger: DemoLedger; storage: MemoryStorage } {
  const storage = new MemoryStorage();
  const ledger = new DemoLedger(storage);
  ledger.reset('clean');
  return { ledger, storage };
}
async function approved(ledger: DemoLedger, draftInput = input): Promise<ExpenseDetail> {
  ledger.setActor('alex');
  let detail = await ledger.createDraft(draftInput, { idempotencyKey: 'draft' });
  detail = await ledger.submitExpense(detail.expense.id, meta(detail, 'submit'));
  ledger.setActor('jordan');
  return ledger.reviewExpense(detail.expense.id, 'APPROVE', '', meta(detail, 'approve'));
}

test('golden examples preserve both directions and exact approved totals', async () => {
  const ledger = new DemoLedger(new MemoryStorage());
  const rows = await ledger.listExpenses();
  assert.equal(rows.length, 4);
  const e1 = await ledger.getExpense('e1');
  assert.deepEqual(deriveSettlement(e1.expense.reviewerOwedCents, e1.reimbursements), { confirmedCents: 2000, pendingCents: 1000, remainingCents: 2800, availableToReportCents: 1800, status: 'PARTIAL' });
  assert.ok(e1.audit.filter(event => event.action.startsWith('PAYMENT_')).every(event => e1.reimbursements.some(report => report.id === event.reimbursementId)));
  const e2 = await ledger.getExpense('e2');
  assert.equal(e2.expense.reviewerOwedCents, 4278);
  assert.equal(e2.expense.paidBy, 'jordan');
  const agreed = rows.filter(row => row.expense.status === 'APPROVED');
  assert.equal(agreed.reduce((sum, row) => sum + row.expense.reviewerOwedCents, 0), 9078);
  assert.equal(agreed.reduce((sum, row) => sum + deriveSettlement(row.expense.reviewerOwedCents, row.reimbursements).remainingCents, 0), 7078);
  assert.equal((await ledger.getExpense('e3')).expense.status, 'DISPUTED');
  assert.equal((await ledger.getExpense('e4')).expense.reviewerOwedCents, 1335);
});

test('two actors complete partial reimbursement; pending does not reduce remaining', async () => {
  const { ledger } = clean();
  let detail = await approved(ledger);
  detail = await ledger.reportReimbursement(detail.expense.id, 2000, '2026-11-14', 'External transfer', '', meta(detail, 'report'));
  assert.equal(deriveSettlement(4800, detail.reimbursements).remainingCents, 4800);
  await assert.rejects(ledger.resolveReimbursement(detail.reimbursements[0].id, 'CONFIRM', '', meta(detail, 'self-confirm')), failure('FORBIDDEN'));
  ledger.setActor('alex');
  detail = await ledger.resolveReimbursement(detail.reimbursements[0].id, 'CONFIRM', '', meta(detail, 'confirm'));
  assert.equal(deriveSettlement(4800, detail.reimbursements).remainingCents, 2800);
  assert.equal(detail.audit.at(-1)?.actorId, 'alex');
  assert.equal(detail.audit.filter(event => event.action === 'PAYMENT_CONFIRMED').length, 1);
  const paymentEvents = detail.audit.filter(event => event.action === 'PAYMENT_REPORTED' || event.action === 'PAYMENT_CONFIRMED');
  assert.equal(paymentEvents.length, 2);
  assert.ok(paymentEvents.every(event => event.reimbursementId === detail.reimbursements[0].id));
});

test('drafts, withdrawn unsent drafts, receipts and their activity are private', async () => {
  const { ledger } = clean();
  let draft = await ledger.createDraft(input, { idempotencyKey: 'draft' });
  draft = await ledger.attachSampleReceipt(draft.expense.id, meta(draft, 'receipt'));
  const receiptId = draft.expense.receiptId!;
  ledger.setActor('jordan');
  assert.deepEqual(await ledger.listExpenses(), []);
  await assert.rejects(ledger.getExpense(draft.expense.id), failure('FORBIDDEN'));
  await assert.rejects(ledger.getReceiptAccess(receiptId), failure('FORBIDDEN'));
  assert.ok(!(await ledger.exportExpensesCsv()).includes('School supplies'));
  ledger.setActor('alex');
  draft = await ledger.withdrawExpense(draft.expense.id, '', meta(draft, 'withdraw'));
  assert.equal((await ledger.getExpense(draft.expense.id)).expense.status, 'WITHDRAWN');
  ledger.setActor('jordan');
  await assert.rejects(ledger.getExpense(draft.expense.id), failure('FORBIDDEN'));
});

test('submitted and approved payloads cannot be edited; own expense cannot be approved', async () => {
  const { ledger } = clean();
  let detail = await ledger.createDraft(input, { idempotencyKey: 'draft' });
  detail = await ledger.submitExpense(detail.expense.id, meta(detail, 'submit'));
  await assert.rejects(ledger.reviewExpense(detail.expense.id, 'APPROVE', '', meta(detail, 'self-approve')), failure('FORBIDDEN'));
  await assert.rejects(ledger.saveDraft(detail.expense.id, { ...input, amountCents: 1 }, meta(detail, 'edit')), failure('INVALID_STATE'));
  await assert.rejects(ledger.attachSampleReceipt(detail.expense.id, meta(detail, 'receipt')), failure('INVALID_STATE'));
  ledger.setActor('jordan');
  detail = await ledger.reviewExpense(detail.expense.id, 'APPROVE', '', meta(detail, 'approve'));
  ledger.setActor('alex');
  await assert.rejects(ledger.withdrawExpense(detail.expense.id, 'Change', meta(detail, 'withdraw')), failure('INVALID_STATE'));
  await assert.rejects(ledger.replaceExpenseWithDraft(detail.expense.id, 'Change', meta(detail, 'replace')), failure('INVALID_STATE'));
});

test('retry returns original result before revision checks; changed payload conflicts', async () => {
  const { ledger } = clean();
  const initial = await ledger.createDraft(input, { idempotencyKey: 'draft' });
  const command = meta(initial, 'submit');
  const submitted = await ledger.submitExpense(initial.expense.id, command);
  assert.deepEqual(await ledger.submitExpense(initial.expense.id, command), submitted);
  await assert.rejects(ledger.submitExpense(initial.expense.id, { ...command, expectedRevision: 88 }), failure('IDEMPOTENCY_CONFLICT'));
  await assert.rejects(ledger.createDraft({ ...input, amountCents: 10 }, { idempotencyKey: 'draft' }), failure('IDEMPOTENCY_CONFLICT'));
  await assert.rejects(ledger.saveDraft(initial.expense.id, input, meta(initial, 'stale-save')), failure('STALE_REVISION'));
  assert.equal((await ledger.getExpense(initial.expense.id)).audit.filter(event => event.action === 'SUBMITTED').length, 1);
});

test('concurrent reports cannot reserve more than available and failed commands leave no event', async () => {
  const { ledger } = clean();
  const detail = await approved(ledger, { ...input, amountCents: 1000, reviewerShareBps: 10000 });
  const results = await Promise.allSettled([
    ledger.reportReimbursement(detail.expense.id, 700, '2026-11-14', '', '', meta(detail, 'a')),
    ledger.reportReimbursement(detail.expense.id, 600, '2026-11-14', '', '', meta(detail, 'b')),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  const current = await ledger.getExpense(detail.expense.id);
  assert.equal(current.reimbursements.length, 1);
  assert.equal(deriveSettlement(1000, current.reimbursements).availableToReportCents, 300);
  await assert.rejects(ledger.reportReimbursement(detail.expense.id, 301, '2026-11-14', '', '', meta(current, 'too-much')), failure('AMOUNT_EXCEEDS_AVAILABLE'));
  assert.deepEqual(await ledger.getExpense(detail.expense.id), current);
});

test('pending rejection releases reservation; full payment settles and duplicate confirmation is safe', async () => {
  const { ledger } = clean();
  let detail = await approved(ledger);
  detail = await ledger.reportReimbursement(detail.expense.id, 4800, '2026-11-14', '', '', meta(detail, 'report'));
  ledger.setActor('alex');
  await assert.rejects(ledger.resolveReimbursement(detail.reimbursements[0].id, 'REJECT', ' ', meta(detail, 'empty-reason')), failure('VALIDATION'));
  detail = await ledger.resolveReimbursement(detail.reimbursements[0].id, 'REJECT', 'Not received', meta(detail, 'reject'));
  assert.equal(deriveSettlement(4800, detail.reimbursements).availableToReportCents, 4800);
  assert.equal(detail.audit.find(event => event.action === 'PAYMENT_REJECTED')?.reimbursementId, detail.reimbursements[0].id);
  ledger.setActor('jordan');
  detail = await ledger.reportReimbursement(detail.expense.id, 4800, '2026-11-14', '', '', meta(detail, 'report2'));
  ledger.setActor('alex');
  const reportId = detail.reimbursements[1].id;
  const command = meta(detail, 'confirm');
  detail = await ledger.resolveReimbursement(reportId, 'CONFIRM', '', command);
  assert.deepEqual(await ledger.resolveReimbursement(reportId, 'CONFIRM', '', command), detail);
  await assert.rejects(ledger.resolveReimbursement(reportId, 'REJECT', 'Mistake', meta(detail, 'late-reject')), failure('INVALID_STATE'));
  assert.equal(deriveSettlement(4800, detail.reimbursements).status, 'SETTLED');
  ledger.setActor('jordan');
  await assert.rejects(ledger.reportReimbursement(detail.expense.id, 1, '2026-11-14', '', '', meta(detail, 'extra')), failure('AMOUNT_EXCEEDS_AVAILABLE'));
});

test('correction withdraws old snapshot atomically and creates private draft without receipt', async () => {
  const { ledger } = clean();
  let detail = await ledger.createDraft(input, { idempotencyKey: 'draft' });
  detail = await ledger.attachSampleReceipt(detail.expense.id, meta(detail, 'receipt'));
  detail = await ledger.submitExpense(detail.expense.id, meta(detail, 'submit'));
  const original = detail;
  const replacement = await ledger.replaceExpenseWithDraft(detail.expense.id, 'Correct amount', meta(detail, 'replace'));
  assert.equal(replacement.expense.status, 'DRAFT');
  assert.equal(replacement.expense.replacesExpenseId, original.expense.id);
  assert.equal(replacement.expense.receiptId, null);
  assert.notEqual(replacement.expense.id, original.expense.id);
  const old = await ledger.getExpense(original.expense.id);
  assert.equal(old.expense.status, 'WITHDRAWN');
  assert.equal(old.expense.receiptId, original.expense.receiptId);
  assert.equal(old.expense.amountCents, 12001);
  ledger.setActor('jordan');
  assert.equal((await ledger.getExpense(original.expense.id)).expense.status, 'WITHDRAWN');
  await assert.rejects(ledger.getExpense(replacement.expense.id), failure('FORBIDDEN'));
  await assert.rejects(ledger.reviewExpense(original.expense.id, 'APPROVE', '', meta(original, 'stale-review')), failure('STALE_REVISION'));
});

test('only reviewer can approve an unchanged disputed share; blank dispute is invalid', async () => {
  const { ledger } = clean();
  let detail = await ledger.createDraft(input, { idempotencyKey: 'draft' });
  detail = await ledger.submitExpense(detail.expense.id, meta(detail, 'submit'));
  ledger.setActor('jordan');
  await assert.rejects(ledger.reviewExpense(detail.expense.id, 'DISPUTE', ' ', meta(detail, 'blank')), failure('VALIDATION'));
  detail = await ledger.reviewExpense(detail.expense.id, 'DISPUTE', 'Please clarify', meta(detail, 'dispute'));
  await assert.rejects(ledger.reportReimbursement(detail.expense.id, 1, '2026-11-14', '', '', meta(detail, 'report')), failure('INVALID_STATE'));
  detail = await ledger.reviewExpense(detail.expense.id, 'APPROVE', '', meta(detail, 'approve'));
  assert.equal(detail.expense.reviewerOwedCents, 4800);
  assert.equal(detail.expense.status, 'APPROVED');
});

test('reset is isolated and stored changes survive a new adapter without object aliasing', async () => {
  const { ledger, storage } = clean();
  storage.setItem('auth-token', 'untouched');
  const draft = await ledger.createDraft(input, { idempotencyKey: 'draft' });
  draft.expense.amountCents = 4;
  draft.audit.splice(0);
  const another = new DemoLedger(storage);
  assert.equal((await another.getExpense(draft.expense.id)).expense.amountCents, 12001);
  assert.ok((await another.getExpense(draft.expense.id)).audit.length > 0);
  const independent = new DemoLedger(new MemoryStorage());
  ledger.reset('clean');
  assert.deepEqual(await another.listExpenses(), []);
  assert.equal((await independent.listExpenses()).length, 4);
  assert.equal(storage.getItem('auth-token'), 'untouched');
});

test('demo prohibits real file uploads and unknown actors, but allows authorized sample receipts', async () => {
  const { ledger } = clean();
  assert.throws(() => ledger.setActor('stranger' as 'alex'), failure('FORBIDDEN'));
  assert.throws(() => new DemoLedger(new MemoryStorage(), 'stranger' as 'alex'), failure('FORBIDDEN'));
  let detail = await ledger.createDraft(input, { idempotencyKey: 'draft' });
  await assert.rejects(ledger.uploadReceipt(detail.expense.id, new File(['content'], 'real.png', { type: 'image/png' }), meta(detail, 'upload')), failure('UPLOAD_INVALID'));
  detail = await ledger.attachSampleReceipt(detail.expense.id, meta(detail, 'sample'));
  assert.equal((await ledger.getReceiptAccess(detail.expense.receiptId!)).url, '/samples/receipt.svg');
  await assert.rejects(ledger.getReceiptAccess('unknown'), failure('FORBIDDEN'));
});

test('child commands enforce max three and reject foreign child and extra actor fields', async () => {
  const { ledger } = clean();
  const child = await ledger.createChild('Child 2', { idempotencyKey: 'child2' });
  assert.deepEqual(await ledger.createChild('Child 2', { idempotencyKey: 'child2' }), child);
  await ledger.createChild('Child 3', { idempotencyKey: 'child3' });
  await assert.rejects(ledger.createChild('Child 4', { idempotencyKey: 'child4' }), failure('VALIDATION'));
  await assert.rejects(ledger.createDraft({ ...input, childId: 'foreign' }, { idempotencyKey: 'foreign' }), failure('FORBIDDEN'));
  await assert.rejects(ledger.createDraft({ ...input, paidBy: 'jordan' } as DraftInput, { idempotencyKey: 'spoof' }), failure('VALIDATION'));
});

test('zero-share approval needs no reimbursement and joined demo rejects onboarding mutations honestly', async () => {
  const { ledger } = clean();
  const detail = await approved(ledger, { ...input, reviewerShareBps: 0 });
  assert.equal(deriveSettlement(0, detail.reimbursements).status, 'NOT_REQUIRED');
  await assert.rejects(ledger.reportReimbursement(detail.expense.id, 1, '2026-11-14', '', '', meta(detail, 'report')), failure('AMOUNT_EXCEEDS_AVAILABLE'));
  await assert.rejects(ledger.createHousehold({ idempotencyKey: 'house' }), failure('INVALID_STATE'));
  await assert.rejects(ledger.createInvite('example@example.com'), failure('HOUSEHOLD_FULL'));
  await assert.rejects(ledger.acceptInvite('token', { idempotencyKey: 'invite' }), failure('INVITE_INVALID'));
});

test('storage failure commits neither mutation nor audit nor idempotency result', async () => {
  class FailingStorage extends MemoryStorage {
    failWrites = false;
    override setItem(key: string, value: string): void {
      if (this.failWrites) throw new Error('Storage quota reached');
      super.setItem(key, value);
    }
  }
  const storage = new FailingStorage();
  const ledger = new DemoLedger(storage);
  ledger.reset('clean');
  storage.failWrites = true;
  await assert.rejects(ledger.createDraft(input, { idempotencyKey: 'retry-after-failure' }), failure('BACKEND_UNAVAILABLE'));
  assert.deepEqual(await ledger.listExpenses(), []);
  storage.failWrites = false;
  const saved = await ledger.createDraft(input, { idempotencyKey: 'retry-after-failure' });
  assert.equal(saved.audit.length, 1);
  assert.equal((await ledger.listExpenses()).length, 1);
});

test('idempotency scope is actor and operation; replayed report reserves only once', async () => {
  const { ledger } = clean();
  const first = await ledger.createDraft(input, { idempotencyKey: 'same-key' });
  ledger.setActor('jordan');
  const second = await ledger.createDraft(input, { idempotencyKey: 'same-key' });
  assert.notEqual(first.expense.id, second.expense.id);
  assert.equal(second.expense.paidBy, 'jordan');
  ledger.setActor('alex');
  let detail = await ledger.submitExpense(first.expense.id, meta(first, 'same-key'));
  ledger.setActor('jordan');
  detail = await ledger.reviewExpense(detail.expense.id, 'APPROVE', '', meta(detail, 'same-key'));
  const command = meta(detail, 'same-key');
  const reported = await ledger.reportReimbursement(detail.expense.id, 1000, '2026-11-14', '', '', command);
  assert.deepEqual(await ledger.reportReimbursement(detail.expense.id, 1000, '2026-11-14', '', '', command), reported);
  assert.equal((await ledger.getExpense(detail.expense.id)).reimbursements.length, 1);
  assert.equal(deriveSettlement(4800, reported.reimbursements).pendingCents, 1000);
});

test('missing command metadata is a validation error rather than an uncaught runtime failure', async () => {
  const { ledger } = clean();
  const detail = await ledger.createDraft(input, { idempotencyKey: 'draft' });
  await assert.rejects(ledger.submitExpense(detail.expense.id, undefined as never), failure('VALIDATION'));
  await assert.rejects(ledger.replaceExpenseWithDraft(detail.expense.id, 'Change', undefined as never), failure('VALIDATION'));
  await assert.rejects(ledger.resolveReimbursement('missing', 'CONFIRM', '', undefined as never), failure('VALIDATION'));
});
