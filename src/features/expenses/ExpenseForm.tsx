import { useRef, useState } from 'react';
import type { LedgerPort } from '../../data/ledger-port.ts';
import type { DemoLedger } from '../../data/demo-ledger.ts';
import { CATEGORIES, LedgerError } from '../../domain/types.ts';
import type { Category, DraftInput, ExpenseDetail, LedgerContext } from '../../domain/types.ts';
import { parsePercentToBps, parseUsdToCents, splitExpense } from '../../domain/money.ts';
import { ErrorNotice, Modal, errorMessage, titleCase, today, usd } from '../ui.tsx';
import { commandKey } from './commands.ts';
import type { RunCommand } from './commands.ts';

type Props = { initial: ExpenseDetail | null; context: LedgerContext; port: LedgerPort; demo?: DemoLedger; command: RunCommand; onClose: () => void; onSaved: (detail: ExpenseDetail) => void };

export function ExpenseForm({ initial, context, port, demo, command, onClose, onSaved }: Props) {
  const [record, setRecord] = useState(initial);
  const [description, setDescription] = useState(initial?.expense.description ?? '');
  const [merchant, setMerchant] = useState(initial?.expense.merchant ?? '');
  const [date, setDate] = useState(initial?.expense.expenseDate ?? today());
  const [category, setCategory] = useState<Category>(initial?.expense.category ?? 'SCHOOL');
  const [childId, setChildId] = useState(initial?.expense.childId ?? context.children[0]?.id ?? '');
  const [amount, setAmount] = useState(initial ? (initial.expense.amountCents / 100).toFixed(2) : '');
  const [share, setShare] = useState(initial ? (initial.expense.reviewerShareBps / 100).toString() : '50');
  const [file, setFile] = useState<File | null>(null);
  const [sample, setSample] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const appliedFile = useRef<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const sampleApplied = useRef(false);
  let preview: { total: number; payerShareCents: number; reviewerOwedCents: number } | null = null;
  try { const cents = parseUsdToCents(amount); preview = { total: cents, ...splitExpense(cents, parsePercentToBps(share)) }; } catch { /* Partial input is expected while typing. */ }

  async function save(send: boolean) {
    if (busy || stale) return;
    const fields: Record<string, string> = {};
    let amountCents = 0, reviewerShareBps = 0;
    try { amountCents = parseUsdToCents(amount); } catch { fields.amount = 'Enter an amount from $0.01 to $1,000,000.00, with at most two decimal places.'; }
    try { reviewerShareBps = parsePercentToBps(share); } catch { fields.share = 'Enter a percentage from 0 to 100, with at most two decimal places.'; }
    if (!description.trim()) fields.description = 'Add a short description of the expense.';
    if (!context.children.some(child => child.id === childId)) fields.child = 'Choose a child’s label.';
    if (!date) fields.date = 'Choose the date you paid.';
    if (file && (file.size > 5 * 1024 * 1024 || file.size === 0 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) fields.receipt = 'Choose one JPG, PNG or WebP image up to 5 MiB.';
    setErrors(fields); setError(null);
    if (Object.keys(fields).length) return;
    const input: DraftInput = { childId, category, description: description.trim(), merchant: merchant.trim(), expenseDate: date, amountCents, reviewerShareBps };
    setBusy(true);
    try {
      let current = record;
      if (!current) {
        current = await command(commandKey('createDraft', input), null, meta => port.createDraft(input, { idempotencyKey: meta.idempotencyKey }));
        setRecord(current);
      } else if ((Object.keys(input) as (keyof DraftInput)[]).some(key => input[key] !== current!.expense[key])) {
        const previous = current;
        current = await command(commandKey('saveDraft', { id: previous.expense.id, input }), previous.expense.lockVersion, meta => port.saveDraft(previous.expense.id, input, meta));
        setRecord(current);
      }
      if (demo && sample && !sampleApplied.current) {
        const previous = current;
        current = await command(commandKey('attachSampleReceipt', { id: previous.expense.id }), previous.expense.lockVersion, meta => demo.attachSampleReceipt(previous.expense.id, meta));
        sampleApplied.current = true; setRecord(current);
      } else if (!demo && file && file !== appliedFile.current) {
        const previous = current;
        current = await command(commandKey('uploadReceipt', { id: previous.expense.id, file: { name: file.name, size: file.size, lastModified: file.lastModified, type: file.type } }), previous.expense.lockVersion, meta => port.uploadReceipt(previous.expense.id, file, meta));
        appliedFile.current = file; setRecord(current);
      }
      if (send) {
        const previous = current;
        current = await command(commandKey('submitExpense', { id: previous.expense.id }), previous.expense.lockVersion, meta => port.submitExpense(previous.expense.id, meta));
        setRecord(current);
      }
      onSaved(current);
    } catch (cause) { if (cause instanceof LedgerError && cause.code === 'STALE_REVISION') setStale(true); setError(errorMessage(cause)); } finally { setBusy(false); }
  }

  async function loadLatest() {
    if (!record || busy) return;
    setBusy(true);
    try {
      const latest = await port.getExpense(record.expense.id);
      if (latest.expense.status !== 'DRAFT') { onSaved(latest); return; }
      setRecord(latest); setDescription(latest.expense.description); setMerchant(latest.expense.merchant);
      setDate(latest.expense.expenseDate); setCategory(latest.expense.category); setChildId(latest.expense.childId);
      setAmount((latest.expense.amountCents / 100).toFixed(2)); setShare((latest.expense.reviewerShareBps / 100).toString());
      setFile(null); setSample(false); appliedFile.current = null; sampleApplied.current = false;
      if (fileInput.current) fileInput.current.value = '';
      setStale(false); setErrors({}); setError(null);
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }

  return <Modal title={initial ? 'Edit your draft' : 'Add an expense'} onClose={onClose} busy={busy} wide><p className="modal-intro">Record an expense you paid. Your co-parent’s share stays proposed until they agree.</p><ErrorNotice message={error} />{record && error && <p className="field-help">Your draft has been saved. Your unsent changes remain in this form.</p>}<>{stale && <div className="notice"><p>Another action changed this draft. Copy any unsaved text you want to keep, then load the latest version. This replaces the values in this form.</p><button type="button" className="button button-small button-secondary" disabled={busy} onClick={() => void loadLatest()}>Load latest version</button></div>}</><form onSubmit={event => { event.preventDefault(); const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null; void save(button?.value === 'send'); }} noValidate>
    <fieldset disabled={busy} className="form-fields"><label htmlFor="expense-description">What was the expense?</label><input id="expense-description" value={description} onChange={event => setDescription(event.target.value)} placeholder="For example, School supplies" maxLength={500} required aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'description-error' : undefined} autoFocus />{errors.description && <small className="field-error" id="description-error">{errors.description}</small>}
      <div className="form-grid"><div><label htmlFor="expense-child">Child</label><select id="expense-child" value={childId} onChange={event => setChildId(event.target.value)} aria-invalid={Boolean(errors.child)}><option value="" disabled>Choose a label</option>{context.children.map(child => <option key={child.id} value={child.id}>{child.alias}</option>)}</select>{errors.child && <small className="field-error">{errors.child}</small>}</div><div><label htmlFor="expense-category">Category</label><select id="expense-category" value={category} onChange={event => setCategory(event.target.value as Category)}>{CATEGORIES.map(item => <option key={item} value={item}>{titleCase(item)}</option>)}</select></div></div>
      <div className="form-grid"><div><label htmlFor="expense-date">Date paid</label><input id="expense-date" type="date" value={date} onChange={event => setDate(event.target.value)} required aria-invalid={Boolean(errors.date)} />{errors.date && <small className="field-error">{errors.date}</small>}</div><div><label htmlFor="expense-merchant">Merchant <span className="optional">optional</span></label><input id="expense-merchant" value={merchant} onChange={event => setMerchant(event.target.value)} maxLength={200} placeholder="Store or provider" /></div></div>
      <div className="form-grid"><div><label htmlFor="expense-amount">Total amount (USD)</label><div className="input-with-unit"><span aria-hidden="true">$</span><input id="expense-amount" inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" required aria-invalid={Boolean(errors.amount)} aria-describedby={errors.amount ? 'amount-error' : undefined} /></div>{errors.amount && <small className="field-error" id="amount-error">{errors.amount}</small>}</div><div><label htmlFor="expense-share">Your co-parent’s share</label><div className="input-with-unit trailing-unit"><input id="expense-share" inputMode="decimal" value={share} onChange={event => setShare(event.target.value)} required aria-invalid={Boolean(errors.share)} aria-describedby="share-help" /><span aria-hidden="true">%</span></div><small className={errors.share ? 'field-error' : 'field-help'} id="share-help">{errors.share ?? 'The percentage you are asking them to reimburse.'}</small></div></div>
      <div className="split-preview" aria-live="polite"><span className="eyebrow">Proposed split</span>{preview ? <div><span>Total<strong>{usd(preview.total)}</strong></span><span>Your share<strong>{usd(preview.payerShareCents)}</strong></span><span>Co-parent’s proposed share<strong>{usd(preview.reviewerOwedCents)}</strong></span></div> : <p>Enter the amount and share to see the exact split.</p>}</div>
      <div className="receipt-field"><label htmlFor={demo ? 'sample-receipt' : 'expense-receipt'}>Receipt <span className="optional">optional</span></label>{demo ? <><label className="checkbox-label"><input id="sample-receipt" type="checkbox" checked={sample} onChange={event => setSample(event.target.checked)} />Attach a built-in SAMPLE receipt</label><p className="field-help">Only synthetic receipts are available in demo. Personal file uploads are disabled.</p></> : <><input ref={fileInput} id="expense-receipt" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => { setFile(event.target.files?.[0] ?? null); setErrors(previous => ({ ...previous, receipt: '' })); }} aria-describedby="receipt-help" /><p id="receipt-help" className="field-help">One JPG, PNG or WebP, up to 5 MiB. Attach only the information needed for this expense.</p></>}{record?.expense.receiptId && <p className="field-help">A receipt is already attached to this draft. Selecting another replaces it before submission.</p>}{errors.receipt && <p className="field-error">{errors.receipt}</p>}</div>
      <p className="field-help">Sending preserves this expense and its receipt as a fixed record. The other parent decides whether to agree.</p>
    </fieldset><div className="modal-actions"><button type="button" className="button button-plain" disabled={busy} onClick={onClose}>Cancel</button><button type="submit" value="save" className="button button-secondary" disabled={busy || stale}>{busy ? 'Saving…' : 'Save draft'}</button><button type="submit" value="send" className="button" disabled={busy || stale || context.members.length < 2}>Send for review</button></div>{context.members.length < 2 && <p className="field-help">Connect your co-parent before sending. Saving a private draft is available now.</p>}</form></Modal>;
}
