import { useEffect, useMemo, useState } from 'react';
import { createRealServices } from '../../data/supabase-ledger.ts';
import { ErrorNotice, Link, Logo, errorMessage, navigate } from '../ui.tsx';
import { LedgerView } from '../expenses/LedgerView.tsx';

const INVITE_KEY = 'coparent:pending-invite';
type Services = NonNullable<ReturnType<typeof createRealServices>>;
type User = { id: string; email: string };

export function UnavailablePage() {
  return <><header className="site-nav"><Logo /><Link to="/demo" className="button button-secondary">Try sample demo</Link></header><main className="center-page"><span className="eyebrow">Shared ledger</span><h1>The shared service is not connected yet.</h1><p>Real accounts, shared records and receipt uploads are unavailable in this installation. The sample demo works separately in this browser tab.</p><div className="notice">Demo changes are synthetic and are not saved to a shared account.</div><Link to="/demo" className="button">Open sample demo →</Link></main></>;
}

export function RealArea({ pathname }: { pathname: string }) {
  const services = useMemo(() => createRealServices(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = pathname.startsWith('/invite/') ? pathname.slice('/invite/'.length) : null;
  useEffect(() => { if (token) sessionStorage.setItem(INVITE_KEY, token); }, [token]);
  useEffect(() => {
    if (!services) { setLoading(false); return; }
    let current = true;
    const refresh = async () => { try { const next = await services.auth.getUser(); if (current) { setUser(next); setError(null); } } catch (cause) { if (current) setError(errorMessage(cause)); } finally { if (current) setLoading(false); } };
    void refresh();
    const unsubscribe = services.auth.onAuthChange(() => { void refresh(); });
    return () => { current = false; unsubscribe(); };
  }, [services]);
  useEffect(() => {
    if (user && (pathname === '/login' || pathname === '/app')) { const pending = sessionStorage.getItem(INVITE_KEY); if (pending) navigate(`/invite/${pending}`); else if (pathname === '/login') navigate('/app'); }
  }, [user, pathname]);
  if (!services) return <UnavailablePage />;
  if (loading) return <div className="center-page" role="status"><Logo /><p>Opening your session…</p></div>;
  if (error && !user) return <div className="center-page"><Logo /><ErrorNotice message={error} /><button className="button" onClick={() => window.location.reload()}>Try again</button></div>;
  if (!user) return <LoginPage services={services} invited={Boolean(token || sessionStorage.getItem(INVITE_KEY))} onSignedIn={async () => { setUser(await services.auth.getUser()); }} />;
  if (token) return <AcceptInvite services={services} token={token} user={user} />;
  return <LedgerView port={services.ledger} selectedId={pathname.startsWith('/app/expenses/') ? pathname.slice('/app/expenses/'.length) : null} onSelect={id => navigate(id ? `/app/expenses/${id}` : '/app')} onLogout={async () => { await services.auth.logout(); setUser(null); navigate('/login'); }} />;
}

function LoginPage({ services, invited, onSignedIn }: { services: Services; invited: boolean; onSignedIn: () => Promise<void> }) {
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  return <><header className="site-nav"><Logo /><Link to="/demo">Explore the sample demo →</Link></header><main className="auth-layout"><div className="auth-intro"><span className="eyebrow">A little more clarity</span><h1>One shared record.<br />Your own account.</h1><p>See what was spent, what you agreed to, and what has been received.</p><p className="fine-print">Each parent signs in separately and makes their own decisions.</p></div><section className="auth-card"><h2>{register ? 'Create your account' : 'Welcome back'}</h2><p>{invited ? 'Use the email your co-parent invited. Your invitation will continue after sign-in.' : 'Start with your own account. Invite your co-parent when you are ready.'}</p><ErrorNotice message={error} />{notice && <div className="notice" role="status">{notice}</div>}
    <form onSubmit={async event => { event.preventDefault(); if (busy) return; setBusy(true); setError(null); setNotice(null); try { if (register) { const pending = sessionStorage.getItem(INVITE_KEY); const redirect = `${location.origin}${pending ? `/invite/${pending}` : '/app'}`; const result = await services.auth.signup(email.trim(), password, redirect); if (result.needsEmailConfirmation) setNotice('Check your email to confirm your account. Return to this tab or your invitation link after confirmation.'); else await onSignedIn(); } else { await services.auth.login(email.trim(), password); await onSignedIn(); } } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); } }}>
      <label htmlFor="auth-email">Email address</label><input id="auth-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} disabled={busy} />
      <label htmlFor="auth-password">Password</label><input id="auth-password" type="password" autoComplete={register ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={register ? 8 : undefined} disabled={busy} />
      {register && <p className="field-help">Use at least 8 characters. No payment card is needed.</p>}
      <button className="button full-width" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</button>
    </form><button className="text-button auth-toggle" disabled={busy} onClick={() => { setRegister(!register); setError(null); setNotice(null); }}>{register ? 'Already have an account? Sign in' : 'New here? Create an account'}</button></section></main></>;
}

function AcceptInvite({ services, token, user }: { services: Services; token: string; user: User }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [key] = useState(() => crypto.randomUUID());
  return <><header className="site-nav"><Logo /><span className="fine-print">Signed in as {user.email}</span></header><main className="center-page"><span className="eyebrow">Your shared ledger</span><h1>Join your co-parent’s household.</h1><p>Both parents can view submitted expenses and their activity history. Your account keeps control of your own approvals and payment confirmations.</p><div className="notice">This link works only for its invited, verified email address. A household has two parent accounts.</div><ErrorNotice message={error} /><button className="button" disabled={busy} onClick={async () => { setBusy(true); setError(null); try { await services.ledger.acceptInvite(token, { idempotencyKey: key }); sessionStorage.removeItem(INVITE_KEY); navigate('/app'); } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); } }}>{busy ? 'Joining…' : 'Accept invitation'}</button><button className="text-button" disabled={busy} onClick={async () => { setBusy(true); setError(null); try { await services.auth.logout(); navigate(`/invite/${token}`); } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); } }}>Use a different account</button></main></>;
}
