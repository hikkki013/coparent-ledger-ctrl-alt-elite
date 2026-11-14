import { CATEGORIES, LedgerError } from './types.ts';
import type { DraftInput } from './types.ts';
import { splitExpense } from './money.ts';

export function validateText(value: string, label: string, max: number, required = true): string {
  if (typeof value !== 'string' || value.includes('\u0000')) throw new LedgerError('VALIDATION', `${label} must be text.`);
  const text = value.trim();
  if ((required && text.length === 0) || text.length > max) {
    throw new LedgerError('VALIDATION', `${label} ${required ? 'is required and ' : ''}must be at most ${max} characters.`);
  }
  return text;
}

export function validateDate(value: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) {
    throw new LedgerError('VALIDATION', 'Date must be a valid YYYY-MM-DD calendar date.');
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new LedgerError('VALIDATION', 'Date must be a valid YYYY-MM-DD calendar date.');
  }
  return value;
}

export function validateDraft(input: DraftInput, allowedCategories: readonly string[] = CATEGORIES): DraftInput {
  const fields = ['childId', 'category', 'description', 'merchant', 'expenseDate', 'amountCents', 'reviewerShareBps'];
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !fields.includes(key))) {
    throw new LedgerError('VALIDATION', 'Draft contains unsupported fields.');
  }
  if (!allowedCategories.includes(input.category)) throw new LedgerError('VALIDATION', 'Choose a valid category.');
  splitExpense(input.amountCents, input.reviewerShareBps);
  return {
    childId: validateText(input.childId, 'Child', 128),
    category: input.category,
    description: validateText(input.description, 'Description', 500),
    merchant: validateText(input.merchant, 'Merchant', 200, false),
    expenseDate: validateDate(input.expenseDate),
    amountCents: input.amountCents,
    reviewerShareBps: input.reviewerShareBps,
  };
}
