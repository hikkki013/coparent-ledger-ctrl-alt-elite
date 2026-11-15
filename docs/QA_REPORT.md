# Verification evidence

## Handoff follow-up comparison - 2026-11-15

Read the complete local [CHAT_HANDOFF.md](CHAT_HANDOFF.md), then the current originating local STATUS and REPOSITORY_REVIEW. Compared all 89 intended local paths with the prior local manifest and the verified published tree. The only new local path is **docs/CHAT_HANDOFF.md**; all preceding 88 local file hashes are unchanged. Main was freshly reloaded at `4d3e5902bfc0cf89a63e5bca9c074bb9917d23f6`; the browser owner menu identifies **hikkki013** and the repository remains **Private**. Since that immutable remote head is unchanged, the prior full 88-file archive verification remains the remote-content baseline; no new full-archive download is claimed in this follow-up.

Five existing local copies (README, STATUS, QA_REPORT, REPOSITORY_REVIEW, CRITERIA_MATRIX) are older than the corresponding verified remote documents. Those newer remote documents were retained as the base. Only the full handoff (with a dated receiving-chat preface), a README link, a review link and this STATUS/QA entry are prepared for publication. Application, backend, existing tests, all presentation files, economics and criteria content remain unchanged from the verified remote tree. No environment files, credentials, private user data or dependency/Git directories are selected.

This follow-up changes documentation only. Node/Pages/helper checks recorded in the earlier synchronization section below are **previous results**, not newly run here. React/Vite/Supabase boundaries remain as recorded there. No product-code change, financial workflow, new functional test, website deployment, history reset, force-push, visibility change or connector use occurs in this follow-up. The original local checkout/history is retained.

**Handoff upload verification:** the new context and documentation were saved through the hikkki013 browser in commits `8424ba550ad69b567bd89d7c28066aaffbe5904a` and `3b09f9536bf608ee9dd4d91489495895b3569471`. GitHub source-view read-back of CHAT_HANDOFF, README and REPOSITORY_REVIEW matched their reviewed SHA-256 hashes after normalizing line endings and the UI-omitted final newline. GitHub comparison against the previous verified head `4d3e590` showed exactly **5 documentation paths, 128 additions and 0 deletions**, two commits and one contributor (hikkki013); no application, test, PDF or other asset path changed. Local validation checked **97 relative Markdown links** with no missing target and found no matches in a limited common-credential-pattern scan of the five selected text files. The existing PDF still matches the originating local PDF. This final STATUS/QA follow-up records those observed checks and is itself read back from GitHub after saving. These are documentation checks, not a fresh product-test or deployment result.

## Browser synchronization verification - 2026-11-15

The original local project was accessible and its requested README, STATUS, REPOSITORY_REVIEW, QA_REPORT and CRITERIA_MATRIX were read before upload. The side-browser owner menu showed **hikkki013**; the exact destination `hikkki013/coparent-ledger-ctrl-alt-elite` showed **Private**. No GitHub connector, Git push, force-push, reset, repository rename or visibility change was used.

Compared the complete downloaded remote main archive at `998421f417beeff70c2958994e9050f9de13c523` against 88 intended local files: **67 identical, 10 changed, 11 local-only, zero remote-only files**. Application source, demo source, backend files and all existing tests matched byte-for-byte. The changed STATUS/QA retain the remote jury-verification evidence in fuller dated sections rather than dropping it. The upload set is limited to those 21 reviewed paths, including the existing English 10-slide PDF without regeneration. The original local checkout/history is retained separately; browser commits are not a claim that its Git history was reconciled.

Fresh commands executed in an isolated copy of the current local files, Node **24.21.0**:

| Check | Actual result in this synchronization pass |
| --- | --- |
| `npm test` | **62 passed, 0 failed**, exit 0 |
| `npm run demo:pages` | **PASS**, exit 0; generated SHA-256 `31776CBBF6329B4E3B9BFFEFB04AEDB16CA59AE5BF9418B94DD8C7B33756CE0D` |
| `./tests/scripts/publish-private.test.ps1` | **6/6 PASS**, simulated Git/GitHub commands only; the live helper was not executed |
| `npm run check` | **BLOCKED**, exit 2, TypeScript dependency unavailable |
| `npm run build` | **FAIL**, exit 1, `tsc` unavailable; no React/Vite production-build pass |
| `npm run test:integration` | **BLOCKED**, exit 2, missing dedicated Supabase test configuration; no live checks ran |
| Automated browser E2E / live RLS / independent accounts | **NOT RUN** |

Only the README public entry link is opened during this synchronization; previous financial-flow, mobile and persistence journeys remain historical QA, not reruns. No deployment is performed. Limited upload-manifest/credential-pattern/link/PDF checks are described in the final synchronization result below; they are not a comprehensive security audit.

### Verified GitHub synchronization result

Saved the reviewed **21-file delta** through the authenticated **hikkki013** side browser, preserving the existing main history and Private visibility. Re-downloaded main after content commit `9630b0b886895ae60b601631fe77861bf395a9f5`: **88/88 expected paths and SHA-256 hashes matched**, zero missing/extra paths or mismatches, **all 21 uploaded files verified**, and all **67 unchanged remote files preserved byte-for-byte**. The GitHub history page showed exactly the six commits below after baseline `998421f`, all authored by hikkki013, with no intervening commit. This final STATUS/QA follow-up records that completed comparison; its own uploaded text is checked separately in the browser.

| Group | Saved files | Verified content commit |
| --- | --- | --- |
| Documentation | BUSINESS_MODEL, CONTRACTS, CRITERIA_MATRIX, DEMO_SCRIPT, PRODUCT_SPEC, QA_REPORT, STATUS, SUBMISSION_BASELINE, MARKET_AND_ECONOMICS, README_AND_SUBMISSION_PROMPT, REPOSITORY_REVIEW | `6679ea76dcd0b66c42e162274b8345e8f5a40dce` |
| Presentation | Existing English 10-slide PDF, PITCH_SCRIPT_RU, generator, layout record | `d0ea620c6b293ce1d31b0a31d6f60884faea31a0` |
| Presentation assets | Three inspected synthetic images: paywall, receipt, reimbursement | `937b5fa6c8b12a199b801135399353c25f42e172` |
| Publication helper | scripts/publish-private.ps1 | `831fc06e7dd21bcf89a87aa5ea714b7132343c33` |
| Helper tests | tests/scripts/publish-private.test.ps1 | `928e450abf8d290afa9204503b3e93ce25e8954a` |
| README | Updated judge entry, complete workflow, deck/evidence links, limitations and verified destination | `9630b0b886895ae60b601631fe77861bf395a9f5` |

The uploaded PDF SHA-256 is `89be515c04d311d22686b71ae1d1cc17faa558d8fe7f49bf99af26602d4e9a21`, matching the original local PDF exactly; the downloaded file has **10 pages**. It was not regenerated. All **29 relative README link occurrences** resolve to files in the downloaded GitHub archive. The rendered GitHub README exposes the intended PDF and public demo links. The HTTPS demo entry page opened without registration and displayed its synthetic-data banner; no financial workflow, phone/device test, reset or deployment was performed in this synchronization pass.

The selected upload list contains no real .env, secrets, node_modules, .git directory or real family/receipt records. Limited common credential-pattern checks found no matches in the selected text files; three presentation images were inspected and are synthetic. This is not a comprehensive security audit. The pre-existing empty .env.example template was already identical remotely and was not re-uploaded.

The original local directory is retained without rewriting its Git history or remote configuration. Reviewed publication copies were used for browser uploads. Future terminal pushes must first reconcile that checkout with the browser-created history. Private source access still conflicts with the organizer's public-source submission requirement; no public copy or visibility change is authorized, and no accepted competition submission is claimed.


Earlier sections below preserve their original point-in-time claims, including the former browser connection failures and local-only work; this section supersedes their access/synchronization status.

## Repository documentation review - 2026-11-15

Fresh commands: `npm test` passed **62/62**; `npm run demo:pages` passed. `npm run check` was blocked by the unavailable TypeScript dependency; `npm run build` failed because `tsc` was unavailable; `npm run test:integration` reported BLOCKED due to missing dedicated test configuration and ran no live checks. These outcomes do not replace the prior dated public-browser evidence below. Current browser/desktop control fails before page access (`os error 3`), and the connected GitHub API identifies `karim312k1`; no writes were made through that identity. The supplied renamed private repository cannot be compared with this checkout yet.

The review checked repository inventory, documentation links, scripts and domain/demo contracts against current source and all 150 organizer answers. Corrected stale claims about missing paywall/deck, tab-only storage, reset scope and backend/standalone parity. Added the existing 10-slide PDF to the repository and linked it from README. No application-source change or new website deployment was made. The private publication helper now refuses divergent history rather than copying a local snapshot over a fresh remote checkout; syntax and six mocked guard/race scenarios passed, but no live publication was executed. No physical-phone, new public-flow, native RLS or complete security audit is claimed by this pass.

## Jury verification — 2026-11-15

- Deployed standalone single-file demo to Cloudflare Pages production `6d00a0a4`: https://coparent-ledger-demo.pages.dev/. The identical archive was first deployed as `final-qa-20261115` preview; the local `index.html` SHA-256 is `31776cbbf6329b4e3b9bffefb04aedb16ca59ae5bf9418b94dd8c7b33756ce0d` (119020 bytes). The archive contained only `index.html`; a limited common-secret-pattern scan found no matches, not a complete security audit.
- Production browser, synthetic inputs: created $64.20 expense with sample receipt and 50% share, submitted and approved $32.10. Reported $12.10 and observed $32.10 remaining; recipient confirmed and remaining became $20.00, with creation, receipt, submission, approval, report and confirmation in history. This test record remains in the browser's local demo data; no user data was reset.
- Isolated preview browser: added and renamed a child, archived/restored them, renamed a parent, created a category in the expense form, and created $97.50 expense at 60%. Confirmed $18.25 after simulating trial expiry: remaining changed from $58.50 to $40.25. Category correction was recorded in history and did not change financial amounts. Child statistics showed $97.50 purchase, $58.50 share, $18.25 confirmed, $40.25 remaining; a $5,000 future plan did not change these values. Trial expiry showed the $7.99 paywall; test access opened the expense form without payment. A reload restored the saved expense and access state.
- Viewport overrides requested 375x812 and 1280x800. Checked mobile expense/paywall and statistics, and desktop expense form. At mobile viewport the DOM client width and scroll width were both 360px; desktop both were 1265px (scrollbar excluded); dialogs checked did not overflow horizontally. This is not exhaustive responsive testing and no physical phone was used.
- `npm test`: 62 passed, 0 failed. `npm run demo:pages`: passed. `npm run check` and React/Vite `npm run build`: blocked by missing compiler/dependencies. `npm run test:integration`: blocked by missing dedicated Supabase test configuration. No independent two-account service, backend, RLS or real-device test is claimed. No real payments, cards or invitations were used. No new product code fixes were made in this pass.

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
