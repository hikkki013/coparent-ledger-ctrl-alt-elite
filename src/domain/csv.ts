import type { ExpenseDetail } from './types.ts';
import { deriveSettlement } from './settlement.ts';

/** Quote every cell, including trusted numbers, and neutralize spreadsheet formulas. */
export function escapeCsvCell(value: string | number): string {
  let text = String(value);
  if (/^[\t\r\n]/.test(text) || /^\s*[=+@-]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

/** Caller must provide only records already authorized for the current actor. */
export function exportExpensesCsv(records: ExpenseDetail[]): string {
  const headers = ['expense_id', 'expense_date', 'description', 'merchant', 'child_alias', 'category', 'review_status', 'currency', 'total_cents', 'proposed_share_cents', 'agreed_share_cents', 'confirmed_cents', 'pending_cents', 'remaining_cents', 'direction'];
  const rows: (string | number)[][] = [headers];
  for (const { expense, reimbursements } of records) {
    const agreed = expense.status === 'APPROVED';
    const settlement = agreed ? deriveSettlement(expense.reviewerOwedCents, reimbursements) : null;
    rows.push([
      expense.id, expense.expenseDate, expense.description, expense.merchant,
      expense.childAliasSnapshot, expense.category, expense.status, expense.currency,
      expense.amountCents, agreed ? '' : expense.reviewerOwedCents,
      agreed ? expense.reviewerOwedCents : '', settlement?.confirmedCents ?? '',
      settlement?.pendingCents ?? '', settlement?.remainingCents ?? '',
      expense.reviewerId ? `${expense.reviewerId} → ${expense.paidBy}` : '',
    ]);
  }
  return rows.map(row => row.map(escapeCsvCell).join(',')).join('\r\n') + '\r\n';
}
