import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './styles.css';

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="center-page" role="alert"><span className="eyebrow">Unable to open this page</span><h1>Your ledger could not be opened.</h1><p>This browser may have blocked tab storage, or the saved sample data may be unavailable. If an action was in progress, review the ledger before trying it again.</p><p>Allow storage for this site and reload, or return to the home page. Real accounts and sample data remain separate.</p><button className="button" onClick={() => window.location.reload()}>Reload page</button><a className="button button-secondary" href="/">Go to home page</a></main>;
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><AppErrorBoundary><App /></AppErrorBoundary></React.StrictMode>);
