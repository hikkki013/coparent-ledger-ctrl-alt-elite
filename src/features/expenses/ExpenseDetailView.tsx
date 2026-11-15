import { useState } from 'react';
import type { LedgerPort } from '../../data/ledger-port.ts';
import type { DemoLedger } from '../../data/demo-ledger.ts';
import { LedgerError } from '../../domain/types.ts';
import type { ExpenseDetail, LedgerContext, ReceiptAccess, Reimbursement } from '../../domain/types.ts';
import { deriveSettlement } from '../../domain/settlement.ts';
import { splitExpense } from '../../domain/money.ts';
import { ErrorNotice, Modal, dateLabel, errorMessage, percentage, timeLabel, titleCase, usd } from '../ui.tsx';
import { RecordPaymentDialog } from '../reimbursements/RecordPaymentDialog.tsx';
import { commandKey } from './commands.ts';
import type { RunCommand } from './commands.ts';

type ActionKind = 'APPROVE' | 'DISPUTE' | 'WITHDRAW' | 'REPLACE' | 'CONFIRM' | 'REJECT' | 'SUBMIT';
type ActionState = { kind: ActionKind; detail: ExpenseDetail; report?: Reimbursement };
type Props = { detail: ExpenseDetail; context: LedgerContext; port: LedgerPort; demo?: DemoLedger; command: RunCommand; busy: boolean; onBack: () => void; onEdit: () => void; onSelect: (id: string | null) => void; onRequestCorrection?: () => boolean };

export function ExpenseDetailView({ detail, context, port, demo, command, busy, onBack, onEdit, onSelect, onRequestCorrection }: Props) {
  const { expense, reimbursements, audit } = detail;
  const [action, setAction] = useState<ActionState | null>(null);
  const [reportDetail, setReportDetail] = useState<ExpenseDetail | null>(null);
  const [receipt, setReceipt] = useState<ReceiptAccess | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const settlement = deriveSettlement(expense.reviewerOwedCents, reimbursements);
  const approved = expense.status === 'APPROVED';
  const isPayer = context.userId === expense.paidBy;
  const isReviewer = context.userId === expense.reviewerId;
  const person = (id: string | null) => context.members.find(member => member.userId === id)?.displayName ?? 'Co-parent';
  const openAction = (kind: ActionKind, report?: Reimbursement) => { if (kind === 'REPLACE' && onRequestCorrection && !onRequestCorrection()) return; setAction({ kind, detail, report }); };
  const openReceipt = async () => { if (!expense.receiptId) return; setReceiptLoading(true); setError(null); try { setReceipt(await port.getReceiptAccess(expense.receiptId)); } catch (cause) { setError(errorMessage(cause)); } finally { setReceiptLoading(false); } };
  const concern = expense.status === 'DISPUTED' ? [...audit].reverse().find(event => event.note && /DISPUT|CONCERN/i.test(event.action))?.note : null;
  const status = { DRAFT: 'Private draft', PENDING: 'Awaiting review', APPROVED: 'Agreed', DISPUTED: 'Disputed', WITHDRAWN: 'Withdrawn' }[expense.status];
  return <section className="expense-detail"><button className="text-button back-link" onClick={onBack}>← Back to ledger</button><div className="page-heading"><div><span className={`badge badge-${expense.status.toLowerCase()}`}>{status}</span><h1>{expense.description}</h1><p>{expense.childAliasSnapshot} · {titleCase(expense.category)} · {dateLabel(expense.expenseDate)} · Paid by {person(expense.paidBy)}</p></div><strong className="detail-total">{usd(expense.amountCents)}<small>Total expense</small></strong></div><ErrorNotice message={error} />
    {concern && <div className="notice concern-note"><strong>Concern raised</strong><p>{concern}</p><small>The proposed share is excluded from agreed balances.</small></div>}
    <div className="detail-grid"><div className="detail-main"><section className="panel"><div className="section-heading"><h2>The expense</h2>{expense.receiptId && <span className="badge badge-draft">Receipt attached</span>}</div><dl className="expense-facts"><div><dt>Paid by</dt><dd>{person(expense.paidBy)}</dd></div><div><dt>Merchant</dt><dd>{expense.merchant || 'Not added'}</dd></div><div><dt>{approved ? 'Agreed co-parent’s share' : 'Proposed co-parent’s share'}</dt><dd>{usd(expense.reviewerOwedCents)} <span className="muted">({percentage(expense.reviewerShareBps)}%)</span></dd></div><div><dt>Payer’s share</dt><dd>{usd(splitExpense(expense.amountCents, expense.reviewerShareBps).payerShareCents)}</dd></div></dl>{expense.receiptId ? <div className="receipt-box"><span className="receipt-icon" aria-hidden="true">▤</span><div><strong>{demo ? 'SAMPLE receipt' : 'Expense receipt'}</strong><small>{demo ? 'Built-in synthetic image' : 'Visible only to authorized parents'}</small></div><button className="button button-small button-secondary" disabled={receiptLoading} onClick={() => void openReceipt()}>{receiptLoading ? 'Opening…' : 'View receipt'}</button></div> : <p className="receipt-empty">Receipt not attached.</p>}{expense.replacesExpenseId && <p className="field-help">This is a new draft correcting an earlier expense. The earlier record and its receipt are preserved. It requires its own review.</p>}{approved && <p className="field-help">This agreed snapshot is preserved. Editing, withdrawal and reversals are not supported in this MVP.</p>}</section>
      <section className="panel"><div className="section-heading"><h2>Reimbursements</h2><span className="count">{reimbursements.length}</span></div><p className="section-intro">External payments are recorded here. The recipient confirms what arrived.</p>{reimbursements.length === 0 ? <p className="soft-empty">No payments recorded.</p> : <div className="payments-list">{[...reimbursements].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(report => <article className="payment-card" key={report.id}><div className="payment-top"><strong>{usd(report.amountCents)}</strong><span className={`badge badge-${report.status === 'PENDING' ? 'pending' : report.status === 'CONFIRMED' ? 'approved' : 'withdrawn'}`}>{report.status === 'PENDING' ? 'Awaiting receipt confirmation' : report.status === 'CONFIRMED' ? 'Receipt confirmed' : 'Not received'}</span></div><p>{person(report.fromUserId)} → {person(report.toUserId)} · {dateLabel(report.paidOn)}</p>{report.methodLabel && <p className="field-help">Method label: {report.methodLabel}</p>}{report.note && <p className="payment-note">{report.note}</p>}{report.status === 'PENDING' && report.toUserId === context.userId ? <div className="payment-actions"><button className="button button-small" disabled={busy} onClick={() => openAction('CONFIRM', report)}>I received this payment</button><button className="button button-small button-secondary" disabled={busy} onClick={() => openAction('REJECT', report)}>I have not received this payment</button></div> : report.status === 'PENDING' ? <small className="field-help">The remaining amount has not changed. Waiting for {person(report.toUserId)} to confirm.</small> : null}</article>)}</div>}</section>
      <section className="panel"><h2>Activity history</h2><p className="section-intro">A record of the decisions and updates on this expense.</p><ol className="activity-list">{[...audit].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(event => <li key={event.id}><span className="activity-marker" aria-hidden="true" /><div><div className="activity-title"><strong>{titleCase(event.action)}</strong>{event.amountCents !== null && <span>{usd(event.amountCents)}</span>}</div><small>{person(event.actorId)} · <time dateTime={event.createdAt}>{timeLabel(event.createdAt)}</time></small>{event.note && <p>{event.note}</p>}</div></li>)}</ol>{audit.length === 0 && <p className="soft-empty">No activity yet.</p>}</section></div>
      <aside className="detail-aside"><section className="settlement-card"><span className="eyebrow">{approved ? 'Agreed reimbursement' : 'Proposed reimbursement'}</span><strong className="share-amount">{usd(expense.reviewerOwedCents)}</strong><p>{person(expense.reviewerId)}’s {percentage(expense.reviewerShareBps)}% share</p><dl className="settlement-totals"><div><dt>Confirmed received</dt><dd>{usd(settlement.confirmedCents)}</dd></div><div><dt>Awaiting receipt confirmation</dt><dd>{usd(settlement.pendingCents)}</dd></div><div className="remaining-line"><dt>Remaining</dt><dd>{approved ? usd(settlement.remainingCents) : 'Not agreed'}</dd></div></dl><p className="field-help">{approved ? 'Payments awaiting confirmation are included in the remaining amount.' : 'A proposed share does not count toward either parent’s agreed balance.'}</p>
        {isPayer && expense.status === 'DRAFT' && <div className="stack-actions"><button className="button" disabled={busy} onClick={onEdit}>Edit draft</button><button className="button button-secondary" disabled={busy || context.members.length < 2} onClick={() => openAction('SUBMIT')}>Send for review</button>{context.members.length < 2 && <small>Connect your co-parent before sending.</small>}<button className="text-button" disabled={busy} onClick={() => openAction('WITHDRAW')}>Withdraw draft</button></div>}
        {isReviewer && (expense.status === 'PENDING' || expense.status === 'DISPUTED') && <div className="stack-actions"><button className="button" disabled={busy} onClick={() => openAction('APPROVE')}>{expense.status === 'DISPUTED' ? 'Approve unchanged share' : 'Approve share'}</button>{expense.status === 'PENDING' && <button className="button button-secondary" disabled={busy} onClick={() => openAction('DISPUTE')}>Raise a concern</button>}</div>}
        {isPayer && (expense.status === 'PENDING' || expense.status === 'DISPUTED') && <div className="stack-actions"><button className="button button-secondary" disabled={busy} onClick={() => openAction('REPLACE')}>Create corrected draft</button><button className="text-button" disabled={busy} onClick={() => openAction('WITHDRAW')}>Withdraw expense</button></div>}
        {approved && isReviewer && settlement.availableToReportCents > 0 && <div className="stack-actions"><button className="button" disabled={busy} onClick={() => setReportDetail(detail)}>Record external payment</button><small>Available to record: {usd(settlement.availableToReportCents)}</small></div>}
        {approved && settlement.status === 'NOT_REQUIRED' && <div className="notice notice-success">No reimbursement is required for this expense.</div>}
        {approved && settlement.status === 'SETTLED' && <div className="notice notice-success">Fully reimbursed. Receipt has been confirmed.</div>}
        {approved && isReviewer && settlement.availableToReportCents === 0 && settlement.pendingCents > 0 && <p className="field-help">All remaining funds have been reported. Wait for the recipient’s confirmation before recording another payment.</p>}
      </section><p className="aside-note">No bank connection. No money moves through CoParent Ledger.</p></aside>
    </div>
    {action && <ActionDialog state={action} port={port} command={command} onClose={() => setAction(null)} onResult={result => { setAction(null); onSelect(result.expense.id); }} person={person} />}
    {reportDetail && <RecordPaymentDialog detail={reportDetail} port={port} command={command} onClose={() => setReportDetail(null)} recipient={person(reportDetail.expense.paidBy)} />}
    {receipt && <Modal title={demo ? 'SAMPLE receipt' : 'Expense receipt'} onClose={() => setReceipt(null)}><ErrorNotice message={error} /><img className="receipt-preview" src={receipt.url} alt={demo ? 'Synthetic sample receipt for demonstration only' : 'Uploaded expense receipt'} onError={() => setError('Receipt access may have expired. Close the preview and open it again.')} /><p className="field-help">{demo ? 'This is a synthetic image. No personal receipt was uploaded.' : `Temporary access expires at ${new Date(receipt.expiresAt).toLocaleTimeString('en-US')}.`}</p><div className="modal-actions"><button className="button button-secondary" disabled={receiptLoading} onClick={() => void openReceipt()}>Refresh receipt access</button><a className="button" href={receipt.url} target="_blank" rel="noreferrer">Open / download image ↗</a></div></Modal>}
  </section>;
}

function ActionDialog({ state, port, command, onClose, onResult, person }: { state: ActionState; port: LedgerPort; command: RunCommand; onClose: () => void; onResult: (detail: ExpenseDetail) => void; person: (id: string | null) => string }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteError, setNoteError] = useState(false);
  const { expense } = state.detail;
  const requiredNote = state.kind === 'DISPUTE' || state.kind === 'REJECT' || state.kind === 'REPLACE' || (state.kind === 'WITHDRAW' && expense.submittedAt !== null);
  const titles: Record<ActionKind, string> = { APPROVE: expense.status === 'DISPUTED' ? 'Approve the unchanged share' : 'Approve this share', DISPUTE: 'Raise a concern', WITHDRAW: 'Withdraw this expense', REPLACE: 'Create a corrected draft', CONFIRM: 'Confirm you received this payment', REJECT: 'Mark this payment as not received', SUBMIT: 'Send this expense for review' };
  const labels: Record<ActionKind, string> = { APPROVE: `Approve ${usd(expense.reviewerOwedCents)} share`, DISPUTE: 'Raise concern', WITHDRAW: 'Withdraw expense', REPLACE: 'Withdraw and create draft', CONFIRM: `Confirm receipt of ${usd(state.report?.amountCents ?? 0)}`, REJECT: 'Confirm not received', SUBMIT: 'Send for review' };
  const explanations: Record<ActionKind, string> = {
    APPROVE: `You are agreeing to reimburse ${usd(expense.reviewerOwedCents)} (${percentage(expense.reviewerShareBps)}% of ${usd(expense.amountCents)}) to ${person(expense.paidBy)}. This agreed snapshot cannot be edited or withdrawn in this MVP.`,
    DISPUTE: 'Explain what needs clarification. This proposed share will remain outside the agreed balance.',
    WITHDRAW: 'The expense stays in the activity history. A withdrawn expense cannot be reopened.',
    REPLACE: 'The original expense will be withdrawn and preserved. A new private draft will be created without a receipt. You can edit it and send it for a new review.',
    CONFIRM: `Confirm that you actually received ${usd(state.report?.amountCents ?? 0)} from ${person(state.report?.fromUserId ?? null)} outside this service. This reduces the remaining amount and cannot be reversed in this MVP.`,
    REJECT: `The reported ${usd(state.report?.amountCents ?? 0)} will be marked as not received. The agreed remaining amount will not change.`,
    SUBMIT: `Ask your co-parent to review a ${usd(expense.reviewerOwedCents)} share (${percentage(expense.reviewerShareBps)}% of ${usd(expense.amountCents)}). Sending freezes this expense and its attached receipt.`,
  };
  return <Modal title={titles[state.kind]} onClose={onClose} busy={busy}><p className="modal-intro">{explanations[state.kind]}</p><ErrorNotice message={error} /><form onSubmit={async event => {
    event.preventDefault(); if (busy) return; setNoteError(false); setError(null);
    if (requiredNote && !note.trim()) { setNoteError(true); return; }
    setBusy(true);
    try {
      const id = expense.id; const cleanNote = note.trim();
      const key = commandKey(state.kind, { id, reportId: state.report?.id, note: cleanNote });
      const result = await command(key, expense.lockVersion, meta => {
        switch (state.kind) {
          case 'APPROVE': return port.reviewExpense(id, 'APPROVE', cleanNote, meta);
          case 'DISPUTE': return port.reviewExpense(id, 'DISPUTE', cleanNote, meta);
          case 'WITHDRAW': return port.withdrawExpense(id, cleanNote, meta);
          case 'REPLACE': return port.replaceExpenseWithDraft(id, cleanNote, meta);
          case 'CONFIRM': return port.resolveReimbursement(state.report!.id, 'CONFIRM', cleanNote, meta);
          case 'REJECT': return port.resolveReimbursement(state.report!.id, 'REJECT', cleanNote, meta);
          case 'SUBMIT': return port.submitExpense(id, meta);
        }
      });
      onResult(result);
    } catch (cause) { if (cause instanceof LedgerError && cause.code === 'STALE_REVISION') onClose(); else setError(errorMessage(cause)); } finally { setBusy(false); }
  }}>{state.kind !== 'SUBMIT' && <><label htmlFor="decision-note">{requiredNote ? 'Reason' : 'Note'} {!requiredNote && <span className="optional">optional</span>}</label><textarea id="decision-note" value={note} onChange={event => setNote(event.target.value)} maxLength={1000} rows={3} required={requiredNote} disabled={busy} aria-invalid={noteError} autoFocus={requiredNote} />{noteError && <p className="field-error">Add a reason with at least one non-space character.</p>}</>}<div className="modal-actions"><button type="button" className="button button-plain" disabled={busy} onClick={onClose}>Cancel</button><button className="button" disabled={busy}>{busy ? 'Saving…' : labels[state.kind]}</button></div></form></Modal>;
}
