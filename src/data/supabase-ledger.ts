import type { LedgerPort } from './ledger-port.ts';
import type { Child, CreateMeta, DraftInput, ErrorCode, ExpenseDetail, InviteResult, LedgerContext, MutationMeta, ReceiptAccess } from '../domain/types.ts';
import { LedgerError } from '../domain/types.ts';
import { exportExpensesCsv } from '../domain/csv.ts';

export interface RpcTransport {
  rpc<T>(name: string, args: Record<string, unknown>): Promise<T>;
  upload<T>(draftId: string, file: File, meta: MutationMeta): Promise<T>;
  receiptAccess(receiptId: string): Promise<ReceiptAccess>;
}

export class SupabaseLedger implements LedgerPort {
  private transport: RpcTransport;
  private origin: string;
  constructor(transport: RpcTransport, origin = '') { this.transport = transport; this.origin = origin; }
  private read<T>(operation: string, id: string | null = null) { return this.transport.rpc<T>('ledger_read', {p_operation: operation, p_id: id}); }
  private command<T>(operation: string, payload: Record<string, unknown>, meta: CreateMeta | MutationMeta) {
    return this.transport.rpc<T>('ledger_command', {p_operation: operation, p_payload: payload, p_expected_revision: 'expectedRevision' in meta ? meta.expectedRevision : null, p_idempotency_key: meta.idempotencyKey});
  }
  getContext() { return this.read<LedgerContext>('getContext'); }
  createHousehold(meta: CreateMeta) { return this.command<LedgerContext>('createHousehold', {}, meta); }
  createInvite(email: string) { return this.transport.rpc<InviteResult>('ledger_create_invite', {p_email: email, p_base_url: this.origin}); }
  acceptInvite(token: string, meta: CreateMeta) { return this.command<LedgerContext>('acceptInvite', {token}, meta); }
  listChildren() { return this.read<Child[]>('listChildren'); }
  createChild(alias: string, meta: CreateMeta) { return this.command<Child>('createChild', {alias}, meta); }
  listExpenses() { return this.read<ExpenseDetail[]>('listExpenses'); }
  getExpense(id: string) { return this.read<ExpenseDetail>('getExpense', id); }
  createDraft(input: DraftInput, meta: CreateMeta) { return this.command<ExpenseDetail>('createDraft', {input}, meta); }
  saveDraft(id: string, input: DraftInput, meta: MutationMeta) { return this.command<ExpenseDetail>('saveDraft', {id, input}, meta); }
  submitExpense(id: string, meta: MutationMeta) { return this.command<ExpenseDetail>('submitExpense', {id}, meta); }
  reviewExpense(id: string, decision: 'APPROVE' | 'DISPUTE', note: string, meta: MutationMeta) { return this.command<ExpenseDetail>('reviewExpense', {id, decision, note}, meta); }
  withdrawExpense(id: string, reason: string, meta: MutationMeta) { return this.command<ExpenseDetail>('withdrawExpense', {id, reason}, meta); }
  replaceExpenseWithDraft(id: string, reason: string, meta: MutationMeta) { return this.command<ExpenseDetail>('replaceExpenseWithDraft', {id, reason}, meta); }
  reportReimbursement(expenseId: string, amountCents: number, paidOn: string, methodLabel: string, note: string, meta: MutationMeta) { return this.command<ExpenseDetail>('reportReimbursement', {expenseId, amountCents, paidOn, methodLabel, note}, meta); }
  resolveReimbursement(reportId: string, decision: 'CONFIRM' | 'REJECT', note: string, meta: MutationMeta) { return this.command<ExpenseDetail>('resolveReimbursement', {reportId, decision, note}, meta); }
  uploadReceipt(draftId: string, file: File, meta: MutationMeta) { return this.transport.upload<ExpenseDetail>(draftId, file, meta); }
  getReceiptAccess(receiptId: string) { return this.transport.receiptAccess(receiptId); }
  async exportExpensesCsv() { return exportExpensesCsv(await this.listExpenses()); }
}

export interface AuthUser { id: string; email: string }
export interface AuthPort {
  getUser(): Promise<AuthUser | null>;
  login(email: string, password: string): Promise<void>;
  signup(email: string, password: string, redirectTo: string): Promise<{needsEmailConfirmation: boolean}>;
  logout(): Promise<void>;
  onAuthChange(callback: () => void): () => void;
}
type Session = {access_token: string; refresh_token: string; expires_at: number};
type SessionResponse = {access_token?: string; refresh_token?: string; expires_in?: number; expires_at?: number};
const SESSION_KEY = 'coparent:auth-session';
const CODES: ErrorCode[] = ['UNAUTHENTICATED','FORBIDDEN','VALIDATION','INVALID_STATE','STALE_REVISION','IDEMPOTENCY_CONFLICT','AMOUNT_EXCEEDS_AVAILABLE','INVITE_INVALID','HOUSEHOLD_FULL','UPLOAD_INVALID','BACKEND_UNAVAILABLE'];

export function toLedgerError(status: number, body: unknown): LedgerError {
  const data = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const message = typeof data.message === 'string' ? data.message : typeof data.error_description === 'string' ? data.error_description : typeof data.error === 'string' ? data.error : '';
  const code = CODES.find(c => data.code === c || message === c || message.startsWith(`${c}:`));
  if (code) return new LedgerError(code, message || code);
  if (status === 401) return new LedgerError('UNAUTHENTICATED', 'Please sign in again.');
  if (status === 403) return new LedgerError('FORBIDDEN', 'This action is not available to this account.');
  // Do not reflect arbitrary database internals or provider responses into the UI.
  return new LedgerError(status >= 500 ? 'BACKEND_UNAVAILABLE' : 'VALIDATION', status >= 500 ? 'The service is unavailable. Your change has not been confirmed.' : 'The request could not be completed. Check your details and try again.');
}

/** Browser REST client. Secrets remain in Supabase; only its public anon/publishable key belongs here. */
export function createRealServices(): {ledger: LedgerPort; auth: AuthPort} | null {
  const env = (import.meta as ImportMeta & {env?: Record<string,string>}).env ?? {};
  const base = env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  const publicKey = env.VITE_SUPABASE_ANON_KEY;
  if (!base || !publicKey) return null;
  if (!/^https:\/\//.test(base) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(base)) return null;
  const callbacks = new Set<() => void>();
  let session: Session | null = null;
  let refreshPromise: Promise<void> | null = null;
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null') as Session | null;
    if (saved && typeof saved.access_token === 'string' && typeof saved.refresh_token === 'string' && Number.isFinite(saved.expires_at)) session = saved;
  } catch { try { sessionStorage.removeItem(SESSION_KEY); } catch { /* getUser stays signed out; login reports unavailable storage below. */ } }
  function save(value: Session | null) {
    try {
      if (value) sessionStorage.setItem(SESSION_KEY, JSON.stringify(value)); else sessionStorage.removeItem(SESSION_KEY);
    } catch { session = null; throw new LedgerError('BACKEND_UNAVAILABLE', 'Browser session storage is unavailable. Enable storage for this site to sign in.'); }
    session = value;
    callbacks.forEach(cb => queueMicrotask(cb));
  }
  function apply(response: SessionResponse) {
    if (!response.access_token || !response.refresh_token) return false;
    save({access_token:response.access_token,refresh_token:response.refresh_token,expires_at:response.expires_at ?? Math.floor(Date.now()/1000) + (response.expires_in ?? 3600)});
    return true;
  }
  // Supabase's documented implicit email-confirmation callback. The user is validated via /user below.
  const hash = new URLSearchParams(window.location.hash.slice(1));
  if (hash.has('access_token') && hash.has('refresh_token')) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    apply({access_token:hash.get('access_token')!,refresh_token:hash.get('refresh_token')!,expires_in:Number(hash.get('expires_in') ?? 3600)});
  }
  async function request<T>(path: string, options: {method?: string; body?: unknown; bearer?: string; multipart?: boolean} = {}): Promise<T> {
    let response: Response;
    const headers: Record<string,string> = {apikey: publicKey!};
    if (options.bearer) headers.Authorization = `Bearer ${options.bearer}`;
    if (!options.multipart) headers['Content-Type'] = 'application/json';
    try {
      response = await fetch(`${base}${path}`, {method:options.method ?? 'POST',headers,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',body:options.body === undefined ? undefined : options.multipart ? options.body as FormData : JSON.stringify(options.body)});
    } catch { throw new LedgerError('BACKEND_UNAVAILABLE', 'Unable to reach the service. Your change has not been confirmed.'); }
    const raw = await response.text();
    let body: unknown = null;
    try { body = raw ? JSON.parse(raw) : null; } catch { throw new LedgerError('BACKEND_UNAVAILABLE', 'The service returned an invalid response.'); }
    if (!response.ok) throw toLedgerError(response.status, body);
    return body as T;
  }
  async function token() {
    if (!session) throw new LedgerError('UNAUTHENTICATED', 'Please sign in.');
    if (session.expires_at <= Date.now()/1000 + 60) {
      if (!refreshPromise) {
        const refreshToken = session.refresh_token;
        refreshPromise = request<SessionResponse>('/auth/v1/token?grant_type=refresh_token', {body:{refresh_token:refreshToken}}).then(result => {
          if (!apply(result)) throw new LedgerError('UNAUTHENTICATED','Please sign in again.');
        }).catch(error => {
          if (error instanceof LedgerError && error.code !== 'BACKEND_UNAVAILABLE') save(null);
          throw error;
        }).finally(() => { refreshPromise = null; });
      }
      await refreshPromise;
    }
    if (!session) throw new LedgerError('UNAUTHENTICATED','Please sign in.');
    return session.access_token;
  }
  const auth: AuthPort = {
    async getUser() {
      if (!session) return null;
      try {
        const user = await request<{id:string;email?:string}>('/auth/v1/user',{method:'GET',bearer:await token()});
        return {id:user.id,email:user.email ?? ''};
      } catch (error) {
        if (error instanceof LedgerError && error.code === 'UNAUTHENTICATED') { save(null); return null; }
        throw error;
      }
    },
    async login(email,password) {
      const result = await request<SessionResponse>('/auth/v1/token?grant_type=password',{body:{email:email.trim(),password}});
      if (!apply(result)) throw new LedgerError('UNAUTHENTICATED','Please confirm your email before signing in.');
    },
    async signup(email,password,redirectTo) {
      const redirect = new URL(redirectTo,window.location.origin);
      if (redirect.origin !== window.location.origin) throw new LedgerError('VALIDATION','Invalid confirmation destination.');
      const result = await request<SessionResponse>(`/auth/v1/signup?redirect_to=${encodeURIComponent(redirect.href)}`,{body:{email:email.trim(),password}});
      return {needsEmailConfirmation:!apply(result)};
    },
    async logout() {
      try { if(session) await request('/auth/v1/logout',{bearer:await token()}); } finally { save(null); }
    },
    onAuthChange(callback) { callbacks.add(callback); return () => { callbacks.delete(callback); }; },
  };
  const transport: RpcTransport = {
    async rpc<T>(name: string,args: Record<string,unknown>) { return request<T>(`/rest/v1/rpc/${name}`,{body:args,bearer:await token()}); },
    async upload<T>(draftId: string,file: File,meta: MutationMeta) {
      const form = new FormData();
      form.set('draftId',draftId);form.set('expectedRevision',String(meta.expectedRevision));form.set('idempotencyKey',meta.idempotencyKey);form.set('file',file);
      return request<T>('/functions/v1/receipt-upload',{body:form,multipart:true,bearer:await token()});
    },
    async receiptAccess(receiptId) { return request<ReceiptAccess>('/functions/v1/receipt-access',{body:{receiptId},bearer:await token()}); },
  };
  return {ledger:new SupabaseLedger(transport,window.location.origin),auth};
}
