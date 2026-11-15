import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LedgerPort } from '../../data/ledger-port.ts';
import type { DemoLedger } from '../../data/demo-ledger.ts';
import type { DemoAccess } from '../../data/demo-access.ts';
import { CATEGORIES, LedgerError } from '../../domain/types.ts';
import type { ExpenseDetail, LedgerContext, MutationMeta } from '../../domain/types.ts';
import { deriveSettlement } from '../../domain/settlement.ts';
import { ErrorNotice, Link, Logo, Modal, dateLabel, errorMessage, titleCase, usd } from '../ui.tsx';
import { HouseholdPanel } from '../household/HouseholdPanel.tsx';
import { ExpenseForm } from './ExpenseForm.tsx';
import { ExpenseDetailView } from './ExpenseDetailView.tsx';
import type { RunCommand } from './commands.ts';
import { retainAcknowledgedExpense } from './commands.ts';

type Props = { port: LedgerPort; demo?: DemoLedger; demoPlan?: { access: DemoAccess; persistent: boolean }; selectedId: string | null; onSelect: (id: string | null) => void; onLogout?: () => Promise<void> };
const statusText = { DRAFT: 'Private draft', PENDING: 'Awaiting review', APPROVED: 'Agreed', DISPUTED: 'Disputed', WITHDRAWN: 'Withdrawn' };

export function LedgerView({ port, demo, demoPlan, selectedId, onSelect, onLogout }: Props) {
  const [context, setContext] = useState<LedgerContext | null>(null);
  const [expenses, setExpenses] = useState<ExpenseDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ initial: ExpenseDetail | null } | null>(null);
  const [householdOpen, setHouseholdOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [planRevision, setPlanRevision] = useState(0);
  const planStatus = demoPlan?.access.status();
  void planRevision;
  const openNewExpense = () => { if (demoPlan && !demoPlan.access.canCreate()) setPaywallOpen(true); else setEditor({ initial: null }); };
  const requestCorrection = () => { if (demoPlan && !demoPlan.access.canCreate()) { setPaywallOpen(true); return false; } return true; };
  const updatePlan = (action: 'expire' | 'reset' | 'enable') => { try { if (!demoPlan) return; if (action === 'expire') demoPlan.access.simulateExpiry(); else if (action === 'reset') demoPlan.access.reset(); else demoPlan.access.enableTestAccess(); setPlanRevision(value => value + 1); setError(null); if (action === 'enable') { setPaywallOpen(false); setEditor({ initial: null }); } } catch { setError('Demo access could not be saved in this browser.'); } };
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [child, setChild] = useState('ALL');
  const inFlight = useRef(false);
  const reads = useRef(0);
  const retryMeta = useRef(new Map<string, MutationMeta>());

  const refresh = useCallback(async () => {
    const sequence = ++reads.current;
    setRefreshing(true);
    try {
      const nextContext = await port.getContext();
      const nextExpenses = nextContext.household ? await port.listExpenses() : [];
      if (sequence === reads.current) { setContext(nextContext); setExpenses(nextExpenses); }
    } finally { if (sequence === reads.current) { setLoading(false); setRefreshing(false); } }
  }, [port]);

  useEffect(() => {
    void refresh().catch(cause => setError(errorMessage(cause)));
    const focus = () => { if (!inFlight.current) void refresh().catch(cause => setError(errorMessage(cause))); };
    window.addEventListener('focus', focus);
    return () => { reads.current += 1; window.removeEventListener('focus', focus); };
  }, [refresh]);

  const command: RunCommand = async (requestKey, revision, work) => {
    if (inFlight.current) throw new LedgerError('INVALID_STATE', 'An action is still saving. Please wait.');
    inFlight.current = true; setBusy(true); setError(null); setNotice(null);
    const meta = retryMeta.current.get(requestKey) ?? { idempotencyKey: crypto.randomUUID(), expectedRevision: revision ?? 0 };
    retryMeta.current.set(requestKey, meta);
    try {
      const result = await work(meta);
      retryMeta.current.delete(requestKey);
      setExpenses(previous => retainAcknowledgedExpense(previous, result));
      await refresh().catch(cause => setError(`Your action was saved, but the ledger could not refresh. ${errorMessage(cause)}`));
      setNotice('Your action was saved.');
      return result;
    } catch (cause) {
      if (cause instanceof LedgerError && cause.code !== 'BACKEND_UNAVAILABLE') {
        retryMeta.current.delete(requestKey);
        if (cause.code === 'STALE_REVISION') await refresh().catch(() => undefined);
      }
      setError(errorMessage(cause));
      throw cause;
    } finally { inFlight.current = false; setBusy(false); }
  };

  async function controlDemo(action: 'alex' | 'jordan' | 'clean' | 'examples') {
    if (!demo || inFlight.current) return;
    const previousActor = context?.userId;
    inFlight.current = true; setBusy(true); setError(null); setNotice(null);
    try {
      if (action === 'clean' || action === 'examples') {
        demo.reset(action);
        setExpenses([]); setCategory('ALL'); setStatus('ALL'); setChild('ALL');
      } else demo.setActor(action);
      retryMeta.current.clear(); onSelect(null);
      await refresh();
      setNotice(action === 'clean' ? 'A clean sample ledger is ready. Add a new expense to walk through the full cycle.' : action === 'examples' ? 'Loaded four separate examples, including a $10 payment awaiting confirmation.' : null);
    } catch (cause) {
      if (previousActor === 'alex' || previousActor === 'jordan') demo.setActor(previousActor);
      setError(errorMessage(cause));
    } finally { inFlight.current = false; setBusy(false); }
  }

  const balances = useMemo(() => {
    let owe = 0, owed = 0, awaiting = 0, disputed = 0, pending = 0;
    for (const { expense, reimbursements } of expenses) {
      if (expense.status === 'PENDING') awaiting += expense.reviewerOwedCents;
      if (expense.status === 'DISPUTED') disputed += expense.reviewerOwedCents;
      if (expense.status === 'APPROVED') {
        const settlement = deriveSettlement(expense.reviewerOwedCents, reimbursements);
        if (expense.reviewerId === context?.userId) owe += settlement.remainingCents;
        if (expense.paidBy === context?.userId) owed += settlement.remainingCents;
        pending += settlement.pendingCents;
      }
    }
    return { owe, owed, awaiting, disputed, pending };
  }, [expenses, context?.userId]);
  const rows = expenses.filter(({ expense, reimbursements }) => (category === 'ALL' || expense.category === category) && (child === 'ALL' || expense.childId === child) && (status === 'ALL' || (status === 'SETTLED' ? expense.status === 'APPROVED' && deriveSettlement(expense.reviewerOwedCents, reimbursements).status === 'SETTLED' : expense.status === status))).sort((a, b) => b.expense.createdAt.localeCompare(a.expense.createdAt));
  const selected = expenses.find(item => item.expense.id === selectedId);
  const person = (id: string | null) => context?.members.find(member => member.userId === id)?.displayName || 'Co-parent';
  const actorName = person(context?.userId ?? null);

  const exportCsv = async () => {
    setError(null);
    try { const csv = await port.exportExpensesCsv(); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'coparent-expenses.csv'; document.body.append(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); } catch (cause) { setError(errorMessage(cause)); }
  };

  return <div className="app-shell">
    {demo && <div className="demo-banner"><div><strong>Demo — sample data, no money moves.</strong><span> Local to this tab. Real accounts use a separate service.</span></div><Link to="/login">Go to real sign-in →</Link></div>}
    <header className="app-nav"><Logo /><nav aria-label="Main navigation"><button className={!selectedId ? 'nav-current' : ''} onClick={() => onSelect(null)}>Your ledger</button><Link to="/pricing">Pricing</Link>{!demo && <button onClick={() => setHouseholdOpen(!householdOpen)} aria-expanded={householdOpen}>Household</button>}</nav><div className="account"><span className="avatar" aria-hidden="true">{actorName[0]}</span><span>{actorName}</span>{onLogout && <button className="text-button" disabled={busy} onClick={async () => { try { await onLogout(); } catch (cause) { setError(errorMessage(cause)); } }}>Sign out</button>}</div></header>
    <main className="ledger-main">
      {demo && <section className="demo-controls" aria-label="Sample demo controls"><label htmlFor="demo-person">View as <select id="demo-person" value={context?.userId ?? 'alex'} disabled={busy} onChange={event => void controlDemo(event.target.value as 'alex' | 'jordan')}><option value="alex">Alex</option><option value="jordan">Jordan</option></select></label><div><button className="button button-small button-secondary" disabled={busy} onClick={() => void controlDemo('clean')}>Start clean</button><button className="button button-small button-secondary" disabled={busy} onClick={() => void controlDemo('examples')}>Load examples</button></div></section>}
      {demoPlan && <section className="demo-plan-controls" aria-label="Demo subscription controls"><div><strong>{planStatus === 'trial' ? '14-day demo trial active' : planStatus === 'expired' ? 'Demo trial ended' : 'Test access enabled'}</strong><p className="field-help">Demo controls only. {demoPlan.persistent ? 'Test access is stored in this browser until reset or browser data is cleared.' : 'Browser storage unavailable: test access lasts only in this tab.'} Expenses remain in this tab only.</p></div><div className="modal-actions"><button className="button button-small button-secondary" onClick={() => updatePlan('expire')}>Simulate end of trial</button><button className="button button-small button-secondary" onClick={() => updatePlan('reset')}>Reset demo access</button></div></section>}
      <ErrorNotice message={error} />{notice && <div className="notice notice-success" role="status">{notice}</div>}
      {loading ? <div className="empty-state" role="status"><div className="loading-line" /><h2>Opening your ledger…</h2></div> : !context ? <div className="empty-state"><h2>We could not open the ledger.</h2><button className="button" onClick={() => void refresh().catch(cause => setError(errorMessage(cause)))}>Try again</button></div> : <>
        {(!context.household || householdOpen || context.children.length === 0 || context.members.length < 2) && <HouseholdPanel context={context} port={port} command={command} busy={busy} />}
        {context.household && (selectedId ? selected ? <ExpenseDetailView key={selected.expense.id} detail={selected} context={context} port={port} demo={demo} command={command} busy={busy} onBack={() => onSelect(null)} onEdit={() => setEditor({ initial: selected })} onSelect={onSelect} onRequestCorrection={requestCorrection} /> : <div className="empty-state"><h2>This record is not available.</h2><p>You may be viewing a private draft belonging to the other parent, or the record may be unavailable to this account.</p><button className="button" onClick={() => onSelect(null)}>Back to ledger</button></div> : <>
          <div className="page-heading"><div><span className="eyebrow">Shared expenses. Clear records.</span><h1>Your ledger</h1><p>A shared view of what’s agreed, received, and still remaining.</p></div><div className="heading-actions"><button className="button button-secondary" disabled={busy || refreshing} onClick={() => void refresh().then(() => setNotice('Ledger refreshed.')).catch(cause => setError(errorMessage(cause)))}>{refreshing ? 'Refreshing…' : 'Refresh'}</button><button className="button" disabled={busy || context.children.length === 0} onClick={openNewExpense}><span aria-hidden="true">＋</span> Add expense</button></div></div>
          <section className="balance-grid" aria-label="Agreed remaining balances"><article className="balance-card"><span className="balance-label">You owe</span><strong>{usd(balances.owe)}</strong><p>Your agreed share still to reimburse.</p></article><article className="balance-card balance-card-tinted"><span className="balance-label">Owed to you</span><strong>{usd(balances.owed)}</strong><p>Agreed shares still to be received.</p></article><article className="balance-explanation"><span className="small-mark" aria-hidden="true">↔</span><h3>Two directions. One clear record.</h3><p>Balances stay separate. A payment changes the remaining amount only after its recipient confirms it.</p></article></section>
          <section className="review-strip" aria-label="Amounts outside or awaiting confirmation"><div><span className="status-dot" aria-hidden="true" /><span>Awaiting review <strong>{usd(balances.awaiting)}</strong></span><small>Proposed shares</small></div><div><span className="status-dot" aria-hidden="true" /><span>Disputed <strong>{usd(balances.disputed)}</strong></span><small>Proposed shares</small></div><div><span className="status-dot dot-teal" aria-hidden="true" /><span>Payments awaiting confirmation <strong>{usd(balances.pending)}</strong></span><small>Already included in the balances above</small></div></section>
          <section className="expenses-section"><div className="section-heading"><h2>Expenses <span className="count">{expenses.length}</span></h2><button className="text-button" disabled={busy || expenses.length === 0} onClick={() => void exportCsv()}>Export CSV <span aria-hidden="true">↗</span></button></div>
            <div className="filter-bar"><div><label htmlFor="filter-status">Status</label><select id="filter-status" value={status} onChange={event => setStatus(event.target.value)}><option value="ALL">All statuses</option>{Object.entries(statusText).map(([value, label]) => <option value={value} key={value}>{label}</option>)}<option value="SETTLED">Fully reimbursed</option></select></div><div><label htmlFor="filter-category">Category</label><select id="filter-category" value={category} onChange={event => setCategory(event.target.value)}><option value="ALL">All categories</option>{CATEGORIES.map(item => <option key={item} value={item}>{titleCase(item)}</option>)}</select></div><div><label htmlFor="filter-child">Child</label><select id="filter-child" value={child} onChange={event => setChild(event.target.value)}><option value="ALL">All children</option>{context.children.map(item => <option key={item.id} value={item.id}>{item.alias}</option>)}</select></div><span className="sort-label">Newest first</span></div>
            {rows.length === 0 ? <div className="empty-state"><span className="empty-icon" aria-hidden="true">＋</span><h3>{expenses.length ? 'No expenses match these filters.' : 'Start with one expense.'}</h3><p>{expenses.length ? 'Try a different category, child or status.' : 'Add what you paid, attach a receipt, and propose your co-parent’s share.'}</p>{!expenses.length && <button className="button" disabled={busy || context.children.length === 0} onClick={openNewExpense}>Add your first expense</button>}</div> : <><div className="expense-columns" aria-hidden="true"><span>Expense</span><span>Total</span><span>Co-parent’s share</span><span>Status</span><span /></div><div className="expense-list">{rows.map(({ expense, reimbursements }) => { const settlement = expense.status === 'APPROVED' ? deriveSettlement(expense.reviewerOwedCents, reimbursements) : null; return <button className="expense-row" key={expense.id} onClick={() => onSelect(expense.id)}><span className="expense-title-cell"><span className={`category-mark category-${expense.category.toLowerCase()}`} aria-hidden="true">{{ SCHOOL: 'Sc', MEDICAL: 'Me', ACTIVITIES: 'Ac', PURCHASES: 'Pu', OTHER: 'Ot' }[expense.category]}</span><span><strong>{expense.description}</strong><small>{expense.childAliasSnapshot} · {titleCase(expense.category)} · {dateLabel(expense.expenseDate)}</small><small>Paid by {person(expense.paidBy)}</small></span></span><span className="row-money"><small className="mobile-label">Total</small><strong>{usd(expense.amountCents)}</strong></span><span className="row-money"><small className="mobile-label">{settlement ? 'Agreed share' : 'Proposed share'}</small><strong>{usd(expense.reviewerOwedCents)}</strong><small>{settlement ? `${usd(settlement.remainingCents)} remaining` : 'Proposed'}</small></span><span className="row-status"><span className={`badge badge-${expense.status.toLowerCase()}`}>{statusText[expense.status]}</span>{settlement && <small>{settlement.status === 'NOT_REQUIRED' ? 'No reimbursement required' : settlement.status === 'SETTLED' ? 'Fully reimbursed' : settlement.status === 'PARTIAL' ? 'Partly reimbursed' : 'Not yet reimbursed'}</small>}</span><span className="row-chevron" aria-hidden="true">↗</span></button>; })}</div></>}
          </section>
          <p className="ledger-footnote">Only agreed expenses count toward balances. Expenses and payments awaiting review remain visible separately.</p>
        </>)}
      </>}
    </main>
    <footer className="app-footer"><span>CoParent Ledger</span><span>External payments are recorded here, never processed.</span></footer>
    {paywallOpen && <Modal title="Keep your shared ledger going" onClose={() => setPaywallOpen(false)}><p className="demo-plan-price">$7.99 <span>/ month per household</span></p><p>Both parents are included. Record expenses, attach sample receipts, agree on shares and track reimbursements together.</p><div className="notice"><strong>Test access only — no payment.</strong><p>No card, billing or real subscription is connected. This browser-local demo does not process payments.</p></div><p className="field-help">Existing expenses, receipts, history, CSV export and payment confirmations remain available.</p><div className="modal-actions"><button className="button button-secondary" onClick={() => setPaywallOpen(false)}>Not now</button><button className="button" onClick={() => updatePlan('enable')}>Enable test access — no payment</button></div></Modal>}
    {editor && context && <ExpenseForm initial={editor.initial} context={context} port={port} demo={demo} command={command} onClose={() => setEditor(null)} onSaved={detail => { setEditor(null); onSelect(detail.expense.id); }} />}
  </div>;
}
