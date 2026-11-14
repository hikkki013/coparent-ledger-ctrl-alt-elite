import type { Child, CreateMeta, DraftInput, ExpenseDetail, InviteResult, LedgerContext, MutationMeta, ReceiptAccess } from '../domain/types.ts';
/** One contract for the real server and explicitly synthetic, browser-local demo. */
export interface LedgerPort {
  getContext(): Promise<LedgerContext>;
  createHousehold(meta: CreateMeta): Promise<LedgerContext>;
  createInvite(email: string): Promise<InviteResult>;
  acceptInvite(token: string, meta: CreateMeta): Promise<LedgerContext>;
  listChildren(): Promise<Child[]>;
  createChild(alias: string, meta: CreateMeta): Promise<Child>;
  listExpenses(): Promise<ExpenseDetail[]>;
  getExpense(id: string): Promise<ExpenseDetail>;
  createDraft(input: DraftInput, meta: CreateMeta): Promise<ExpenseDetail>;
  saveDraft(id: string, input: DraftInput, meta: MutationMeta): Promise<ExpenseDetail>;
  submitExpense(id: string, meta: MutationMeta): Promise<ExpenseDetail>;
  reviewExpense(id: string, decision: 'APPROVE' | 'DISPUTE', note: string, meta: MutationMeta): Promise<ExpenseDetail>;
  withdrawExpense(id: string, reason: string, meta: MutationMeta): Promise<ExpenseDetail>;
  replaceExpenseWithDraft(id: string, reason: string, meta: MutationMeta): Promise<ExpenseDetail>;
  reportReimbursement(expenseId: string, amountCents: number, paidOn: string, methodLabel: string, note: string, meta: MutationMeta): Promise<ExpenseDetail>;
  resolveReimbursement(reportId: string, decision: 'CONFIRM' | 'REJECT', note: string, meta: MutationMeta): Promise<ExpenseDetail>;
  uploadReceipt(draftId: string, file: File, meta: MutationMeta): Promise<ExpenseDetail>;
  getReceiptAccess(receiptId: string): Promise<ReceiptAccess>;
  exportExpensesCsv(): Promise<string>;
}
