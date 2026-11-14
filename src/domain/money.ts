import { LedgerError } from './types.ts';

export const MAX_AMOUNT_CENTS = 100_000_000;

export function assertIntegerInRange(value: number, min: number, max: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new LedgerError('VALIDATION', `${label} must be an integer between ${min} and ${max}.`);
  }
}

function parseHundredths(value: string, min: number, max: number, label: string): number {
  if (typeof value !== 'string') throw new LedgerError('VALIDATION', `${label} must be entered as a decimal string.`);
  const text = value.trim();
  // Bound work before BigInt conversion; currency symbols, grouping, exponent
  // notation and fractional pennies are deliberately not accepted.
  if (text.length > 32 || !/^\d+(?:\.\d{1,2})?$/.test(text)) {
    throw new LedgerError('VALIDATION', `${label} requires digits and at most two decimal places.`);
  }
  const [whole, fractional = ''] = text.split('.');
  const result = BigInt(whole) * 100n + BigInt(fractional.padEnd(2, '0'));
  if (result < BigInt(min) || result > BigInt(max)) {
    throw new LedgerError('VALIDATION', `${label} is outside the allowed range.`);
  }
  return Number(result);
}

export function parseUsdToCents(value: string): number {
  return parseHundredths(value, 1, MAX_AMOUNT_CENTS, 'Amount');
}

export function parsePercentToBps(value: string): number {
  return parseHundredths(value, 0, 10_000, 'Percentage');
}

export function splitExpense(totalCents: number, reviewerShareBps: number): { payerShareCents: number; reviewerOwedCents: number } {
  assertIntegerInRange(totalCents, 1, MAX_AMOUNT_CENTS, 'Amount');
  assertIntegerInRange(reviewerShareBps, 0, 10_000, 'Reviewer share');
  const reviewerOwedCents = Number((BigInt(totalCents) * BigInt(reviewerShareBps) + 5000n) / 10000n);
  return { payerShareCents: totalCents - reviewerOwedCents, reviewerOwedCents };
}

export function formatUsd(cents: number): string {
  assertIntegerInRange(cents, 0, Number.MAX_SAFE_INTEGER, 'Amount');
  const amount = BigInt(cents);
  const whole = (amount / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `$${whole}.${(amount % 100n).toString().padStart(2, '0')}`;
}
