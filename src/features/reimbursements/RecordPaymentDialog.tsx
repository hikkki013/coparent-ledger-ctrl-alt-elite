import { useState } from 'react';
import type { LedgerPort } from '../../data/ledger-port.ts';
import { LedgerError } from '../../domain/types.ts';
import type { ExpenseDetail } from '../../domain/types.ts';
import { parseUsdToCents } from '../../domain/money.ts';
import { deriveSettlement } from '../../domain/settlement.ts';
import { ErrorNotice, Modal, errorMessage, today, usd } from '../ui.tsx';
import { commandKey } from '../expenses/commands.ts';
import type { RunCommand } from '../expenses/commands.ts';

export function RecordPaymentDialog({ detail, port, command, onClose, recipient }: { detail: ExpenseDetail; port: LedgerPort; command: RunCommand; onClose: () => void; recipient: string }) {
  const [amount, setAmount] = useState('');
  const [paidOn, setPaidOn] = useState(today());
  const [method, setMethod] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const settlement = deriveSettlement(detail.expense.reviewerOwedCents, detail.reimbursements);
  return <Modal title="Record external payment" onClose={onClose} busy={busy}><p className="modal-intro">Record money you have already sent to {recipient} outside CoParent Ledger.</p><div className="notice">Remaining {usd(settlement.remainingCents)} · Awaiting confirmation {usd(settlement.pendingCents)}<br /><strong>Available to record: {usd(settlement.availableToReportCents)}</strong></div><ErrorNotice message={error} /><form onSubmit={async event => { event.preventDefault(); if (busy) return; setError(null); setAmountError(null); let cents: number; try { cents = parseUsdToCents(amount); if (cents <= 0 || cents > settlement.availableToReportCents) throw new Error('amount'); } catch { setAmountError(`Enter an amount from $0.01 to ${usd(settlement.availableToReportCents)}, with at most two decimal places.`); return; } setBusy(true); try { const payload = { expenseId: detail.expense.id, amountCents: cents, paidOn, methodLabel: method.trim(), note: note.trim() }; await command(commandKey('reportReimbursement', payload), detail.expense.lockVersion, meta => port.reportReimbursement(payload.expenseId, cents, paidOn, payload.methodLabel, payload.note, meta)); onClose(); } catch (cause) { if (cause instanceof LedgerError && cause.code === 'STALE_REVISION') onClose(); else setError(errorMessage(cause)); } finally { setBusy(false); } }}>
    <fieldset disabled={busy} className="form-fields"><label htmlFor="payment-amount">Amount sent (USD)</label><div className="input-with-unit"><span aria-hidden="true">$</span><input id="payment-amount" value={amount} onChange={event => setAmount(event.target.value)} inputMode="decimal" placeholder="0.00" required autoFocus aria-invalid={Boolean(amountError)} aria-describedby={amountError ? 'payment-amount-error' : undefined} /></div>{amountError && <p id="payment-amount-error" className="field-error">{amountError}</p>}<div className="form-grid"><div><label htmlFor="payment-date">Date sent</label><input id="payment-date" type="date" value={paidOn} onChange={event => setPaidOn(event.target.value)} required /></div><div><label htmlFor="payment-method">Method label <span className="optional">optional</span></label><input id="payment-method" value={method} onChange={event => setMethod(event.target.value)} maxLength={100} placeholder="For example, bank transfer" /></div></div><p className="field-help">A method label is your note; it is not a bank verification.</p><label htmlFor="payment-note">Note <span className="optional">optional</span></label><textarea id="payment-note" value={note} onChange={event => setNote(event.target.value)} maxLength={1000} rows={3} /><p className="field-help">This creates a payment awaiting confirmation. The remaining amount changes only after {recipient} confirms receipt.</p></fieldset><div className="modal-actions"><button type="button" className="button button-plain" onClick={onClose} disabled={busy}>Cancel</button><button className="button" disabled={busy}>{busy ? 'Recording…' : 'Record external payment'}</button></div></form></Modal>;
}
