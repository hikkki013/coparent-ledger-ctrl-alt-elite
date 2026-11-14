import type { LedgerPort } from './ledger-port.ts';
import type { DemoAccess } from './demo-access.ts';
import { LedgerError } from '../domain/types.ts';
import type { AuditEvent, Child, CreateMeta, DraftInput, Expense, ExpenseDetail, Household, InviteResult, LedgerContext, Member, MutationMeta, ReceiptAccess, Reimbursement } from '../domain/types.ts';
import { splitExpense, assertIntegerInRange, MAX_AMOUNT_CENTS } from '../domain/money.ts';
import { deriveSettlement } from '../domain/settlement.ts';
import { validateDate, validateDraft, validateText } from '../domain/validation.ts';
import { exportExpensesCsv } from '../domain/csv.ts';
import { assertCanEditDraft, assertCanReplace, assertCanReport, assertCanResolve, assertCanReview, assertCanSubmit, assertCanWithdraw, assertExpectedRevision, canReadExpense } from '../domain/transitions.ts';

export interface DemoStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
type DemoActor = 'alex' | 'jordan';
type DemoMode = 'clean' | 'examples';
interface CommandResult { fingerprint: string; result: unknown }
interface DemoReceipt { id: string; expenseId: string }
export interface DemoCategory { id: string; label: string }
export interface PlanInput { title: string; description: string; childId: string | null; category: string; targetCents: number; reviewerShareBps: number; targetDate: string; notes: string }
export interface DemoPlan extends PlanInput { id: string; status: 'PLANNED' | 'CONVERTED'; createdBy: string; createdAt: string; convertedExpenseId: string | null }
const defaultCategories = (): DemoCategory[] => [{id:'SCHOOL',label:'School'}, {id:'MEDICAL',label:'Medical'}, {id:'ACTIVITIES',label:'Activities'}, {id:'PURCHASES',label:'Purchases'}, {id:'OTHER',label:'Other'}];
interface DemoState {
  schemaVersion: 1; nextId: number; household: Household; members: Member[]; children: Child[];
  expenses: Expense[]; reimbursements: Reimbursement[]; audit: AuditEvent[]; receipts: DemoReceipt[];
  commands: Record<string, CommandResult>; categories: DemoCategory[]; plans: DemoPlan[];
}
const STORAGE_KEY = 'coparent-ledger.demo.v1';
const SAMPLE_URL = '/samples/receipt.svg';
const now = (): string => new Date().toISOString();
const copy = <T>(value: T): T => structuredClone(value);

function canonical(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(',')}}`;
  }
  throw new LedgerError('VALIDATION', 'Command data must contain valid JSON values.');
}

function checkKey(meta: CreateMeta): void {
  if (!meta || typeof meta.idempotencyKey !== 'string' || !meta.idempotencyKey.trim() || meta.idempotencyKey.length > 200) throw new LedgerError('VALIDATION', 'A unique command key is required.');
}

function nextId(state: DemoState, kind: string): string { return `demo-${kind}-${state.nextId++}`; }
function visible(state: DemoState, expense: Expense, actorId: string): boolean {
  return expense.householdId === state.household.id && state.members.some(member => member.userId === actorId) && canReadExpense(expense, actorId);
}
function findExpense(state: DemoState, id: string, actorId: string): Expense {
  const expense = state.expenses.find(item => item.id === id);
  if (!expense || !visible(state, expense, actorId)) throw new LedgerError('FORBIDDEN', 'This expense is unavailable.');
  return expense;
}
function detailFor(state: DemoState, expense: Expense): ExpenseDetail {
  return copy({ expense, reimbursements: state.reimbursements.filter(report => report.expenseId === expense.id), audit: state.audit.filter(event => event.expenseId === expense.id) });
}
function event(state: DemoState, expense: Expense, actorId: string, action: string, note = '', amountCents: number | null = null, reimbursementId: string | null = null): void {
  state.audit.push({ id: nextId(state, 'event'), householdId: expense.householdId, expenseId: expense.id, reimbursementId, actorId, action, createdAt: now(), amountCents, note });
}
function contextFor(state: DemoState, actorId: string): LedgerContext {
  return copy({ userId: actorId, household: state.household, members: state.members, children: state.children });
}
function draftFields(expense: Expense): DraftInput {
  return { childId: expense.childId, category: expense.category, description: expense.description, merchant: expense.merchant, expenseDate: expense.expenseDate, amountCents: expense.amountCents, reviewerShareBps: expense.reviewerShareBps };
}
function newDraft(state: DemoState, actorId: string, input: DraftInput, replacesExpenseId: string | null = null): Expense {
  const fields = validateDraft(input, state.categories.map(category => category.id));
  const child = state.children.find(item => item.id === fields.childId && item.householdId === state.household.id);
  if (!child || (child.archived && !replacesExpenseId)) throw new LedgerError('FORBIDDEN', 'This child is unavailable or archived.');
  const expense: Expense = {
    ...fields, id: nextId(state, 'expense'), householdId: state.household.id, paidBy: actorId,
    reviewerId: state.members.find(member => member.userId !== actorId)?.userId ?? null,
    childAliasSnapshot: child.alias, currency: 'USD', reviewerOwedCents: splitExpense(fields.amountCents, fields.reviewerShareBps).reviewerOwedCents,
    status: 'DRAFT', submittedAt: null, replacesExpenseId, receiptId: null, lockVersion: 0, createdAt: now(),
  };
  state.expenses.push(expense);
  event(state, expense, actorId, 'DRAFT_CREATED', replacesExpenseId ? `Corrected draft for ${replacesExpenseId}.` : '', expense.amountCents);
  return expense;
}

function initialState(mode: DemoMode): DemoState {
  const seedTime = '2026-11-14T12:00:00.000Z';
  const state: DemoState = { schemaVersion: 1, nextId: 100, household: { id: 'demo-household', createdBy: 'alex', createdAt: seedTime }, members: [{ userId: 'alex', displayName: 'Alex' }, { userId: 'jordan', displayName: 'Jordan' }], children: [{ id: 'child-1', householdId: 'demo-household', alias: 'Child 1' }], expenses: [], reimbursements: [], audit: [], receipts: [], commands: {}, categories: defaultCategories(), plans: [] };
  if (mode === 'clean') return state;
  const seeds: { id: string; payer: DemoActor; description: string; category: DraftInput['category']; amount: number; bps: number; status: Expense['status']; day: string }[] = [
    { id: 'e1', payer: 'alex', description: 'School supplies', category: 'SCHOOL', amount: 12001, bps: 4000, status: 'APPROVED', day: '2026-11-14' },
    { id: 'e2', payer: 'jordan', description: 'Pharmacy', category: 'MEDICAL', amount: 8555, bps: 5000, status: 'APPROVED', day: '2026-11-13' },
    { id: 'e3', payer: 'alex', description: 'Activity fee', category: 'ACTIVITIES', amount: 9999, bps: 7000, status: 'DISPUTED', day: '2026-11-12' },
    { id: 'e4', payer: 'jordan', description: 'School backpack', category: 'PURCHASES', amount: 4005, bps: 3333, status: 'PENDING', day: '2026-11-11' },
  ];
  for (const seed of seeds) {
    const reviewerId = seed.payer === 'alex' ? 'jordan' : 'alex';
    const instant = `${seed.day}T12:00:00.000Z`;
    const expense: Expense = { id: seed.id, householdId: state.household.id, paidBy: seed.payer, reviewerId, childId: 'child-1', childAliasSnapshot: 'Child 1', category: seed.category, description: seed.description, merchant: 'SAMPLE merchant', expenseDate: seed.day, currency: 'USD', amountCents: seed.amount, reviewerShareBps: seed.bps, reviewerOwedCents: splitExpense(seed.amount, seed.bps).reviewerOwedCents, status: seed.status, submittedAt: instant, replacesExpenseId: null, receiptId: `sample-${seed.id}`, lockVersion: seed.id === 'e1' ? 5 : seed.status === 'PENDING' ? 1 : 2, createdAt: instant };
    state.expenses.push(expense);
    state.receipts.push({ id: expense.receiptId!, expenseId: expense.id });
    const seedEvent = (actorId: string, action: string, note = '', amountCents: number | null = null, reimbursementId: string | null = null): void => {
      state.audit.push({ id: nextId(state, 'event'), householdId: state.household.id, expenseId: expense.id, reimbursementId, actorId, action, createdAt: instant, note, amountCents });
    };
    seedEvent(seed.payer, 'DRAFT_CREATED', '', seed.amount);
    seedEvent(seed.payer, 'SUBMITTED', '', expense.reviewerOwedCents);
    if (seed.status === 'APPROVED') seedEvent(reviewerId, 'APPROVED', '', expense.reviewerOwedCents);
    if (seed.status === 'DISPUTED') seedEvent(reviewerId, 'DISPUTED', 'Please clarify which session this charge covers.', expense.reviewerOwedCents);
    if (seed.id === 'e1') {
      state.reimbursements.push({ id: 'payment-e1-confirmed', householdId: state.household.id, expenseId: expense.id, fromUserId: reviewerId, toUserId: seed.payer, amountCents: 2000, paidOn: seed.day, methodLabel: 'External transfer', note: 'SAMPLE payment', status: 'CONFIRMED', createdAt: instant, resolvedAt: instant });
      seedEvent(reviewerId, 'PAYMENT_REPORTED', 'SAMPLE payment', 2000, 'payment-e1-confirmed');
      seedEvent(seed.payer, 'PAYMENT_CONFIRMED', '', 2000, 'payment-e1-confirmed');
      state.reimbursements.push({ id: 'payment-e1-pending', householdId: state.household.id, expenseId: expense.id, fromUserId: reviewerId, toUserId: seed.payer, amountCents: 1000, paidOn: seed.day, methodLabel: 'External transfer', note: 'SAMPLE payment', status: 'PENDING', createdAt: instant, resolvedAt: null });
      seedEvent(reviewerId, 'PAYMENT_REPORTED', 'SAMPLE payment', 1000, 'payment-e1-pending');
    }
  }
  return state;
}

/** Browser-local synthetic ledger. It never reads auth, contacts a server, or accepts real uploads. */
export class DemoLedger implements LedgerPort {
  #storage: DemoStorage;
  #actorId: DemoActor;
  #access?: DemoAccess;

  constructor(storage: DemoStorage, actorId: DemoActor = 'alex', access?: DemoAccess) {
    this.#storage = storage;
    this.#access = access;
    this.#actorId = 'alex';
    this.setActor(actorId);
    if (this.#storage.getItem(STORAGE_KEY) === null) this.reset('examples');
  }

  setActor(actorId: DemoActor): void {
    if (actorId !== 'alex' && actorId !== 'jordan') throw new LedgerError('FORBIDDEN', 'Choose one of the two sample parents.');
    this.#actorId = actorId;
  }

  reset(mode: DemoMode): void {
    if (mode !== 'clean' && mode !== 'examples') throw new LedgerError('VALIDATION', 'Choose clean or examples.');
    this.#write(initialState(mode));
  }

  #read(): DemoState {
    try {
      const raw = this.#storage.getItem(STORAGE_KEY);
      if (raw === null) return initialState('examples');
      const state = JSON.parse(raw) as DemoState;
      if (state.schemaVersion !== 1 || state.household?.id !== 'demo-household' || !Array.isArray(state.expenses) || !Array.isArray(state.reimbursements) || !Array.isArray(state.audit) || !Array.isArray(state.receipts) || !Array.isArray(state.children) || !Array.isArray(state.members) || typeof state.commands !== 'object' || state.commands === null || !Number.isSafeInteger(state.nextId)) throw new Error('Invalid demo state');
      state.categories ??= defaultCategories(); state.plans ??= [];
      if (!Array.isArray(state.categories) || !Array.isArray(state.plans)) throw new Error('Invalid demo state');
      return state;
    } catch {
      throw new LedgerError('VALIDATION', 'Saved demo data could not be read. Reset the demo to start again.');
    }
  }

  #write(state: DemoState): void {
    try { this.#storage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { throw new LedgerError('BACKEND_UNAVAILABLE', 'This browser could not save the demo. Allow session storage and try again.'); }
  }

  // Synchronous read/check/write within one JS turn also serializes Promise.all calls in this tab.
  // This is not a replacement for transactional locks in the real Supabase adapter.
  #command<T>(operation: string, payload: unknown, meta: CreateMeta, run: (state: DemoState, actorId: string) => T): T {
    checkKey(meta);
    const actorId = this.#actorId;
    const fingerprint = canonical(payload);
    const key = JSON.stringify([actorId, operation, meta.idempotencyKey]);
    const state = this.#read();
    const prior = Object.hasOwn(state.commands, key) ? state.commands[key] : undefined;
    if (prior) {
      if (prior.fingerprint !== fingerprint) throw new LedgerError('IDEMPOTENCY_CONFLICT', 'This command key was already used with different details.');
      return copy(prior.result as T);
    }
    const result = run(state, actorId);
    state.commands[key] = { fingerprint, result: copy(result) };
    this.#write(state);
    return copy(result);
  }

  #mutate(id: string, operation: string, payload: Record<string, unknown>, meta: MutationMeta, run: (state: DemoState, expense: Expense, actorId: string) => void): ExpenseDetail {
    checkKey(meta);
    return this.#command(operation, { id, ...payload, expectedRevision: meta.expectedRevision }, meta, (state, actorId) => {
      const expense = findExpense(state, id, actorId);
      assertExpectedRevision(expense, meta);
      run(state, expense, actorId);
      expense.lockVersion += 1;
      deriveSettlement(expense.reviewerOwedCents, state.reimbursements.filter(report => report.expenseId === id));
      return detailFor(state, expense);
    });
  }

  async getContext(): Promise<LedgerContext> { return contextFor(this.#read(), this.#actorId); }
  async createHousehold(meta: CreateMeta): Promise<LedgerContext> {
    checkKey(meta);
    throw new LedgerError('INVALID_STATE', 'The sample household is already set up with Alex and Jordan.');
  }
  async createInvite(_email: string): Promise<InviteResult> { throw new LedgerError('HOUSEHOLD_FULL', 'The demo already has two sample parents. Use the real app to invite your co-parent.'); }
  async acceptInvite(_token: string, meta: CreateMeta): Promise<LedgerContext> {
    checkKey(meta);
    throw new LedgerError('INVITE_INVALID', 'Real invitations cannot be accepted in the sample demo.');
  }
  async listChildren(): Promise<Child[]> { return copy(this.#read().children); }
  async createChild(alias: string, meta: CreateMeta): Promise<Child> {
    return this.#command('createChild', { alias }, meta, state => {
      const normalized = validateText(alias, 'Child alias', 60);
      if (state.children.filter(child => !child.archived).length >= 10) throw new LedgerError('VALIDATION', 'The demo supports up to ten active children.');
      const child: Child = { id: nextId(state, 'child'), householdId: state.household.id, alias: normalized };
      state.children.push(child);
      return child;
    });
  }
  async renameChild(id: string, name: string, meta: CreateMeta): Promise<Child> {
    return this.#command('renameChild', {id, name}, meta, state => {
      const child = state.children.find(item => item.id === id);
      if (!child) throw new LedgerError('FORBIDDEN', 'Child not found.');
      child.alias = validateText(name, 'Child name', 60); return child;
    });
  }
  async archiveChild(id: string, meta: CreateMeta): Promise<Child> {
    return this.#command('archiveChild', {id}, meta, state => {
      const child = state.children.find(item => item.id === id);
      if (!child) throw new LedgerError('FORBIDDEN', 'Child not found.');
      if (child.archived) throw new LedgerError('INVALID_STATE', 'Child is already archived.');
      child.archived = true; return child;
    });
  }
  async restoreChild(id: string, meta: CreateMeta): Promise<Child> {
    return this.#command('restoreChild', {id}, meta, state => {
      const child = state.children.find(item => item.id === id);
      if (!child) throw new LedgerError('FORBIDDEN', 'Child not found.');
      if (state.children.filter(item => !item.archived).length >= 10) throw new LedgerError('VALIDATION', 'The demo supports up to ten active children.');
      child.archived = false; return child;
    });
  }
  async renameParent(id: string, name: string, meta: CreateMeta): Promise<Member> {
    return this.#command('renameParent', {id, name}, meta, state => {
      const member = state.members.find(item => item.userId === id);
      if (!member) throw new LedgerError('FORBIDDEN', 'Parent not found.');
      member.displayName = validateText(name, 'Parent name', 60); return member;
    });
  }
  async listCategories(): Promise<DemoCategory[]> { return copy(this.#read().categories); }
  async createCategory(label: string, meta: CreateMeta): Promise<DemoCategory> {
    return this.#command('createCategory', {label}, meta, state => {
      const normalized = validateText(label.replace(/\s+/g, ' '), 'Category', 60);
      if (state.categories.some(item => item.label.toLowerCase() === normalized.toLowerCase())) throw new LedgerError('VALIDATION', 'This category already exists.');
      const item = {id: nextId(state, 'category'), label: normalized}; state.categories.push(item); return item;
    });
  }
  async changeCategory(id: string, category: string, meta: MutationMeta): Promise<ExpenseDetail> {
    return this.#mutate(id, 'changeCategory', {category}, meta, (state, expense, actorId) => {
      const next = state.categories.find(item => item.id === category);
      if (!next) throw new LedgerError('VALIDATION', 'Choose a valid category.');
      const previous = state.categories.find(item => item.id === expense.category);
      expense.category = next.id; event(state, expense, actorId, 'CATEGORY_CHANGED', `${previous?.label ?? expense.category} -> ${next.label}`);
    });
  }
  async childStatistics(childId: string) {
    const state = this.#read();
    if (!state.children.some(child => child.id === childId)) throw new LedgerError('FORBIDDEN', 'Child not found.');
    const records = state.expenses.filter(expense => expense.childId === childId && expense.status === 'APPROVED' && visible(state, expense, this.#actorId)).map(expense => detailFor(state, expense));
    const result = {purchaseCents: 0, agreedCents: 0, confirmedCents: 0, remainingCents: 0, byParent: state.members.map(member => ({actorId: member.userId, purchaseCents: 0, categories: [] as {category: string; purchaseCents: number}[]})), records};
    for (const detail of records) {
      const expense = detail.expense; const settlement = deriveSettlement(expense.reviewerOwedCents, detail.reimbursements);
      result.purchaseCents += expense.amountCents; result.agreedCents += expense.reviewerOwedCents; result.confirmedCents += settlement.confirmedCents; result.remainingCents += settlement.remainingCents;
      const parent = result.byParent.find(item => item.actorId === expense.paidBy)!; parent.purchaseCents += expense.amountCents;
      let category = parent.categories.find(item => item.category === expense.category);
      if (!category) { category = {category: expense.category, purchaseCents: 0}; parent.categories.push(category); } category.purchaseCents += expense.amountCents;
    }
    return result;
  }
  async listPlans(): Promise<DemoPlan[]> { return copy(this.#read().plans); }
  async createPlan(input: PlanInput, meta: CreateMeta): Promise<DemoPlan> {
    return this.#command('createPlan', {input}, meta, (state, actorId) => {
      if (input.childId && !state.children.some(child => child.id === input.childId && !child.archived)) throw new LedgerError('VALIDATION', 'Choose an active child.');
      if (!state.categories.some(category => category.id === input.category)) throw new LedgerError('VALIDATION', 'Choose a category.');
      splitExpense(input.targetCents, input.reviewerShareBps);
      const plan: DemoPlan = {title: validateText(input.title, 'Title', 120), description: validateText(input.description, 'Description', 500, false), childId: input.childId, category: input.category, targetCents: input.targetCents, reviewerShareBps: input.reviewerShareBps, targetDate: input.targetDate ? validateDate(input.targetDate) : '', notes: validateText(input.notes, 'Notes', 1000, false), id: nextId(state, 'plan'), status: 'PLANNED', createdBy: actorId, createdAt: now(), convertedExpenseId: null};
      state.plans.push(plan); return plan;
    });
  }
  async convertPlan(id: string, meta: CreateMeta): Promise<ExpenseDetail> {
    return this.#command('convertPlan', {id}, meta, (state, actorId) => {
      const plan = state.plans.find(item => item.id === id);
      if (!plan) throw new LedgerError('FORBIDDEN', 'Plan not found.');
      if (plan.status !== 'PLANNED') throw new LedgerError('INVALID_STATE', 'This plan is already converted.');
      if (!plan.childId) throw new LedgerError('VALIDATION', 'A plan needs a child before conversion.');
      if (this.#access && !this.#access.canCreate()) throw new LedgerError('INVALID_STATE', 'The demo trial has ended. Enable test access to create an expense.');
      const expense = newDraft(state, actorId, {childId: plan.childId, category: plan.category, description: plan.description || plan.title, merchant: '', expenseDate: new Date().toISOString().slice(0,10), amountCents: plan.targetCents, reviewerShareBps: plan.reviewerShareBps});
      plan.status = 'CONVERTED'; plan.convertedExpenseId = expense.id; event(state, expense, actorId, 'PLAN_CONVERTED', `From plan: ${plan.title}`); return detailFor(state, expense);
    });
  }
  async listExpenses(): Promise<ExpenseDetail[]> {
    const state = this.#read();
    return state.expenses.filter(expense => visible(state, expense, this.#actorId)).sort((a, b) => b.expenseDate.localeCompare(a.expenseDate) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)).map(expense => detailFor(state, expense));
  }
  async getExpense(id: string): Promise<ExpenseDetail> { const state = this.#read(); return detailFor(state, findExpense(state, id, this.#actorId)); }
  async createDraft(input: DraftInput, meta: CreateMeta): Promise<ExpenseDetail> {
    return this.#command('createDraft', { input }, meta, (state, actorId) => {
      if (this.#access && !this.#access.canCreate()) throw new LedgerError('INVALID_STATE', 'The demo trial has ended. Enable test access to create an expense.');
      return detailFor(state, newDraft(state, actorId, input));
    });
  }
  async saveDraft(id: string, input: DraftInput, meta: MutationMeta): Promise<ExpenseDetail> {
    return this.#mutate(id, 'saveDraft', { input }, meta, (state, expense, actorId) => {
      assertCanEditDraft(expense, actorId);
      const fields = validateDraft(input, state.categories.map(category => category.id));
      const child = state.children.find(item => item.id === fields.childId && item.householdId === expense.householdId);
      if (!child) throw new LedgerError('FORBIDDEN', 'This child alias is unavailable.');
      Object.assign(expense, fields, { childAliasSnapshot: child.alias, reviewerOwedCents: splitExpense(fields.amountCents, fields.reviewerShareBps).reviewerOwedCents });
      event(state, expense, actorId, 'DRAFT_UPDATED', '', expense.amountCents);
    });
  }
  async submitExpense(id: string, meta: MutationMeta): Promise<ExpenseDetail> {
    return this.#mutate(id, 'submitExpense', {}, meta, (state, expense, actorId) => {
      assertCanSubmit(expense, actorId);
      validateDraft(draftFields(expense), state.categories.map(category => category.id));
      expense.status = 'PENDING'; expense.submittedAt = now();
      event(state, expense, actorId, 'SUBMITTED', '', expense.reviewerOwedCents);
    });
  }
  async reviewExpense(id: string, decision: 'APPROVE' | 'DISPUTE', note: string, meta: MutationMeta): Promise<ExpenseDetail> {
    return this.#mutate(id, 'reviewExpense', { decision, note }, meta, (state, expense, actorId) => {
      assertCanReview(expense, actorId, decision);
      const reason = validateText(note, 'Reason', 1000, decision === 'DISPUTE');
      expense.status = decision === 'APPROVE' ? 'APPROVED' : 'DISPUTED';
      event(state, expense, actorId, expense.status, reason, expense.reviewerOwedCents);
    });
  }
  async withdrawExpense(id: string, reason: string, meta: MutationMeta): Promise<ExpenseDetail> {
    return this.#mutate(id, 'withdrawExpense', { reason }, meta, (state, expense, actorId) => {
      assertCanWithdraw(expense, actorId);
      const note = validateText(reason, 'Reason', 1000, expense.submittedAt !== null);
      expense.status = 'WITHDRAWN'; event(state, expense, actorId, 'WITHDRAWN', note);
    });
  }
  async replaceExpenseWithDraft(id: string, reason: string, meta: MutationMeta): Promise<ExpenseDetail> {
    checkKey(meta);
    return this.#command('replaceExpenseWithDraft', { id, reason, expectedRevision: meta.expectedRevision }, meta, (state, actorId) => {
      const expense = findExpense(state, id, actorId);
      assertExpectedRevision(expense, meta); assertCanReplace(expense, actorId);
      if (state.reimbursements.some(report => report.expenseId === id)) throw new LedgerError('INVALID_STATE', 'An expense with recorded payments cannot be corrected.');
      const note = validateText(reason, 'Reason', 1000);
      const replacement = newDraft(state, actorId, draftFields(expense), id);
      expense.status = 'WITHDRAWN'; expense.lockVersion += 1;
      event(state, expense, actorId, 'WITHDRAWN', note);
      event(state, expense, actorId, 'REPLACEMENT_CREATED', `Replacement draft: ${replacement.id}. ${note}`);
      return detailFor(state, replacement);
    });
  }
  async reportReimbursement(expenseId: string, amountCents: number, paidOn: string, methodLabel: string, note: string, meta: MutationMeta): Promise<ExpenseDetail> {
    return this.#mutate(expenseId, 'reportReimbursement', { amountCents, paidOn, methodLabel, note }, meta, (state, expense, actorId) => {
      assertCanReport(expense, actorId);
      assertIntegerInRange(amountCents, 1, MAX_AMOUNT_CENTS, 'Payment amount');
      const date = validateDate(paidOn);
      const method = validateText(methodLabel, 'Payment method', 100, false);
      const message = validateText(note, 'Payment note', 1000, false);
      const settlement = deriveSettlement(expense.reviewerOwedCents, state.reimbursements.filter(report => report.expenseId === expenseId));
      if (amountCents > settlement.availableToReportCents) throw new LedgerError('AMOUNT_EXCEEDS_AVAILABLE', 'The amount exceeds the remaining share available to report.');
      const reimbursementId = nextId(state, 'payment');
      state.reimbursements.push({ id: reimbursementId, householdId: expense.householdId, expenseId, fromUserId: actorId, toUserId: expense.paidBy, amountCents, paidOn: date, methodLabel: method, note: message, status: 'PENDING', createdAt: now(), resolvedAt: null });
      event(state, expense, actorId, 'PAYMENT_REPORTED', message, amountCents, reimbursementId);
    });
  }
  async resolveReimbursement(reportId: string, decision: 'CONFIRM' | 'REJECT', note: string, meta: MutationMeta): Promise<ExpenseDetail> {
    checkKey(meta);
    return this.#command('resolveReimbursement', { reportId, decision, note, expectedRevision: meta.expectedRevision }, meta, (state, actorId) => {
      const report = state.reimbursements.find(item => item.id === reportId);
      if (!report) throw new LedgerError('FORBIDDEN', 'This payment is unavailable.');
      const expense = findExpense(state, report.expenseId, actorId);
      assertExpectedRevision(expense, meta); assertCanResolve(expense, report, actorId);
      if (decision !== 'CONFIRM' && decision !== 'REJECT') throw new LedgerError('VALIDATION', 'Choose confirm or reject.');
      const reason = validateText(note, 'Reason', 1000, decision === 'REJECT');
      report.status = decision === 'CONFIRM' ? 'CONFIRMED' : 'REJECTED'; report.resolvedAt = now();
      expense.lockVersion += 1;
      deriveSettlement(expense.reviewerOwedCents, state.reimbursements.filter(item => item.expenseId === expense.id));
      event(state, expense, actorId, decision === 'CONFIRM' ? 'PAYMENT_CONFIRMED' : 'PAYMENT_REJECTED', reason, report.amountCents, report.id);
      return detailFor(state, expense);
    });
  }
  async uploadReceipt(_draftId: string, _file: File, _meta: MutationMeta): Promise<ExpenseDetail> { throw new LedgerError('UPLOAD_INVALID', 'Only built-in sample receipts are available in demo. Upload real receipts in your private ledger.'); }
  async attachSampleReceipt(id: string, meta: MutationMeta): Promise<ExpenseDetail> {
    return this.#mutate(id, 'attachSampleReceipt', {}, meta, (state, expense, actorId) => {
      assertCanEditDraft(expense, actorId);
      state.receipts = state.receipts.filter(receipt => receipt.expenseId !== id);
      const receipt: DemoReceipt = { id: nextId(state, 'receipt'), expenseId: id };
      state.receipts.push(receipt); expense.receiptId = receipt.id;
      event(state, expense, actorId, 'SAMPLE_RECEIPT_ATTACHED', 'Built-in sample image.');
    });
  }
  async getReceiptAccess(receiptId: string): Promise<ReceiptAccess> {
    const state = this.#read();
    const receipt = state.receipts.find(item => item.id === receiptId);
    if (!receipt) throw new LedgerError('FORBIDDEN', 'This receipt is unavailable.');
    const expense = findExpense(state, receipt.expenseId, this.#actorId);
    if (expense.receiptId !== receiptId) throw new LedgerError('FORBIDDEN', 'This receipt is unavailable.');
    return { url: SAMPLE_URL, expiresAt: new Date(Date.now() + 60000).toISOString() };
  }
  async exportExpensesCsv(): Promise<string> { return exportExpensesCsv(await this.listExpenses()); }
}
