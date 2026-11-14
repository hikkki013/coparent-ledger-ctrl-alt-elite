export const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;
const KEY = 'coparent-ledger.demo-access.v1';
type Store = { getItem(key: string): string | null; setItem(key: string, value: string): void };
type AccessState = { startedAt: number; simulatedExpiry: boolean; testAccess: boolean };

/** A browser-local demonstration only. This is not an entitlement or payment record. */
export class DemoAccess {
  #store: Store;
  #now: () => number;
  constructor(store: Store, now: () => number = Date.now) {
    this.#store = store; this.#now = now;
    if (this.#store.getItem(KEY) === null) this.reset();
  }
  #read(): AccessState {
    const parsed = JSON.parse(this.#store.getItem(KEY) ?? 'null') as AccessState | null;
    if (!parsed || !Number.isFinite(parsed.startedAt) || typeof parsed.simulatedExpiry !== 'boolean' || typeof parsed.testAccess !== 'boolean') throw new Error('Demo access state is unavailable. Reset demo access to continue.');
    return parsed;
  }
  #write(value: AccessState): void { this.#store.setItem(KEY, JSON.stringify(value)); }
  status(): 'trial' | 'expired' | 'test-access' {
    const state = this.#read();
    if (state.testAccess) return 'test-access';
    return state.simulatedExpiry || this.#now() - state.startedAt >= TRIAL_MS ? 'expired' : 'trial';
  }
  canCreate(): boolean { return this.status() !== 'expired'; }
  simulateExpiry(): void { this.#write({ ...this.#read(), simulatedExpiry: true, testAccess: false }); }
  enableTestAccess(): void { this.#write({ ...this.#read(), testAccess: true }); }
  reset(): void { this.#write({ startedAt: this.#now(), simulatedExpiry: false, testAccess: false }); }
}

export function browserDemoAccess(): { access: DemoAccess; persistent: boolean } {
  try {
    const access = new DemoAccess(window.localStorage);
    access.status();
    return { access, persistent: true };
  } catch {
    const data = new Map<string, string>();
    const access = new DemoAccess({ getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); } });
    return { access, persistent: false };
  }
}
