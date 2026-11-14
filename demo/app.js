import { openPersistentDemo, DEMO_STORAGE_KEY } from '/src/data/persistent-demo.js';
import { browserDemoAccess } from '/src/data/demo-access.js';
import { parseUsdToCents, parsePercentToBps, splitExpense } from '/src/domain/money.js';
import { deriveSettlement } from '/src/domain/settlement.js';

const root = document.querySelector('#app');
let ledger, coordinator, stale = false;
const demoPlan = browserDemoAccess();
const access = demoPlan.access;
const currency = new Intl.NumberFormat('en-US', {style:'currency',currency:'USD'});
const money = cents => currency.format(cents / 100);
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const key = () => crypto.randomUUID();
let actor = 'alex', context, records = [], selected = null, filter = 'ALL', notice = '', failure = false, busy = false;
let view = 'ledger', categories = [], plans = [], statistics = [], statsChild = ''; 
const person = id => context?.members.find(m => m.userId === id)?.displayName ?? (id === 'alex' ? 'Alex' : 'Jordan');
const label = status => ({DRAFT:'Private draft',PENDING:'Needs review',APPROVED:'Agreed',DISPUTED:'Disputed',WITHDRAWN:'Withdrawn',CONFIRMED:'Received',REJECTED:'Not received'}[status] ?? status);
const meta = expense => ({expectedRevision:expense.lockVersion,idempotencyKey:key()});
const tag = status => `<span class="tag ${esc(status)}">${esc(label(status))}</span>`;
const category = id => categories.find(c => c.id === id)?.label ?? id;
const childName = id => context?.children.find(c=>c.id===id)?.alias ?? 'Unknown child';
const button = (action,text,primary=false,extra='') => `<button type="button" data-action="${action}" ${primary?'class="primary"':''} ${extra}>${text}</button>`;
function navigate(id) {
  const url = new URL(location.href); id ? url.searchParams.set('expense',id) : url.searchParams.delete('expense');
  history.pushState(null,'',url); void refresh().catch(showReadFailure);
}
function showReadFailure(error) {
  busy=false;failure=true;notice=`The demo could not be loaded: ${error.message}. Your saved data was not replaced. Check browser storage and reload.`;
  root.innerHTML=`<main class="shell"><section class="intro"><div><h1>Unable to load the sample ledger.</h1><p role="alert">${esc(notice)}</p></div></section></main>`;
}
function selectedRecord() { return records.find(r => r.expense.id === selected); }
async function refresh() {
  context = await ledger.getContext(); records = await ledger.listExpenses(); categories = await ledger.listCategories(); plans = await ledger.listPlans(); statistics = await Promise.all(context.children.map(c=>ledger.childStatistics(c.id))); if (!statsChild || !context.children.some(c=>c.id===statsChild)) statsChild = context.children[0]?.id ?? ''; 
  selected = new URL(location.href).searchParams.get('expense');
  if (selected && !selectedRecord()) selected = null;
  render();
}
async function run(operation,success='Saved to this synthetic demo.') {
  if (busy) return;
  busy=true; document.querySelectorAll('button').forEach(b => b.disabled=true);
  try { await coordinator.run(operation);notice=success;failure=false; }
  catch (error) { if (String(error.message).includes('another tab')) stale=true; notice=`${error.code ? `${error.code}: ` : ''}${error.message || 'The action was not completed.'}`;failure=true; }
  finally {
    busy=false;
    const formError = document.querySelector('#form-dialog[open] #form-error');
    if (failure && formError) { formError.textContent=notice; if(stale && !document.querySelector('#form-dialog [data-action=reload-saved]')) formError.insertAdjacentHTML('afterend',button('reload-saved','Reload saved data')); document.querySelectorAll('button').forEach(b=>b.disabled=false); }
    else await refresh().catch(showReadFailure);
  }
}
function balances() {
  let owe=0,owed=0,pending=0,review=0,disputed=0;
  for (const r of records) {
    const e=r.expense;
    if(e.status==='PENDING') review++;
    if(e.status==='DISPUTED') disputed++;
    if(e.status!=='APPROVED') continue;
    const s=deriveSettlement(e.reviewerOwedCents,r.reimbursements);
    if(e.paidBy===actor) owed+=s.remainingCents; else owe+=s.remainingCents;
    pending+=s.pendingCents;
  }
  return {owe,owed,pending,review,disputed};
}
function render() {
  const b=balances();
  root.innerHTML=`<div class="demo-strip"><strong>Synthetic demo.</strong> Parent A and Parent B are sample roles. Use test data only. No money moves.</div><div class="shell"><header class="topbar"><div class="brand"><span class="brand-mark">c</span>CoParent Ledger</div><label class="actor">Viewing as <select id="actor" aria-label="Demo parent"><option value="alex" ${actor==='alex'?'selected':''}>${esc(person('alex'))} (Parent A)</option><option value="jordan" ${actor==='jordan'?'selected':''}>${esc(person('jordan'))} (Parent B)</option></select></label></header>${accessMarkup()}<div class="notice" role="note">Demo data stays in this browser on this device, including after closing this tab. It does not sync to other devices and may be deleted when site data is cleared. Use test data only.</div>${stale?`<div class="notice error" role="alert">Demo data changed in another tab. Reload saved data before making changes. ${button('reload-saved','Reload saved data')}</div>`:''}<nav class="workspace-nav" aria-label="Demo sections">${button('view-ledger','Expenses')}${button('view-family','Family')}${button('view-statistics','Statistics')}${button('view-plans','Future plans')}</nav>${notice?`<div class="notice ${failure?'error':''}" role="${failure?'alert':'status'}">${esc(notice)}</div>`:''}${selected?detailMarkup(selectedRecord()):view==='family'?familyMarkup():view==='statistics'?statisticsMarkup():view==='plans'?plansMarkup():listMarkup(b)}<footer class="foot"><span>Shared expenses. Clear agreements. A history you can follow.<br>Standalone demo · Real accounts and backend are not connected.</span><div class="row">${button('clean','Start clean')}${button('examples','Load examples')}${button('csv','Export CSV')}</div></footer></div><dialog id="form-dialog" aria-labelledby="dialog-title"></dialog><dialog id="paywall-dialog" aria-labelledby="paywall-title"></dialog>`;
}
function accessMarkup() {
  const status = access.status();
  const label = status === 'trial' ? '14-day demo trial active' : status === 'expired' ? 'Demo trial ended' : 'Test access enabled';
  return `<section class="demo-plan" aria-label="Demo subscription controls"><div><strong>${label}</strong><p>Demo controls only. ${demoPlan.persistent ? 'Test access is stored in this browser until reset or browser data is cleared.' : 'Browser storage unavailable: test access lasts only in this tab.'} Demo records are saved separately in this browser on this device.</p></div><div class="row">${button('simulate-expiry','Simulate end of trial')}${button('reset-access','Reset demo access')}</div></section>`;
}
function showPaywall() {
  const dialog = document.querySelector('#paywall-dialog');
  dialog.innerHTML = `<div class="paywall-content"><span class="plan-label">Demo subscription</span><h2 id="paywall-title">Keep your shared ledger going</h2><p class="plan-price">$7.99 <span>/ month per household</span></p><p>One household includes both parents. Record expenses, attach sample receipts, agree on shares and track reimbursements together.</p><div class="plan-note"><strong>Test access only — no payment.</strong><br>No card, billing or real subscription is connected. This browser-local demo does not process payments.</div><p class="muted">Your existing expenses, receipts, history, CSV export and payment confirmations remain available.</p><div class="actions">${button('close-paywall','Not now')}${button('enable-access','Enable test access — no payment',true)}</div></div>`;
  dialog.showModal();
}
function listMarkup(b) {
  const shown=records.filter(r => filter==='ALL'||r.expense.status===filter);
  return `<section class="intro"><div class="banner-text"><div class="eyebrow">Your shared expense journal</div><h1>A little less back-and-forth.</h1><p class="muted">Keep the receipt, the agreement and the remaining amount together.</p></div>${button('new','+ Add expense',true)}</section><div class="summary"><section><label>You owe ${esc(person(actor==='alex'?'jordan':'alex'))}</label><div class="value" data-testid="you-owe">${money(b.owe)}</div><p class="muted">Remaining on agreed expenses</p></section><section><label>Owed to you</label><div class="value" data-testid="owed-to-you">${money(b.owed)}</div><p class="muted">Remaining on agreed expenses</p></section><section><label>Waiting for confirmation</label><div class="small-value">${money(b.pending)}</div><p class="muted">Still included in the remaining amounts</p></section></div><div class="toolbar"><div><h2>Your expenses</h2><p class="muted">${b.review} awaiting review · ${b.disputed} disputed</p></div><label><span class="sr-only">Filter expenses</span><select id="filter"><option value="ALL">All expenses</option>${['DRAFT','PENDING','APPROVED','DISPUTED','WITHDRAWN'].map(s=>`<option value="${s}" ${filter===s?'selected':''}>${label(s)}</option>`).join('')}</select></label></div><div class="ledger"><div class="ledger-head"><span>Expense</span><span>Total</span><span>Remaining</span><span>Status</span><span></span></div>${shown.length?shown.map(r=>{const e=r.expense,s=deriveSettlement(e.reviewerOwedCents,r.reimbursements);return `<button class="expense-row" type="button" data-action="open" data-id="${esc(e.id)}"><span><span class="expense-title">${esc(e.description)}</span><span class="muted">${esc(childName(e.childId))} · ${esc(category(e.category))} · Paid by ${esc(person(e.paidBy))}</span></span><span class="amount total">${money(e.amountCents)}</span><span class="amount remaining">${e.status==='APPROVED'?money(s.remainingCents):'—'}</span><span class="status">${tag(e.status)}</span><span class="arrow" aria-hidden="true">↗</span></button>`;}).join(''):`<div class="empty"><h2>${filter==='ALL'?'Start with one shared expense.':'No expenses in this view.'}</h2><p>A receipt, a proposed share, and a clear next step.</p>${button('new','Add an expense',true)}</div>`}</div>`;
}
function detailMarkup(r) {
  const e=r.expense,s=deriveSettlement(e.reviewerOwedCents,r.reimbursements),mine=e.paidBy===actor,isReviewer=e.reviewerId===actor;
  const lastDispute=[...r.audit].reverse().find(a=>a.action.includes('DISPUT')&&a.note);
  const actions=[];
  actions.push(button('category-edit','Change category'));
  if(mine&&e.status==='DRAFT') actions.push(button('edit','Edit draft'),button('receipt','Attach sample receipt'),button('submit','Send for review',true),button('withdraw','Withdraw draft'));
  if(mine&&['PENDING','DISPUTED'].includes(e.status)) actions.push(button('correct','Create corrected draft'),button('withdraw','Withdraw request'));
  if(isReviewer&&['PENDING','DISPUTED'].includes(e.status)) {
    actions.push(button('approve',e.status==='DISPUTED'?'Agree to this unchanged expense':'Agree to this share',true));
    if(e.status==='PENDING') actions.push(button('dispute','Raise an objection'));
  }
  if(isReviewer&&e.status==='APPROVED'&&s.availableToReportCents>0) actions.push(button('report','Record external payment',true));
  return `<section class="intro"><div>${button('back','← All expenses',false,'class="back"')}<h1>${esc(e.description)}</h1><p class="muted">${esc(childName(e.childId))} · ${esc(category(e.category))} · ${esc(e.expenseDate)} · Paid by ${esc(person(e.paidBy))}</p></div>${tag(e.status)}</section><div class="detail-grid"><div><section class="panel"><h2>Expense details</h2><dl class="facts"><div><dt>Total purchase</dt><dd class="large">${money(e.amountCents)}</dd></div><div><dt>${e.status==='APPROVED'?'Agreed':'Proposed'} share for ${esc(person(e.reviewerId??(mine?(actor==='alex'?'jordan':'alex'):actor)))}</dt><dd class="large">${money(e.reviewerOwedCents)} <small>(${e.reviewerShareBps/100}%)</small></dd></div><div><dt>Merchant</dt><dd>${esc(e.merchant)||'Not added'}</dd></div><div><dt>Paid by</dt><dd>${esc(person(e.paidBy))} · ${money(e.amountCents-e.reviewerOwedCents)} own share</dd></div></dl>${e.replacesExpenseId?`<p class="explanation">Corrected draft replacing ${esc(e.replacesExpenseId)}. A fresh agreement is required.</p>`:''}${lastDispute&&e.status==='DISPUTED'?`<div class="reason">Objection: ${esc(lastDispute.note)}</div>`:''}<p class="explanation">${e.status==='DRAFT'?'Only you can see this draft. It becomes shared when you send it for review.':e.status==='APPROVED'?'This agreed expense is locked. Reported transfers reduce the remaining amount only after the recipient confirms receipt.':e.status==='WITHDRAWN'?'This request is withdrawn and cannot be changed.':'The proposed share is excluded from agreed balances until the other parent agrees.'}</p><div class="actions">${actions.join('')}</div></section><section class="panel"><h2>External reimbursements</h2>${e.status==='APPROVED'?`<dl class="facts"><div><dt>Confirmed received</dt><dd>${money(s.confirmedCents)}</dd></div><div><dt>Awaiting receipt confirmation</dt><dd>${money(s.pendingCents)}</dd></div><div><dt>Remaining</dt><dd class="large" data-testid="remaining">${money(s.remainingCents)}</dd></div><div><dt>Available to report</dt><dd>${money(s.availableToReportCents)}</dd></div></dl>`:'<p class="muted">Reimbursements open after agreement.</p>'}${r.reimbursements.map(p=>`<div class="payment"><div class="row"><strong>${money(p.amountCents)}</strong>${tag(p.status)}</div><div>${esc(person(p.fromUserId))} reported ${esc(p.methodLabel)} on ${esc(p.paidOn)}</div>${p.note?`<div class="muted">${esc(p.note)}</div>`:''}${mine&&p.status==='PENDING'?`<div class="row">${button('confirm','I received this payment',true,`data-id="${esc(p.id)}"`)}${button('reject','I have not received this payment',false,`data-id="${esc(p.id)}"`)}</div>`:''}</div>`).join('')}<p class="explanation">Record money sent outside this service. CoParent Ledger does not send or verify bank payments.</p></section></div><aside><section class="panel"><h2>Receipt</h2>${e.receiptId?'<img class="receipt" src="/samples/receipt.svg" alt="Synthetic sample receipt, not a real purchase"><p class="muted">SAMPLE · Synthetic attachment</p>':'<p class="muted">Receipt not attached</p>'}</section><section class="panel"><h2>History</h2><ol class="timeline">${[...r.audit].reverse().map(a=>`<li><strong>${esc(person(a.actorId))}</strong> · ${esc(a.action.toLowerCase().replaceAll('_',' '))}${a.amountCents!==null?` · ${money(a.amountCents)}`:''}${a.note?`<div>${esc(a.note)}</div>`:''}<time datetime="${esc(a.createdAt)}">${esc(new Date(a.createdAt).toLocaleString('en-US'))}</time></li>`).join('')}</ol></section></aside></div>`;
}
function familyMarkup() {
  return `<section class="intro"><div><h1>Family</h1><p class="muted">Names and children are synthetic and stay in this browser on this device. Parent identities remain distinct even with identical names.</p></div>${button('child-add','+ Add child',true)}</section><section class="panel"><h2>Parents</h2>${context.members.map((m,i)=>`<div class="family-row"><strong>${esc(m.displayName)} (Parent ${i?'B':'A'})</strong>${button('parent-rename','Rename',false,`data-id="${esc(m.userId)}"`)}</div>`).join('')}</section><section class="panel"><h2>Children</h2><p class="muted">Archiving keeps existing expenses and history.</p>${context.children.map(c=>`<div class="family-row"><strong>${esc(c.alias)} ${c.archived?'(archived)':''}</strong><div class="row">${button('child-rename','Rename',false,`data-id="${esc(c.id)}"`)}${button(c.archived?'child-restore':'child-archive',c.archived?'Restore':'Archive',false,`data-id="${esc(c.id)}"`)}</div></div>`).join('')}</section>`;
}
function statisticsMarkup() {
 const report=statistics[context.children.findIndex(c=>c.id===statsChild)];
 return `<section class="intro"><div><h1>Child spending</h1><p class="muted">Approved purchases only, attributed to the parent who paid. Future plans and pending or disputed expenses are excluded.</p></div></section><label class="field">Child<select id="stats-child">${context.children.map(c=>`<option value="${esc(c.id)}" ${c.id===statsChild?'selected':''}>${esc(c.alias)}${c.archived?' (archived)':''}</option>`).join('')}</select></label>${report?`<div class="summary"><section><label>Purchases paid</label><div class="value">${money(report.purchaseCents)}</div></section><section><label>Agreed other-parent shares</label><div class="value">${money(report.agreedCents)}</div></section><section><label>Confirmed / remaining</label><div class="small-value">${money(report.confirmedCents)} / ${money(report.remainingCents)}</div></section></div><p class="muted">Reimbursements are tracked separately and are not additional purchases. Remaining includes payments awaiting confirmation.</p>${report.byParent.map((p,i)=>`<section class="panel"><h2>${esc(person(p.actorId))} (Parent ${i?'B':'A'}) paid ${money(p.purchaseCents)}</h2>${p.categories.length?p.categories.map(c=>`<div class="family-row"><span>${esc(category(c.category))}</span><strong>${money(c.purchaseCents)}</strong></div>`).join(''):'<p class="muted">No approved purchases yet.</p>'}</section>`).join('')}<section class="panel"><h2>Included expenses</h2>${report.records.map(r=>button('open',`${esc(r.expense.description)} - ${money(r.expense.amountCents)}`,false,`data-id="${esc(r.expense.id)}"`)).join(' ')||'<p class="muted">No approved expenses yet.</p>'}</section>`:'<p>Add a child to see statistics.</p>'}`;
}
function plansMarkup() {
 return `<section class="intro"><div><h1>Future plans</h1><p class="muted">Estimates for future purchases, education or other costs. Plans are not debts or agreements and do not affect balances.</p></div>${button('plan-add','+ Add plan',true)}</section>${plans.length?plans.map(p=>`<section class="panel"><div class="family-row"><h2>${esc(p.title)}</h2><strong>${money(p.targetCents)}</strong></div><p>${esc(p.childId?childName(p.childId):'Unassigned')} · ${esc(category(p.category))} · ${p.reviewerShareBps/100}% proposed · ${p.targetDate?esc(p.targetDate):'No target date'}</p>${p.notes?`<p>${esc(p.notes)}</p>`:''}<p class="muted">${p.status==='CONVERTED'?'Converted to a draft':'Planned - no debt'}</p>${p.status==='PLANNED'&&p.childId?button('plan-convert','Create expense draft',false,`data-id="${esc(p.id)}"`):''}${p.status==='CONVERTED'?button('open','Open draft',false,`data-id="${esc(p.convertedExpenseId)}"`):''}</section>`).join(''):'<div class="panel">No future plans yet.</div>'}`;
}
function showForm(kind,reportId) {
  const e=selectedRecord()?.expense;
  const dialog=document.querySelector('#form-dialog');
  if(kind==='new'||kind==='edit') {
    const edit=kind==='edit';const value=edit?e:{childId:context.children.find(c=>!c.archived)?.id,category:'SCHOOL',description:'',merchant:'',expenseDate:today(),amountCents:12001,reviewerShareBps:4000};
    dialog.innerHTML=`<form id="command-form" data-kind="${kind}"><h2 id="dialog-title">${edit?'Edit private draft':'Add an expense'}</h2><p class="muted">Add a purchase you paid for. The other parent can review your proposed share.</p><div class="form-grid"><label class="field wide">Description<input name="description" required maxlength="160" value="${esc(value.description)}" placeholder="e.g. School supplies"></label><label class="field">Child<select name="childId">${context.children.filter(c=>!c.archived || c.id===value.childId).map(c=>`<option value="${esc(c.id)}" ${c.id===value.childId?'selected':''}>${esc(c.alias)}</option>`).join('')}</select></label><label class="field">Category<select name="category">${categories.map(c=>`<option value="${esc(c.id)}" ${c.id===value.category?'selected':''}>${esc(c.label)}</option>`).join('')}</select></label><label class="field wide">New category (optional)<span class="inline-category"><input name="newCategory" maxlength="60" placeholder="e.g. Music lessons"><button type="button" data-action="category-inline">Add category</button></span></label><label class="field">Amount (USD)<input name="amount" inputmode="decimal" required value="${(value.amountCents/100).toFixed(2)}"></label><label class="field">Other parent's share (%)<input name="share" inputmode="decimal" required value="${value.reviewerShareBps/100}"></label><label class="field">Purchase date<input type="date" name="expenseDate" required value="${esc(value.expenseDate)}"></label><label class="field">Merchant<input name="merchant" maxlength="100" value="${esc(value.merchant)}" placeholder="Optional"></label></div><p class="money-preview" id="split-preview"></p><p class="explanation">This demo accepts only built-in sample receipts. Attach one after saving the draft.</p><div class="actions">${button('close','Cancel')}<button class="primary" type="submit">Save draft</button></div><p id="form-error" role="alert"></p></form>`;
    dialog.querySelectorAll('input[name="amount"],input[name="share"]').forEach(el=>el.addEventListener('input',updatePreview));
    updatePreview();
  } else if(kind==='child-add'||kind==='child-rename'||kind==='parent-rename') {
    const target = kind==='child-rename' ? context.children.find(c=>c.id===reportId) : context.members.find(m=>m.userId===reportId);
    dialog.innerHTML=`<form id="command-form" data-kind="${kind}" data-id="${esc(reportId??'')}"><h2 id="dialog-title">${kind==='child-add'?'Add child':kind==='child-rename'?'Rename child':'Rename parent'}</h2><label class="field">Name<input name="name" required maxlength="60" value="${esc(target?.alias??target?.displayName??'')}"></label><div class="actions">${button('close','Cancel')}<button type="submit" class="primary">Save</button></div><p id="form-error" role="alert"></p></form>`;
  } else if(kind==='category-edit') {
    dialog.innerHTML=`<form id="command-form" data-kind="category-edit"><h2 id="dialog-title">Change category</h2><p>This changes classification only. Amounts, agreement and reimbursements remain unchanged. The history records the change.</p><label class="field">Category<select name="category">${categories.map(c=>`<option value="${esc(c.id)}" ${c.id===e.category?'selected':''}>${esc(c.label)}</option>`).join('')}</select></label><div class="actions">${button('close','Cancel')}<button type="submit" class="primary">Save category</button></div><p id="form-error" role="alert"></p></form>`;
  } else if(kind==='plan-add') {
    dialog.innerHTML=`<form id="command-form" data-kind="plan-add"><h2 id="dialog-title">Plan a future expense</h2><p>Estimates only: no debt, payment or agreement is created.</p><div class="form-grid"><label class="field wide">Title<input name="title" required maxlength="120" placeholder="e.g. College tuition"></label><label class="field">Child<select name="childId"><option value="">Unassigned</option>${context.children.filter(c=>!c.archived).map(c=>`<option value="${esc(c.id)}">${esc(c.alias)}</option>`).join('')}</select></label><label class="field">Category<select name="category">${categories.map(c=>`<option value="${esc(c.id)}">${esc(c.label)}</option>`).join('')}</select></label><label class="field">Estimated amount (USD)<input name="amount" required inputmode="decimal" placeholder="5000.00"></label><label class="field">Other parent's proposed share (%)<input name="share" required value="50" inputmode="decimal"></label><label class="field">Target date (optional)<input type="date" name="targetDate"></label><label class="field wide">Notes (optional)<textarea name="notes" maxlength="1000"></textarea></label></div><div class="actions">${button('close','Cancel')}<button type="submit" class="primary">Save plan</button></div><p id="form-error" role="alert"></p></form>`;
  } else if(kind==='report') {
    const s=deriveSettlement(e.reviewerOwedCents,selectedRecord().reimbursements);
    dialog.innerHTML=`<form id="command-form" data-kind="report"><h2 id="dialog-title">Record external payment</h2><p class="muted">Available to report: ${money(s.availableToReportCents)}. This does not send money.</p><div class="form-grid"><label class="field">Amount (USD)<input name="amount" required inputmode="decimal" placeholder="20.00"></label><label class="field">Date sent<input type="date" name="paidOn" required value="${today()}"></label><label class="field wide">Method<input name="methodLabel" required maxlength="80" placeholder="e.g. Zelle, cash, bank transfer"></label><label class="field wide">Note (optional)<textarea name="note" maxlength="500"></textarea></label></div><div class="actions">${button('close','Cancel')}<button type="submit" class="primary">Record payment</button></div><p id="form-error" role="alert"></p></form>`;
  } else {
    const titles={dispute:'Raise an objection',withdraw:'Withdraw this request',correct:'Create corrected draft',reject:'Payment not received'};
    dialog.innerHTML=`<form id="command-form" data-kind="${kind}" data-report="${esc(reportId??'')}"><h2 id="dialog-title">${titles[kind]}</h2><label class="field">Reason<textarea name="reason" required maxlength="500" placeholder="Add a short, factual explanation."></textarea></label><p class="muted">${kind==='correct'?'The original is withdrawn and preserved. The new draft starts without a receipt and needs a new agreement.':'Your explanation becomes part of this expense’s history.'}</p><div class="actions">${button('close','Cancel')}<button class="primary" type="submit">${titles[kind]}</button></div><p id="form-error" role="alert"></p></form>`;
  }
  dialog.showModal();dialog.querySelector('input,textarea,select')?.focus();
}
function updatePreview() {
  const form=document.querySelector('#command-form');
  try {const total=parseUsdToCents(form.elements.amount.value),bps=parsePercentToBps(form.elements.share.value),s=splitExpense(total,bps);document.querySelector('#split-preview').textContent=`Your share ${money(s.payerShareCents)} · Other parent's proposed share ${money(s.reviewerOwedCents)}`;}
  catch {document.querySelector('#split-preview').textContent='Enter a valid amount and percentage to preview the split.';}
}
root.addEventListener('change',event=>{
  if(event.target.id==='actor'){actor=event.target.value;ledger.setActor(actor);notice='';navigate(null);}
  if(event.target.id==='stats-child'){statsChild=event.target.value;render();}
  if(event.target.id==='filter'){filter=event.target.value;render();}
});
root.addEventListener('click',event=>{
  const control=event.target.closest('[data-action]');if(!control||busy)return;
  const action=control.dataset.action,e=selectedRecord()?.expense;
  if(action==='reload-saved'){const dialog=document.querySelector('#form-dialog[open]');if(dialog&&!window.confirm('Reload saved data? Unsaved form entries in this tab will be discarded.'))return;return coordinator.reload(async()=>{stale=false;notice='Loaded the latest saved demo data.';failure=false;await refresh();}).catch(showReadFailure);}
  if(action.startsWith('view-')){view=action.slice(5);return navigate(null);}
  if(action==='category-inline') { const form=control.closest('form'), input=form.elements.newCategory; if (!input.value.trim()) {form.querySelector('#form-error').textContent='Enter a category name.';return;} control.disabled=true; coordinator.run(()=>ledger.createCategory(input.value,{idempotencyKey:key()})).then(c=>{categories.push(c);form.elements.category.add(new Option(c.label,c.id,true,true));input.value='';form.querySelector('#form-error').textContent='';}).catch(error=>{form.querySelector('#form-error').textContent=error.message;if(String(error.message).includes('another tab')){stale=true;if(!form.querySelector('[data-action=reload-saved]'))form.querySelector('#form-error').insertAdjacentHTML('afterend',button('reload-saved','Reload saved data'));}}).finally(()=>{control.disabled=false;});return; }
  if(['child-add','child-rename','parent-rename','category-edit','plan-add'].includes(action))return showForm(action,control.dataset.id);
  if(action==='child-archive'||action==='child-restore'){if(action==='child-archive'&&!window.confirm('Archive this child? Existing expenses and history remain available.'))return;return run(()=>action==='child-archive'?ledger.archiveChild(control.dataset.id,{idempotencyKey:key()}):ledger.restoreChild(control.dataset.id,{idempotencyKey:key()}),'Family updated in this browser.');}
  if(action==='plan-convert'){if(!access.canCreate())return showPaywall();return run(async()=>{const r=await ledger.convertPlan(control.dataset.id,{idempotencyKey:key()});view='ledger';const url=new URL(location.href);url.searchParams.set('expense',r.expense.id);history.pushState(null,'',url);},'Plan converted to a private draft. No debt exists until agreement.');}
  if(action==='simulate-expiry'||action==='reset-access') { try { action==='simulate-expiry'?access.simulateExpiry():access.reset(); notice=action==='simulate-expiry'?'Demo trial ended. Try Add expense to see the paywall.':'Demo access reset. The 14-day trial is active.'; failure=false; render(); } catch { notice='Demo access could not be saved in this browser.';failure=true;render(); } return; }
  if(action==='close-paywall')return document.querySelector('#paywall-dialog').close();
  if(action==='enable-access') { try { access.enableTestAccess();notice='Test access enabled. No payment was made.';failure=false;render();showForm('new'); } catch { const dialog=document.querySelector('#paywall-dialog');dialog.querySelector('.plan-note').textContent='Test access could not be saved. Check browser storage and try again.'; } return; }
  if(action==='new'&&!access.canCreate())return showPaywall();
  if(action==='open')return navigate(control.dataset.id);
  if(action==='back')return navigate(null);
  if(action==='close')return document.querySelector('#form-dialog').close();
  if(['new','edit','dispute','correct','report','reject'].includes(action))return showForm(action,control.dataset.id);
  if(action==='withdraw'&&e.status!=='DRAFT')return showForm('withdraw');
  if(action==='withdraw')return run(()=>ledger.withdrawExpense(e.id,'',meta(e)),'Private draft withdrawn.');
  if(action==='submit')return run(()=>ledger.submitExpense(e.id,meta(e)),'Sent for review. Switch to the other demo parent to respond.');
  if(action==='approve') { if(!window.confirm(`Agree to your ${money(e.reviewerOwedCents)} share? The agreed expense will be locked.`)) return; return run(()=>ledger.reviewExpense(e.id,'APPROVE','',meta(e)),'The share is agreed. This expense is now locked.'); }
  if(action==='receipt')return run(()=>ledger.attachSampleReceipt(e.id,meta(e)),'Built-in SAMPLE receipt attached.');
  if(action==='confirm') { const payment=selectedRecord().reimbursements.find(p=>p.id===control.dataset.id); if(!window.confirm(`Confirm you received ${money(payment.amountCents)}? This reduces the remaining amount and cannot be undone in this MVP.`))return; return run(()=>ledger.resolveReimbursement(control.dataset.id,'CONFIRM','',meta(e)),'Receipt confirmed. The remaining amount has been updated.'); }
  if(action==='clean'||action==='examples') {
    if(!window.confirm('Replace the saved demo data in this browser? Expenses, family and plans will be replaced. Demo access is not reset.'))return;
    return run(async()=>{ledger.reset(action==='clean'?'clean':'examples');selected=null;const url=new URL(location.href);url.searchParams.delete('expense');history.replaceState(null,'',url);},action==='clean'?'Clean demo ready. Create the first expense.':'Loaded a separate example dataset, including a pending $10 payment.');
  }
  if(action==='csv')return run(async()=>{const csv=await ledger.exportExpensesCsv();const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='coparent-synthetic-expenses.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'Exported visible synthetic records.');
});
root.addEventListener('submit',async event=>{
  if(event.target.id!=='command-form')return;event.preventDefault();if(busy)return;
  const form=event.target,kind=form.dataset.kind,data=new FormData(form),e=selectedRecord()?.expense;
  const text=name=>String(data.get(name)??'');
  let operation;
  try {
    if(kind==='new'||kind==='edit') {
      const input={description:text('description'),merchant:text('merchant'),childId:text('childId'),category:text('category'),expenseDate:text('expenseDate'),amountCents:parseUsdToCents(text('amount')),reviewerShareBps:parsePercentToBps(text('share'))};
      operation=async()=>{const r=kind==='new'?await ledger.createDraft(input,{idempotencyKey:key()}):await ledger.saveDraft(e.id,input,meta(e));const url=new URL(location.href);url.searchParams.set('expense',r.expense.id);history.pushState(null,'',url);};
    } else if(kind==='child-add')operation=()=>ledger.createChild(text('name'),{idempotencyKey:key()});
    else if(kind==='child-rename')operation=()=>ledger.renameChild(form.dataset.id,text('name'),{idempotencyKey:key()});
    else if(kind==='parent-rename')operation=()=>ledger.renameParent(form.dataset.id,text('name'),{idempotencyKey:key()});
    else if(kind==='category-edit')operation=()=>ledger.changeCategory(e.id,text('category'),meta(e));
    else if(kind==='plan-add') {const input={title:text('title'),description:'',childId:text('childId')||null,category:text('category'),targetCents:parseUsdToCents(text('amount')),reviewerShareBps:parsePercentToBps(text('share')),targetDate:text('targetDate'),notes:text('notes')};operation=()=>ledger.createPlan(input,{idempotencyKey:key()});}
    else if(kind==='report') {const amount=parseUsdToCents(text('amount'));operation=()=>ledger.reportReimbursement(e.id,amount,text('paidOn'),text('methodLabel'),text('note'),meta(e));}
    else if(kind==='dispute')operation=()=>ledger.reviewExpense(e.id,'DISPUTE',text('reason'),meta(e));
    else if(kind==='withdraw')operation=()=>ledger.withdrawExpense(e.id,text('reason'),meta(e));
    else if(kind==='reject')operation=()=>ledger.resolveReimbursement(form.dataset.report,'REJECT',text('reason'),meta(e));
    else if(kind==='correct')operation=async()=>{const r=await ledger.replaceExpenseWithDraft(e.id,text('reason'),meta(e));const url=new URL(location.href);url.searchParams.set('expense',r.expense.id);history.pushState(null,'',url);};
    else throw Error('Unknown command.');
  } catch(error){document.querySelector('#form-error').textContent=error.message;return;}
  await run(operation,kind==='report'?'Payment reported. The remaining amount stays unchanged until receipt is confirmed.':'Saved to this synthetic demo.');
});
window.addEventListener('popstate',()=>{if(ledger)void refresh().catch(showReadFailure);});
window.addEventListener('storage', event=>{
  if(event.key!==DEMO_STORAGE_KEY || !coordinator)return;
  stale=true;
  if(!document.querySelector('#external-change-alert')) {
    const alert=document.createElement('div');alert.id='external-change-alert';alert.className='notice error';alert.setAttribute('role','alert');
    alert.innerHTML='Demo data changed in another tab. Reload saved data before making changes. '+button('reload-saved','Reload saved data');
    root.prepend(alert);
  }
  const error=document.querySelector('#form-dialog[open] #form-error');
  if(error){error.textContent='Demo data changed in another tab. Reload saved data before making changes.';if(!document.querySelector('#form-dialog [data-action=reload-saved]'))error.insertAdjacentHTML('afterend',button('reload-saved','Reload saved data'));}
});
(async()=>{
  try {
    if(!navigator.locks)throw new Error('This browser cannot safely coordinate demo data across tabs. Use a current browser with Web Locks enabled.');
    const opened=await openPersistentDemo(localStorage,sessionStorage,navigator.locks,access);
    ledger=opened.ledger;coordinator=opened.coordinator;
    if(opened.origin==='migrated')notice='Your previous demo progress was saved in this browser.';
    await refresh();
  } catch(error){showReadFailure(error);}
})();
