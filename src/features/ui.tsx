import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { LedgerError } from '../domain/types.ts';

export function navigate(to: string) {
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useLocation() {
  const read = () => ({ pathname: window.location.pathname, search: window.location.search });
  const [location, setLocation] = useState(read);
  useEffect(() => { const change = () => setLocation(read()); window.addEventListener('popstate', change); return () => window.removeEventListener('popstate', change); }, []);
  return location;
}

export function Link({ to, children, className = '' }: { to: string; children: ReactNode; className?: string }) {
  return <a href={to} className={className} onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) { event.preventDefault(); navigate(to); } }}>{children}</a>;
}

export function Logo() {
  return <Link to="/" className="brand"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M7 5h12a6 6 0 0 1 6 6v16H13a6 6 0 0 1-6-6V5Z" stroke="currentColor" strokeWidth="2"/><path d="M12 12h8m-8 5h8m-8 5h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span><span>CoParent<span className="brand-sub">LEDGER</span></span></Link>;
}

export function Modal({ title, children, onClose, busy = false, wide = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const element = ref.current; element?.showModal(); return () => { element?.close(); }; }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'modal-wide' : ''}`} aria-label={title} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="modal-heading"><h2>{title}</h2><button type="button" className="icon-button" aria-label="Close dialog" disabled={busy} onClick={onClose}>×</button></div>
    {children}
  </dialog>;
}

export function ErrorNotice({ message }: { message: string | null }) {
  return message ? <div className="notice notice-error" role="alert">{message}</div> : null;
}

export function errorMessage(error: unknown): string {
  if (error instanceof LedgerError) {
    switch (error.code) {
      case 'STALE_REVISION': return 'This expense changed. Review the latest version, then try your action again.';
      case 'UNAUTHENTICATED': return 'Your session has ended. Sign in again to continue.';
      case 'FORBIDDEN': return 'This action or record is not available to your account.';
      case 'INVITE_INVALID': return 'This invitation is unavailable. Check that you signed in with the invited, verified email, or ask for a new link.';
      case 'HOUSEHOLD_FULL': return 'This household already has two parents, or your account already belongs to a household.';
      case 'AMOUNT_EXCEEDS_AVAILABLE': return 'This amount exceeds the share available to record. Check payments already awaiting confirmation.';
      case 'IDEMPOTENCY_CONFLICT': return 'The saved request differs from this action. Refresh the ledger and review the record.';
      case 'BACKEND_UNAVAILABLE': return 'The shared service is unavailable. Your changes were not confirmed. Try again later.';
      default: return error.message;
    }
  }
  return 'We could not confirm this action. Your form is still here. Check your connection and try again.';
}

export const usd = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
export const percentage = (bps: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(bps / 100);
export function today() { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
export const dateLabel = (date: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
export const timeLabel = (date: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(date));
export const titleCase = (text: string) => text.toLowerCase().replaceAll('_', ' ').replace(/^./, char => char.toUpperCase());
