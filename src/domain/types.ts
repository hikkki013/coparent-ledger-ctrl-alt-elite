export const CATEGORIES = ['SCHOOL', 'MEDICAL', 'ACTIVITIES', 'PURCHASES', 'OTHER'] as const;
export type Category = typeof CATEGORIES[number];
export type ExpenseStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'DISPUTED' | 'WITHDRAWN';
export type ReimbursementStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';
export type SettlementStatus = 'NOT_REQUIRED' | 'UNPAID' | 'PARTIAL' | 'SETTLED';
export type ErrorCode = 'UNAUTHENTICATED' | 'FORBIDDEN' | 'VALIDATION' | 'INVALID_STATE' | 'STALE_REVISION' | 'IDEMPOTENCY_CONFLICT' | 'AMOUNT_EXCEEDS_AVAILABLE' | 'INVITE_INVALID' | 'HOUSEHOLD_FULL' | 'UPLOAD_INVALID' | 'BACKEND_UNAVAILABLE';
export class LedgerError extends Error {
  readonly code: ErrorCode;
  constructor(code: ErrorCode, message: string) { super(message); this.name = 'LedgerError'; this.code = code; }
}
export interface CreateMeta { idempotencyKey: string }
export interface MutationMeta extends CreateMeta { expectedRevision: number }
export interface Household { id: string; createdBy: string; createdAt: string }
export interface Member { userId: string; displayName: string }
export interface Child { id: string; householdId: string; alias: string }
export interface LedgerContext { userId: string; household: Household | null; members: Member[]; children: Child[] }
export interface DraftInput {
  childId: string; category: Category; description: string; merchant: string;
  expenseDate: string; amountCents: number; reviewerShareBps: number;
}
export interface Expense extends DraftInput {
  id: string; householdId: string; paidBy: string; reviewerId: string | null;
  childAliasSnapshot: string; currency: 'USD'; reviewerOwedCents: number;
  status: ExpenseStatus; submittedAt: string | null; replacesExpenseId: string | null;
  receiptId: string | null; lockVersion: number; createdAt: string;
}
export interface Reimbursement {
  id: string; householdId: string; expenseId: string; fromUserId: string; toUserId: string;
  amountCents: number; paidOn: string; methodLabel: string; note: string;
  status: ReimbursementStatus; createdAt: string; resolvedAt: string | null;
}
export interface AuditEvent {
  id: string; householdId: string; expenseId: string; actorId: string;
  reimbursementId?: string | null;
  action: string; createdAt: string; amountCents: number | null; note: string;
}
export interface ExpenseDetail { expense: Expense; reimbursements: Reimbursement[]; audit: AuditEvent[] }
export interface Settlement {
  confirmedCents: number; pendingCents: number; remainingCents: number;
  availableToReportCents: number; status: SettlementStatus;
}
export interface ReceiptAccess { url: string; expiresAt: string }
export interface InviteResult { url: string; expiresAt: string }
