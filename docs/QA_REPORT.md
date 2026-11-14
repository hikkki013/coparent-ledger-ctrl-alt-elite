# Verification — 2026-11-14

| Executed check | Result | Boundary |
| --- | --- | --- |
| Domain/demo/transport/receipt/recovery Node suite | PASS: 48 tests in final integrated run | Exact amounts, roles, revisions, replay, CSV, command mapping, Edge handlers with controlled transport, recovery after acknowledged mutations |
| TypeScript semantic source check | PASS: 20 source files, compiler 6.0.3 | Actual React declarations; not a bundled Vite build |
| PostgreSQL 18 migration | PASS in fresh single-user cluster | Actual SQL compiles and executes |
| SQL ledger, receipt and invitation suites | PASS: all three | Commands, explicit identity/state/replay assertions; single-user BYPASSES RLS |
| Standalone HTML generation | PASS | Shared domain compiled without npm; no browser execution claim |
| Standalone action-handler harness | PASS in Node, reviewer | Real DemoLedger/handlers complete partial-payment flow; not browser E2E |
| Independent backend source review | No critical/high issue found | Actual actor/visibility/locking/token/receipt code reviewed |
| Private GitHub source upload | PASS via browser | hikkki013/coparent-ledger; no real environment secrets included |
| Published synthetic demo manual flow | PASS on HTTPS | New $73.25 expense, 60% share, sample receipt, approval, $12.50 pending and confirmed, $31.45 remaining, history and same-tab refresh |
| Responsive smoke check | PASS with limits | 375×812 and 1280×800 viewport inspection and selected actions; no physical phone checked |

## Demo paywall - 2026-11-15

- Node suite: 51/51 passed, including trial expiry, simulation, persistence, test activation, reset, blocked creation and confirmation of existing reimbursement while blocked.
- TypeScript semantic source check passed for 21 files; standalone Pages build passed.
- Public manual checks: trial simulation, $7.99 dialog, no-card test activation, blocked and unlocked creation, existing history and confirmation while blocked. A new $52 expense was approved and $8.25 reported against $20.80; browser timed out before the final confirmation of that new expense. A separate existing $10 sample payment was confirmed while blocked. Preview responsive screenshots inspected at 375x812 and 1280x800; no physical phone checked.
- Access is localStorage-backed with a tab-memory fallback; at the time expenses used separate sessionStorage; standalone expenses now use a separate localStorage key. No actual payment, card input or subscription.

## BLOCKED / UNRUN

- Native RLS/grants, real concurrent transactions: single-user PostgreSQL cannot verify these.
- Supabase Auth/REST/Storage/Edge deployment: no configured test project. Live integration exits 2 with BLOCKED and runs no checks.
- npm install, real lockfile and Vite production build: restricted terminal cannot resolve npm registry.
- Automated browser E2E suite remains UNRUN. The published standalone demo was manually exercised and viewport-smoke-checked as noted above; no physical phone or separate browser profile was checked.
- Terminal Git synchronization remains blocked by DNS restrictions. Native Edge browser uploads succeeded under hikkki013; the separate API connector is still karim312k1 and was not used for writes. Clone the remote in a normally networked environment to obtain its browser commit history.

## Financial evidence

Golden E1: owed4800, confirmed2000, pending1000, remaining2800, available1800. E2: owed4278, remaining4278. Disputed E3 proposed6999 and pending E4 proposed1335 excluded. Agreed9078, confirmed2000, remaining7078; pending1000 remains included. Alex owes4278 and is owed2800, without netting.

Clean cycle: total12001, share4000bps =>4800. Report2000 => remaining4800/pending2000. Confirm by creditor => remaining2800/pending0. Duplicate confirmation never reduces twice.

## Review corrections

Preserved failed form inputs; local calendar date defaults; amount-specific irreversible confirmations; guarded storage failures; auth callback tokens removed before session persistence; payment IDs in audit; invitation survives authentication without auto-creating a household.

TypeScript tooling used the installed official compiler and official React declarations (DefinitelyTyped React index blob 3a2f677611e3075fe4e71a85af4c37b95ab592be, csstype index da0affda4f3b2544621fcb786bc708bb9394b749). These temporary tooling files are not application source. See README and supabase/README for reproducible commands and test-environment variables.

No real payments, billing or real-person invitations occurred. Local demo and isolated SQL success do not establish production readiness.


## Family workspace update

Automated: 55/55 Node tests, including family identity, category correction without financial mutation, approved-only statistics, and plans excluded from balances. Browser: production guest launch, add child, view statistics, create future plan, add category in expense form, create and approve an expense, report $12 while $48 remained due, then confirm receipt and observe the remaining $36 and history. Changed the approved expense category from Music to Activities and verified the $36 balance, $12 confirmed payment and category-change history remained correct. Preview initially had a broken form submit handler; it was corrected before production and rechecked there. This is not full functional, responsive, real-device, React, security, or real-account backend verification.


## Persistent guest progress

Node tests cover legacy migration, no overwrite of existing local data, malformed data and write failures, cross-tab stale writes and recovery, and an approved expense with pending/confirmed reimbursement after reopening. Public site: migrated the previously open sample session; created a new synthetic $90 expense with custom child/category and receipt; approved $45, reported $13 (balance remained $45), confirmed (balance $32), created a plan, closed the tab and reopened: expense/child/category, $32 balance and plan remained. Preview separately confirmed receipt history, cancellation of reset, cross-tab notification/reload and paywall activation without a card. Not a physical phone, separate browser profile, React browser, or real two-account backend test.


## Jury verification — 2026-11-15

- Cloudflare Pages production `6d00a0a4`: https://coparent-ledger-demo.pages.dev/. Identical single-file archive first tested on isolated preview. Local index.html SHA-256: 31776cbbf6329b4e3b9bffefb04aedb16ca59ae5bf9418b94dd8c7b33756ce0d (119020 bytes); limited common-secret-pattern scan found no matches, not a complete audit.
- Production: $64.20 expense with sample receipt; $32.10 agreed; $12.10 reported left $32.10 due; recipient confirmed and $20.00 remained with history. Synthetic test record retained in local browser data.
- Preview: renamed parent and child, added/archived/restored child, created and corrected category without changing money, checked per-child statistics and a $5,000 plan excluded from balances. $97.50 expense at 60% gave $58.50 due; $18.25 pending did not reduce it, confirmed after trial expiration left $40.25. Paywall $7.99 and no-payment unlock worked; reload restored records and access.
- Requested 375x812 and 1280x800 viewport overrides: checked mobile expense/paywall/statistics and desktop expense form. Checked page and dialogs had no horizontal overflow. Not a full responsive audit; no physical phone.
- npm test: 62/62 passed; npm run demo:pages passed. TypeScript check and React/Vite build blocked by missing dependencies; live Supabase integration blocked by missing dedicated test configuration. No two-account, RLS, real payment, card or invitation test. No product source code was changed in this pass.
