import { useMemo } from 'react';
import { DemoLedger } from './data/demo-ledger.ts';
import { RealArea } from './features/auth/AuthPages.tsx';
import { LedgerView } from './features/expenses/LedgerView.tsx';
import { Link, Logo, navigate, useLocation } from './features/ui.tsx';

export function App() {
  const location = useLocation();
  if (location.pathname === '/demo') return <DemoPage search={location.search} />;
  if (location.pathname === '/pricing') return <PricingPage />;
  if (location.pathname === '/') return <LandingPage />;
  if (location.pathname === '/login' || location.pathname.startsWith('/invite/') || location.pathname === '/app' || location.pathname.startsWith('/app/expenses/')) return <RealArea pathname={location.pathname} />;
  return <><MarketingNav /><main className="center-page"><span className="eyebrow">Page not found</span><h1>Let’s get you back to your ledger.</h1><Link className="button" to="/app">Open your ledger</Link></main></>;
}

function DemoPage({ search }: { search: string }) {
  const demo = useMemo(() => new DemoLedger(sessionStorage), []);
  const selectedId = new URLSearchParams(search).get('expense');
  return <LedgerView port={demo} demo={demo} selectedId={selectedId} onSelect={id => navigate(id ? `/demo?expense=${encodeURIComponent(id)}` : '/demo')} />;
}

function MarketingNav() {
  return <header className="site-nav"><Logo /><nav aria-label="Main navigation"><Link to="/pricing">Pricing</Link><Link to="/login">Sign in</Link><Link to="/demo" className="button button-small">Try sample demo <span aria-hidden="true">↗</span></Link></nav></header>;
}

function MarketingFooter() {
  return <footer className="marketing-footer"><Logo /><p>A shared record for two parents.<br />No money moves through CoParent Ledger.</p><div><Link to="/pricing">Pilot pricing</Link><Link to="/demo">Sample demo</Link></div></footer>;
}

function LandingPage() {
  return <><MarketingNav /><main><section className="hero"><div className="hero-copy"><span className="eyebrow"><span className="status-dot dot-teal" aria-hidden="true" /> Made for co-parents</span><h1>Shared expenses.<br /><em>A clearer picture.</em></h1><p>Keep the receipt, the agreed share, and every reimbursement together. So both parents can see what’s been received and what remains.</p><div className="hero-actions"><Link to="/demo" className="button">Try sample demo <span aria-hidden="true">→</span></Link><Link to="/login" className="text-button">Create your shared ledger ↗</Link></div><p className="hero-note">Two parent accounts. One shared record. No bank connection.</p></div><div className="hero-ledger" aria-label="Illustrative sample expense"><div className="sample-top"><span className="eyebrow">A shared record</span><span className="sample-tag">SAMPLE</span></div><div className="sample-expense"><span className="category-mark" aria-hidden="true">Sc</span><div><h2>School supplies</h2><p>Child 1 · Paid by Alex</p></div><strong>$120.01</strong></div><div className="sample-divider" /><dl className="sample-amounts"><div><dt>Jordan’s agreed share <span>40%</span></dt><dd>$48.00</dd></div><div><dt>Receipt confirmed by Alex</dt><dd>−$20.00</dd></div><div className="sample-remaining"><dt>Remaining</dt><dd>$28.00</dd></div></dl><div className="sample-history"><span className="activity-marker" aria-hidden="true" /><div><strong>Same details. For both parents.</strong><p>From the first receipt to the last confirmation.</p></div></div><div className="sample-bottom">School · Medical · Activities · Purchases</div></div></section>
    <section className="how-it-works"><div className="section-introduction"><span className="eyebrow">A simple way to keep track</span><h2>From a receipt<br />to a clear remaining amount.</h2></div><div className="step-grid"><article><span className="step-number">01</span><h3>Add the expense</h3><p>Record what you paid, attach a receipt, and propose your co-parent’s share.</p></article><article><span className="step-number">02</span><h3>Agree on the share</h3><p>The other parent reviews the same details and agrees or raises a concern.</p></article><article><span className="step-number">03</span><h3>Confirm what arrived</h3><p>Record an external payment. When the recipient confirms it, the remaining amount updates.</p></article></div></section>
    <section className="principles-section"><div><span className="eyebrow">Built around the details</span><h2>Every amount has a story.<br />Keep it in one place.</h2></div><div className="principles-list"><article><span aria-hidden="true">↔</span><div><h3>Clear in both directions</h3><p>See what you owe and what is owed to you separately, without an automatic offset.</p></div></article><article><span aria-hidden="true">◷</span><div><h3>A history you can follow</h3><p>See when an expense was submitted, reviewed, and reimbursed, with each parent’s own actions.</p></div></article><article><span aria-hidden="true">▤</span><div><h3>A focused shared ledger</h3><p>For expenses you manage together. No custody calendar, bank connection, or judgments about either parent.</p></div></article></div></section>
    <section className="bottom-cta"><span className="eyebrow">Start with a sample</span><h2>Walk through it together.</h2><p>Switch between Alex and Jordan to try the whole process with sample data.</p><Link to="/demo" className="button">Open the sample ledger →</Link></section>
  </main><MarketingFooter /></>;
}

function PricingPage() {
  return <><MarketingNav /><main className="pricing-page"><div className="pricing-intro"><span className="eyebrow">Pilot pricing</span><h1>One household.<br /><em>Both parents included.</em></h1><p>A proposed monthly price for one shared ledger. The second parent joins at no extra charge.</p></div><div className="pricing-layout"><article className="pricing-card"><span className="badge badge-approved">Proposed household plan</span><div className="price">$7.99<span>/ month</span></div><p className="price-subline">One household · Two adult accounts</p><div className="notice"><strong>Pilot pricing; billing not enabled.</strong><br />No checkout, payment card, or automatic charge.</div><ul className="included-list"><li>A shared record of child expenses</li><li>Receipts and proposed expense splits</li><li>Each parent’s agreement or concern</li><li>Partial payments and receipt confirmation</li><li>Activity history and basic CSV export</li></ul><Link className="button full-width" to="/demo">Try the sample demo →</Link><p className="field-help">Proposed future trial: 14 days, no card required.</p></article><div className="pricing-notes"><article><span className="eyebrow">One person pays</span><h2>Participation stays independent.</h2><p>The proposed subscription covers both parents. Paying for the household never lets one parent approve expenses or confirm payments for the other.</p></article><article><h3>Your existing records remain available.</h3><p>Under the planned model, cancellation would leave existing expenses, reviews, concerns, payment confirmations, receipts, history and basic export accessible. Creating new expenses after a trial may require a subscription.</p></article><article><h3>No fees on reimbursements.</h3><p>Payments happen outside CoParent Ledger. This service records what was reported and what the recipient confirmed.</p></article><p className="field-help">This is a pricing hypothesis for a pilot, not an active billing plan or a proven measure of demand.</p></div></div></main><MarketingFooter /></>;
}
