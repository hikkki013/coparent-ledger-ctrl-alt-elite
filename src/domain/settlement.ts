import { LedgerError } from './types.ts';
import type { Reimbursement, Settlement } from './types.ts';
import { assertIntegerInRange, MAX_AMOUNT_CENTS } from './money.ts';

export function deriveSettlement(owedCents: number, reports: Reimbursement[]): Settlement {
  assertIntegerInRange(owedCents, 0, MAX_AMOUNT_CENTS, 'Owed amount');
  if (!Array.isArray(reports)) throw new LedgerError('VALIDATION', 'Reimbursements must be a list.');
  let confirmed = 0n;
  let pending = 0n;
  const ids = new Set<string>();
  for (const report of reports) {
    if (!report || typeof report !== 'object') throw new LedgerError('VALIDATION', 'Invalid reimbursement.');
    assertIntegerInRange(report.amountCents, 1, MAX_AMOUNT_CENTS, 'Reimbursement amount');
    if (typeof report.id === 'string') {
      if (ids.has(report.id)) throw new LedgerError('VALIDATION', 'A reimbursement cannot be counted twice.');
      ids.add(report.id);
    }
    if (report.status === 'CONFIRMED') confirmed += BigInt(report.amountCents);
    else if (report.status === 'PENDING') pending += BigInt(report.amountCents);
    else if (report.status !== 'REJECTED') throw new LedgerError('VALIDATION', 'Invalid reimbursement status.');
  }
  if (confirmed + pending > BigInt(owedCents)) {
    throw new LedgerError('VALIDATION', 'Confirmed and pending reimbursements exceed the agreed share.');
  }
  const confirmedCents = Number(confirmed);
  const pendingCents = Number(pending);
  const remainingCents = owedCents - confirmedCents;
  return {
    confirmedCents,
    pendingCents,
    remainingCents,
    availableToReportCents: remainingCents - pendingCents,
    status: owedCents === 0 ? 'NOT_REQUIRED' : remainingCents === 0 ? 'SETTLED' : confirmedCents > 0 ? 'PARTIAL' : 'UNPAID',
  };
}
