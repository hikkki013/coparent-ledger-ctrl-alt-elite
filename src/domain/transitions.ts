import { LedgerError } from './types.ts';
import type { Expense, MutationMeta, Reimbursement } from './types.ts';

export function canReadExpense(expense: Expense, actorId: string): boolean {
  return expense.paidBy === actorId || (expense.reviewerId === actorId && expense.submittedAt !== null);
}

export function assertExpectedRevision(expense: Expense, meta: MutationMeta): void {
  if (!Number.isSafeInteger(meta.expectedRevision) || meta.expectedRevision < 0) {
    throw new LedgerError('VALIDATION', 'A valid expense revision is required.');
  }
  if (expense.lockVersion !== meta.expectedRevision) {
    throw new LedgerError('STALE_REVISION', 'This expense changed. Refresh it and review the latest details.');
  }
}

function requireAuthor(expense: Expense, actorId: string): void {
  if (expense.paidBy !== actorId) throw new LedgerError('FORBIDDEN', 'Only the parent who paid can perform this action.');
}

export function assertCanEditDraft(expense: Expense, actorId: string): void {
  requireAuthor(expense, actorId);
  if (expense.status !== 'DRAFT' || expense.submittedAt !== null) throw new LedgerError('INVALID_STATE', 'Only an unsent draft can be edited.');
}

export function assertCanSubmit(expense: Expense, actorId: string): void {
  assertCanEditDraft(expense, actorId);
  if (!expense.reviewerId || expense.reviewerId === actorId) throw new LedgerError('INVALID_STATE', 'Your co-parent must join before you send an expense for review.');
}

export function assertCanReview(expense: Expense, actorId: string, decision: 'APPROVE' | 'DISPUTE'): void {
  if (expense.reviewerId !== actorId || expense.paidBy === actorId) throw new LedgerError('FORBIDDEN', 'Only the other parent can review this expense.');
  if (decision !== 'APPROVE' && decision !== 'DISPUTE') throw new LedgerError('VALIDATION', 'Choose approve or dispute.');
  if (expense.status !== 'PENDING' && !(expense.status === 'DISPUTED' && decision === 'APPROVE')) {
    throw new LedgerError('INVALID_STATE', 'This expense cannot be reviewed in its current state.');
  }
}

export function assertCanWithdraw(expense: Expense, actorId: string): void {
  requireAuthor(expense, actorId);
  if (!['DRAFT', 'PENDING', 'DISPUTED'].includes(expense.status)) throw new LedgerError('INVALID_STATE', 'An approved or withdrawn expense cannot be withdrawn.');
}

export function assertCanReplace(expense: Expense, actorId: string): void {
  requireAuthor(expense, actorId);
  if (expense.status !== 'PENDING' && expense.status !== 'DISPUTED') throw new LedgerError('INVALID_STATE', 'Only an expense awaiting review or disputed can be corrected.');
}

export function assertCanReport(expense: Expense, actorId: string): void {
  if (expense.reviewerId !== actorId || expense.paidBy === actorId) throw new LedgerError('FORBIDDEN', 'Only the reimbursing parent can record an external payment.');
  if (expense.status !== 'APPROVED') throw new LedgerError('INVALID_STATE', 'The proposed share must be approved before recording a payment.');
}

export function assertCanResolve(expense: Expense, report: Reimbursement, actorId: string): void {
  if (expense.paidBy !== actorId || report.toUserId !== actorId || report.fromUserId === actorId) throw new LedgerError('FORBIDDEN', 'Only the receiving parent can confirm or reject this payment.');
  if (expense.status !== 'APPROVED' || report.status !== 'PENDING') throw new LedgerError('INVALID_STATE', 'Only a pending payment on an approved expense can be resolved.');
  if (report.expenseId !== expense.id || report.householdId !== expense.householdId || report.fromUserId !== expense.reviewerId) throw new LedgerError('FORBIDDEN', 'This payment is unavailable.');
}
