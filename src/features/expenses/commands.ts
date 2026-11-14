import type { ExpenseDetail, MutationMeta } from '../../domain/types.ts';
export type RunCommand = <T>(requestKey: string, revision: number | null, work: (meta: MutationMeta) => Promise<T>) => Promise<T>;
export const commandKey = (operation: string, payload: unknown) => JSON.stringify({ operation, payload });

/** Keep an acknowledged financial result visible even if the following read fails. */
export function retainAcknowledgedExpense(current: ExpenseDetail[], result: unknown): ExpenseDetail[] {
  if (!result || typeof result !== 'object' || !('expense' in result)) return current;
  const detail = result as ExpenseDetail;
  if (!detail.expense || typeof detail.expense.id !== 'string' || !Array.isArray(detail.reimbursements) || !Array.isArray(detail.audit)) return current;
  const existing = current.findIndex(item => item.expense.id === detail.expense.id);
  if (existing === -1) return [detail, ...current];
  return current.map((item, index) => index === existing ? detail : item);
}
