# CoParent Ledger | Ctrl Alt Elite

**A project by team Ctrl Alt Elite.**

A web app for co-parents to keep a child's expense, receipt, agreed share, reimbursements and remaining balance in one traceable record.

**[Open the live guest demo](https://coparent-ledger-demo.pages.dev/)** · [Pitch deck PDF](docs/presentation/CoParent_Ledger_Jury_Deck_v2.pdf) · [QA report](docs/QA_REPORT.md) · [Status](docs/STATUS.md) · [Market and economics](docs/MARKET_AND_ECONOMICS.md)

**For judges:** open the public link above and use **Add expense** to enter your own test amount, child, category and proposed share. Attach the built-in sample receipt, switch the demo parent role to approve, then record and confirm a partial reimbursement. The step-by-step example below includes expected balances.

No registration is required. Enter your own **synthetic test data** and complete the expense cycle. The published version runs two demonstration roles in one browser. Real accounts and cross-device collaboration are not connected or verified; no money is transferred and no cards are collected.

Updated **15 November 2026**. Last recorded public-site verification: **15 November 2026**, Cloudflare Pages deployment **6d00a0a4**. A later final audit freshly exercised the public site with an $87.65 expense, $35.06 agreed share and $11.11 confirmation, leaving $23.95 after reopening; see [FINAL_SYNC_REPORT.md](docs/FINAL_SYNC_REPORT.md). No new Cloudflare deployment was made. Earlier financial examples below retain their own provenance.

## Problem, value and price

For parents living apart, a receipt, an agreed split and a message about a transfer can end up in different places. CoParent Ledger connects those decisions so the remaining balance can be explained from its history.

**Track: Money. Audience: US co-parents aged 25–45** with recurring shared child expenses and a co-parent willing to coordinate. The proposed payer is an individual parent, making this a B2C offer. Audience fit and willingness to pay remain hypotheses.

The proposed subscription is **$7.99/month per household, both parents included**, with a 14-day trial without a card. A household is the co-parenting pair and their shared children, not a separate subscription per adult or child. Today's paywall grants test access only.

The reason to return is the next expense, an unresolved reimbursement or the need to review previous decisions. Guest progress is saved in the same browser. Willingness to pay, conversion and renewal remain hypotheses; no verified paying customers or retention metrics are claimed. [Market sizing and economics](docs/MARKET_AND_ECONOMICS.md) separate sources, assumptions and calculations.

## Try the complete workflow

Use **Viewing as** to switch the sample roles, initially Alex and Jordan. The following amounts refer to the new expense, not the whole dashboard.

1. Open the [public demo](https://coparent-ledger-demo.pages.dev/). If a previous visit left the trial expired, enable labeled test access; no payment is required.
2. As Parent A, add a **$64.20** expense, choose a child/category and propose **50%** for Parent B.
3. Attach the built-in sample receipt and submit for review. The receipt is synthetic, not evidence of this purchase, and may show another fixed example amount.
4. Switch to Parent B and approve the **$32.10** share. An objection is also available; disputed expenses stay outside agreed totals.
5. Record **$12.10** as an external reimbursement. The expense still shows **$32.10 remaining** while receipt is unconfirmed.
6. Switch to Parent A and confirm receipt: **$20.00 remaining**, with the actions in history.
7. Reopen in the same browser and device to continue with saved guest data. This does not demonstrate real-account collaboration.

This financial sequence was completed on the public site in the dated [QA report](docs/QA_REPORT.md). **Start clean** replaces this browser's saved demo records after confirmation.

## Available in the published version

| Area | Working behavior | Boundary |
| --- | --- | --- |
| Expenses | Manual amounts/shares, child/category, sample receipt, approval or objection, history | Demo roles; only built-in receipts |
| Reimbursements | Partial external-payment reports, recipient confirmation and remaining balance | No bank verification or transfer |
| Family | Rename parents; add, rename, archive and restore children | Archived records are preserved; no real family accounts |
| Categories | Create in the expense form; correct from details with an audit entry | Does not change financial agreement |
| Statistics | Approved purchases by child, payer and category; shares and reimbursements separate | Disputed/pending expenses and plans excluded; reimbursements are not new purchases |
| Future plans | Estimates and one-time conversion to a draft for an active child | No automatic debt, plan approval, editing or deletion |
| Paywall | Trial simulation, new-draft restriction, test unlock and reset | Browser-local test access, not a paid subscription |
| Persistence | Expenses, family, categories, plans and history survive tab closure | Same browser/device; no cloud backup or sync |
| Export | Basic CSV | No expense PDF export; the pitch deck is separate |

### Show the paywall

1. Select **Simulate end of trial**.
2. Select **Add expense** to see the $7.99/month offer and creation limit.
3. Select **Enable test access - no payment** to create new drafts again.
4. Select **Reset demo access** to restart the 14-day demo trial.

Existing expenses, sample receipts, history, CSV export and confirmation of recorded reimbursements stay available while ordinary creation is blocked. Plan-to-draft conversion uses that gate. **Known exception:** the current published demo still creates a replacement through **Create corrected draft** after trial expiry. The [final audit](docs/FINAL_SYNC_REPORT.md) reproduced this; it is an unresolved functional gap, so the creation gate is not complete. Resetting access does not reset the ledger.

## Financial rules

- Integer USD cents; basis-point shares with exact half-up rounding and residual assigned to the other part.
- Only approved expenses enter agreed balances; opposite payment directions stay separate.
- Pending reports reserve reporting capacity but **do not reduce the remaining balance**.
- Only the designated recipient confirms receipt; replay cannot subtract twice.
- Approval freezes financial details. Audited category corrections leave money/payment state unchanged.
- Future estimates are not debts. Converted drafts use the ordinary review and approval flow; attaching a receipt is optional.

Example: **$120.01 x 40% = $48.00**. Reporting $20.00 leaves $48.00 remaining; confirming receipt leaves $28.00. The built-in example additionally has a pending $10.00 report, still included in that remaining balance.

## Quick start: guest version

Requires **Node.js 24 or newer**. Demo builds and Node tests do not require React/Vite dependency installation.

```sh
npm run demo
```

Open **http://127.0.0.1:4173/demo**. This server exposes the synthetic demo, not authenticated /app routes. DEMO_PORT can change its port.

For a self-contained HTML file:

```sh
npm run demo:standalone
```

Open **dist-demo/coparent-demo.html**. If local files cannot use localStorage or Web Locks, use the HTTP server above. The standalone requires usable local storage and a current browser with Web Locks.

### Persistence and reset

Guest records use localStorage. Clearing site data can remove them; private browsing can discard them when the private session ends. Use test data only; this is not a secure backup.

A valid old sessionStorage copy migrates only if no persistent ledger exists. The old copy is retained; different old tab sessions are not merged. Corrupt/inaccessible storage is reported rather than silently replacing saved data.

Web Locks coordinate writes. If another tab changes the ledger, reload saved data before editing. **Start clean** and **Load examples** replace records after confirmation. Paywall state is separate and has an in-memory fallback when its storage is unavailable; the ledger still requires its own usable storage.

## Publish an update

```sh
npm run demo:pages
```

This generates **dist-pages/index.html** with embedded styles, scripts and the sample receipt. The build rejects unrelated files in dist-pages.

The existing **coparent-ledger-demo** Cloudflare Pages project uses **Direct Upload**:

1. Build and test the intended revision.
2. Inspect and upload only dist-pages, or a ZIP with index.html at its root. Exclude .env, credentials, real receipts, node_modules and Git history.
3. Create a new production deployment in the **same** Pages project.
4. Check the public URL and complete workflow after publication. Reusing the project preserves the pages.dev address; availability still needs verification.

The private repository has no automatic deployment connection. Direct Upload cannot simply switch to Git integration; a separate project is needed. Building locally does not publish anything.

## Verification

| Check | Evidence | Boundary |
| --- | --- | --- |
| npm test | **62 passed, 0 failed**, rerun 15 Nov 2026 in the browser-synchronization verification copy (Node 24.21.0) | Not live backend or full browser coverage |
| npm run demo:pages | **Passed**, rerun 15 Nov 2026 in the synchronization verification copy; only index.html generated | Not a new deployment/live-site fetch |
| Public expense cycle | Prior 15 Nov QA: $64.20 purchase, $32.10 share, $12.10 report/confirmation, $20.00 remaining | Not every input/failure path |
| Family/categories/statistics/plans/paywall/persistence | Dated public/preview checks and automated coverage in [QA_REPORT.md](docs/QA_REPORT.md) | Not React/backend feature parity |
| Responsive layout | Prior 15 Nov viewport checks at requested 375x812 and 1280x800 sizes | No physical phone or exhaustive accessibility audit |
| React check / Vite build | Rerun 15 Nov 2026: check blocked by missing TypeScript; build failed because tsc is unavailable | No current production-build pass |
| Supabase integration | Rerun 15 Nov 2026: BLOCKED, no dedicated configured test project; no live checks ran | Auth, RLS, live Storage/Edge, concurrency and device sync unverified |
| Automated browser E2E | Prepared, not executed | No automated E2E pass |

Rebuilt artifact SHA-256: **31776CBBF6329B4E3B9BFFEFB04AEDB16CA59AE5BF9418B94DD8C7B33756CE0D**, matching the recorded deployed artifact. This is not a fresh fetch of the website. No product code changed in this documentation update.

## Separate React/backend development

The repository also contains React/TypeScript/Vite source, Supabase migrations and Edge functions. The published standalone shares domain logic but does **not** deploy that React application or authenticate real parents. Its family customization and persistence must not be assumed to work in the backend version. The React demo still uses sessionStorage.

```sh
npm install
cp .env.example .env
npm run dev
```

PowerShell can use **Copy-Item .env.example .env**. The empty template defines VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Never expose a service-role key in frontend configuration. Real environment files are ignored. Prior installation was blocked; a verified dependency lockfile and successful current Vite build are not claimed.

React source routes: /, /pricing, /login, /invite/:token, /app, /app/expenses/:id and /demo. Missing backend configuration disables real-account use explicitly.

Dedicated synthetic test accounts, migrations and Edge deployment instructions are in [supabase/README.md](supabase/README.md). Single-user PostgreSQL checks bypass RLS and do not prove authorization or concurrent-client behavior.

Additional commands require their dependencies/configuration:

```sh
npm run check
npm run build
npm run test:integration
npm run test:e2e
```

The semantic check supports TYPESCRIPT_PATH and TYPECHECK_DEPS. Integration needs the backend guide's SUPABASE_TEST_* values and exits **BLOCKED** if unavailable. Browser E2E requires a running server and an installed Playwright browser; PLAYWRIGHT_BASE_URL selects the server. Prepared commands are not passing results.

## Submission status

The supplied criteria require a publicly deployed, usable end-to-end web product, an English PDF of at most 10 slides and a public source repository. The FAQ permits guest/demo use and local storage and does not require real charges or complete CI/CD. Competition-demo evidence does not establish readiness for real family financial data.

| Item | Current state |
| --- | --- |
| Public product URL | Previously verified as documented above; check availability at submission |
| English pitch PDF | [10-slide version 2](docs/presentation/CoParent_Ledger_Jury_Deck_v2.pdf) prepared 15 Nov 2026 with screenshots, value/retention and labeled economics; actual submission is not verified |
| Public source | **Unresolved:** the owner requires the working repository to remain **private**. No visibility change or public copy is authorized |

The current repository is [hikkki013/coparent-ledger-ctrl-alt-elite](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite). On 15 November 2026, the authenticated owner menu showed **hikkki013** and the repository showed **Private**. The complete remote archive at main commit `998421f417beeff70c2958994e9050f9de13c523` was compared with the current local project before preparing this update: all application source and existing tests matched byte-for-byte. The reviewed documentation, prepared presentation materials, publication helper and offline test were synchronized and read back; see [STATUS.md](docs/STATUS.md) and the [final audit](docs/FINAL_SYNC_REPORT.md) for the dated verification and remaining limitations. The original local Git history remains separate and was not reset or force-pushed. **Do not use karim312k1.**

The [criteria matrix](docs/CRITERIA_MATRIX.md) maps current evidence to the rules; the [baseline](docs/SUBMISSION_BASELINE.md) preserves an earlier point-in-time audit. [STATUS.md](docs/STATUS.md) and the dated [QA report](docs/QA_REPORT.md) record subsequent work. Full submission compliance is not claimed while public source access is unresolved.

The optional [private publication helper](scripts/publish-private.ps1) checks the exact destination, hikkki013 login and Private visibility. It requires a clean committed tree and refuses to push if remote main is not an ancestor of local HEAD. It does not reconcile the currently divergent/unverified histories for you. Inspect changes and restore the correct account before using it; the helper has not been live-tested in this review.

Its offline guard checks can be repeated in PowerShell with `./tests/scripts/publish-private.test.ps1`; the six scenarios use simulated Git/GitHub commands and make no remote writes. They are separate from the 62-test Node suite.

The captain must submit all three materials through the organizer's submission link: the English PDF, product URL and public source URL (FAQ Q82). The FAQ states 15 November at 12:00, without a timezone in the inspected answers; confirm the time against official event instructions. Keep the product available through the end of the final. Prepared files and links are not evidence of an accepted submission.

### Evidence for the scoring criteria

| Criterion | Weight | Evidence and limitation |
| --- | ---: | --- |
| Product & engineering | 40% | Input-dependent guest expense/reimbursement flow, history and exact money rules; [dated QA](docs/QA_REPORT.md), with backend/E2E limits |
| Value & retention | 20% | Working test paywall and saved guest progress; repeat expense cycles are the return hypothesis, not measured renewal |
| Problem & user | 15% | Specific US co-parent segment and recurring financial problem; no invented customer validation |
| Business potential | 15% | $7.99 household offer and sourced CAC/retention/LTV scenarios in [MARKET_AND_ECONOMICS.md](docs/MARKET_AND_ECONOMICS.md); viability remains unproved |
| Originality | 10% | Expense-first positioning with an explainable confirmed balance; existing alternatives are acknowledged, no unique-feature claim |

Stripe test checkout and real US feedback are optional pluses, not implemented proof in this submission. Mobile viewport smoke checks are recorded; physical-phone verification remains unavailable. CI/CD, AI and real payments are not required by the FAQ.

## Scope and documentation

No real payments, Stripe checkout, bank verification, OCR/AI, real-person invitations, custody calendar, messaging, expense PDF export or legal-enforceability claims. Confirmed-payment reversals, approved financial corrections, account/member deletion and operational cloud backup/recovery remain out of scope. The original backend has one household per user and two adults and does not match every standalone feature. USD only.

| Document | Purpose |
| --- | --- |
| [FINAL_SYNC_REPORT.md](docs/FINAL_SYNC_REPORT.md) | Final ZIP/hash reconciliation, fresh public-site test, documentation corrections and unresolved limitations |
| [SYNC_MANIFEST.json](docs/SYNC_MANIFEST.json) | Updated reconciled snapshot; exact raw SHA-256 and explicitly limited UTF-8/LF normalization |
| [SYNC_MANIFEST_ORIGIN_20261115.json](docs/SYNC_MANIFEST_ORIGIN_20261115.json) | Original supplied 89-file snapshot preserved unchanged for comparison |
| [STATUS.md](docs/STATUS.md) | Dated progress and changes |
| [QA_REPORT.md](docs/QA_REPORT.md) | Executed checks, failures and integration limits |
| [REPOSITORY_REVIEW.md](docs/REPOSITORY_REVIEW.md) | Latest local consistency review, corrections and remote-access blockers |
| [CHAT_HANDOFF.md](docs/CHAT_HANDOFF.md) | Full originating-chat context, persistent constraints and dated receiving-chat synchronization update |
| [SUBMISSION_BASELINE.md](docs/SUBMISSION_BASELINE.md) | Point-in-time audit and organizer answers |
| [CRITERIA_MATRIX.md](docs/CRITERIA_MATRIX.md) | Current requirement/evidence mapping and FAQ references |
| [MARKET_AND_ECONOMICS.md](docs/MARKET_AND_ECONOMICS.md) | Sourced market and subscription assumptions |
| [Russian speaking notes](docs/presentation/PITCH_SCRIPT_RU.md) | Five-minute oral draft for the English deck |
| [Presentation generator](docs/presentation/build_submission_v2.py) | Deck source; Python ReportLab/Pillow and referenced Windows fonts |
| [PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) | Original specification |
| [DEVELOPMENT_PROMPTS.txt](docs/DEVELOPMENT_PROMPTS.txt) | Original PROMPT 00-07 |
| [Shared types](src/domain/types.ts) and [command interface](src/data/ledger-port.ts) | Domain/adapter contracts |
