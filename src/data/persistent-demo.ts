import {DemoLedger, parseDemoState} from './demo-ledger.ts';
import type {DemoStorage} from './demo-ledger.ts';
import type {DemoAccess} from './demo-access.ts';

export const DEMO_STORAGE_KEY = 'coparent-ledger.demo.v1';
const LOCK_NAME = 'coparent-ledger.demo.v1.write';
export interface DemoLocks { request<T>(name: string, callback: () => T | Promise<T>): Promise<T> }

/** Must be called while holding the same cross-tab lock as writes. Never removes the old session. */
export function initializeDemoStorage(persistent: DemoStorage, session: DemoStorage): 'existing' | 'migrated' | 'new' {
  const current = persistent.getItem(DEMO_STORAGE_KEY);
  if (current !== null) { parseDemoState(current); return 'existing'; }
  const old = session.getItem(DEMO_STORAGE_KEY);
  if (old === null) return 'new';
  parseDemoState(old);
  // Do not overwrite any existing persistent copy, even if another writer ignored the lock.
  if (persistent.getItem(DEMO_STORAGE_KEY) !== null) throw new Error('Saved demo changed in another tab. Reload before continuing.');
  persistent.setItem(DEMO_STORAGE_KEY, old);
  const saved = persistent.getItem(DEMO_STORAGE_KEY);
  if (saved !== old) throw new Error('The migrated demo could not be verified; the previous tab copy was kept.');
  parseDemoState(saved);
  return 'migrated';
}

/** All demo writes must be serialized by Web Locks and reject stale displayed state. */
export class DemoStorageCoordinator {
  #storage: DemoStorage;
  #locks: DemoLocks;
  #known: string | null;
  constructor(storage: DemoStorage, locks: DemoLocks) { this.#storage = storage; this.#locks = locks; this.#known = storage.getItem(DEMO_STORAGE_KEY); }
  acceptLatest(): void { const raw = this.#storage.getItem(DEMO_STORAGE_KEY); if (raw !== null) parseDemoState(raw); this.#known = raw; }
  async reload<T>(render: () => T | Promise<T>): Promise<T> {
    return this.#locks.request(LOCK_NAME, async () => { this.acceptLatest(); return render(); });
  }
  async run<T>(operation: () => T | Promise<T>): Promise<T> {
    return this.#locks.request(LOCK_NAME, async () => {
      if (this.#storage.getItem(DEMO_STORAGE_KEY) !== this.#known) throw new Error('Demo data changed in another tab. Reload saved data before making changes.');
      const result = await operation();
      this.#known = this.#storage.getItem(DEMO_STORAGE_KEY);
      return result;
    });
  }
}
export async function openPersistentDemo(persistent: DemoStorage, session: DemoStorage, locks: DemoLocks, access?: DemoAccess) {
  return locks.request(LOCK_NAME, () => {
    const origin = initializeDemoStorage(persistent,session);
    const ledger = new DemoLedger(persistent, 'alex', access);
    const coordinator = new DemoStorageCoordinator(persistent, locks);
    return { origin, ledger, coordinator };
  });
}
