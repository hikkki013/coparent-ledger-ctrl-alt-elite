# Final transfer and consistency report — 15 November 2026

## Submission preparation update — 15 November 2026

The owner authorized public visibility, superseding the earlier PRIVATE-only instruction. **The repository remains private.** A mirror of GitHub main at [`fff0e9f`](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/commit/fff0e9f7928d9cf1cd13fd5c6b21b50e6484ffcc) includes 81 commits. Its author metadata contains a Gmail address: making history public would disclose it. Publication is paused pending a decision and resolution of that personal-data issue. A pattern scan of 188 historical named blobs detected no matches for selected common token/private-key patterns or sensitive filenames; this is not proof that all secrets or personal information are absent. Historical presentation images were visually reviewed and the receipt is explicitly synthetic. Anonymous GitHub access has not been verified. See [README_REVIEW_REPORT.md](README_REVIEW_REPORT.md). Earlier PRIVATE-only instructions below are historical.

Fresh production test with synthetic `demo-expense-169`: a $100 expense with 50% share was approved; reporting $20 left $50, confirmation reduced it to $30, and the amount and history survived refresh. The trial-expiry paywall showed $7.99 per household; enabling test access opened the expense form without a card. Previous records were not reset. This was a single browser using synthetic roles, not a real two-account or real payment test. A separate anonymous browser session has not been checked.

The 10-page English PDF was updated only to replace its outdated private-source statement with a neutral repository address; the existing product link is preserved. The original PDF and audit history remain intact. React/Vite, live Supabase, an exhaustive secret/personal-data review and anonymous GitHub access remain unverified. Do not claim the three submission materials are ready while the repository remains private.


## Correction paywall update — 15 November 2026

**Current update:** the earlier F-02 exception described in historical sections below was fixed in the demo command and standalone UI and deployed by Direct Upload. Checked source baseline before changes: [`1094bf4405e11882b3e51543193932b0a379c0b0`](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/commit/1094bf4405e11882b3e51543193932b0a379c0b0); source and test commits culminate at [`ab10004305b1c5f197b7d051a8115a5c92657dac`](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/commit/ab10004305b1c5f197b7d051a8115a5c92657dac). Production deployment `775a8f72-e003-4d2f-87fb-456fe30925c2` at [the existing public URL](https://coparent-ledger-demo.pages.dev/); test preview `4cbb9598-04ff-4e3a-9885-60578d518fc3`.

Fresh local runs: `npm test` **65 passed, 0 failed**; `npm run demo:pages` passed, generated `index.html` SHA-256 `16f045bfdbe0d1038d55496d42ee25b453c12a93e7ba9d7cc6fcf713f0e28cbc`. `npm run check` blocked, missing TypeScript; `npm run build` failed, tsc unavailable. React build and React browser behavior were not verified.

Fresh preview browser checks: expired trial blocked PENDING and DISPUTED correction with a $7.99 test-only paywall; visible status, synthetic receipt and history remained unchanged. Test access then permitted a PENDING replacement and created a private draft with no receipt. For a DISPUTED expense, a correction form opened before expiry was submitted after expiry in a second tab; submission returned INVALID_STATE, while the original remained disputed with its sample receipt and history. Ordinary Add expense and plan conversion showed the paywall after expiry; a new $77.77 synthetic plan remained marked no debt. Paywall visually checked at 375×812 and 1280×800. In-memory/domain unit tests cover atomic unchanged state and idempotent replay; no browser double-submit claim is made. Trial state in the first tab remained visually stale after cross-tab expiry until rerender, although the command rejected the submission.

Fresh production browser check after publication: existing synthetic PENDING and DISPUTED expenses retained their visible statuses, sample receipts and history; after trial expiry Create corrected draft showed the $7.99/no-payment paywall for both. Previously saved guest records survived reload; demo access was returned to active trial. Production unlock/race and comprehensive financial regression were not rerun in this pass. Historical observations below retain their original dates and deployment context.

Repository remains PRIVATE. A public-source competition requirement is still unresolved; no full submission readiness, real payment, real shared accounts, live backend integration or exhaustive responsive test is claimed.


**Project:** CoParent Ledger · **Team:** Ctrl Alt Elite. **Repository:** [hikkki013/coparent-ledger-ctrl-alt-elite](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite). Required visibility: **PRIVATE**. The authenticated browser owner menu showed **hikkki013** and the repository showed **Private**. No other GitHub identity/connector, public mirror, force-push or history reset was used.

**Conclusion:** the supplied 89-file transfer snapshot is accounted for: **83 files match exactly and 6 are newer agreed remote documentation updates that were retained**. No missing file or transfer conflict was found. Core money, plan and persistence behavior passed the fresh public manual journey below. **One published paywall route remains defective**, and receipt-required documentation was corrected. This is not a claim of full product/security coverage or full competition readiness: public-source submission access still conflicts with the owner's PRIVATE instruction.

## 1. Exact revision and method

- Checked code/content commit: [7bb94ce405374bd9b762f5fba0eed36e5ec78280](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/commit/7bb94ce405374bd9b762f5fba0eed36e5ec78280); [browse this immutable tree](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/tree/7bb94ce405374bd9b762f5fba0eed36e5ec78280).
- Downloaded through the authenticated browser: [ZIP for the exact commit](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/archive/7bb94ce405374bd9b762f5fba0eed36e5ec78280.zip), not an unidentified moving-main ZIP.
- ZIP SHA-256: `12516ec6569f56062fbd731a95e81fc51e3200682839792a1d9677d279c5f96a`.
- Supplied local manifest: docs/SYNC_MANIFEST.json; original SHA-256 `96482a108e0fa5eb98c85c13c838eaef97ca6ba6089bb5bd8035349e46bf1bf5`. Its unchanged bytes are preserved as [SYNC_MANIFEST_ORIGIN_20261115.json](SYNC_MANIFEST_ORIGIN_20261115.json).
- Read the complete local [CHAT_HANDOFF](CHAT_HANDOFF.md) and parsed all 89 manifest entries. All 89 entries also match the actual originating local files, so no unreported local file change was hidden by a stale manifest.
- Extracted the ZIP and compared every listed path, raw byte length and SHA-256. Text normalization, where allowed, removes only a UTF-8 BOM and maps CRLF/CR to LF; it does **not** trim final newlines, spaces or other content. All 83 matches were raw byte matches; normalization did not hide any content difference.
- The ZIP has 89 paths, with no outside-manifest product file. The manifest's own path is intentionally self-excluded, not a missing product file.

## 2. Transfer classification

| Classification | Count | Resolution |
| --- | ---: | --- |
| Exact byte match | 83 | Retained unchanged |
| Match only after permitted normalization | 0 | None |
| Missing file | 0 | None |
| Outdated GitHub version | 0 | None |
| More recent agreed remote change | 6 | Retained as the audit-edit base |
| Conflict | 0 | No unresolved transfer conflict |
| Unable to verify | 0 | All 89 manifest paths checked in the downloaded ZIP |

| Different path at checked commit | Classification | Evidence/reason |
| --- | --- | --- |
| [README.md](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/blob/7bb94ce405374bd9b762f5fba0eed36e5ec78280/README.md) | More recent agreed remote change | Adds verified owner/private status, dated browser-sync evidence and handoff links; replaces the obsolete assertion that remote state was unverified. |
| [docs/CHAT_HANDOFF.md](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/blob/7bb94ce405374bd9b762f5fba0eed36e5ec78280/docs/CHAT_HANDOFF.md) | More recent agreed remote change | Preserves the complete original handoff and adds a dated receiving-chat update; no original handoff content was removed. |
| [docs/CRITERIA_MATRIX.md](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/blob/7bb94ce405374bd9b762f5fba0eed36e5ec78280/docs/CRITERIA_MATRIX.md) | More recent agreed remote change | Updates access/parity evidence while retaining the unresolved public-source requirement and Private constraint. |
| [docs/QA_REPORT.md](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/blob/7bb94ce405374bd9b762f5fba0eed36e5ec78280/docs/QA_REPORT.md) | More recent agreed remote change | Prepends actual synchronization/read-back results and distinguishes them from the originating local checks; retains older QA. |
| [docs/REPOSITORY_REVIEW.md](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/blob/7bb94ce405374bd9b762f5fba0eed36e5ec78280/docs/REPOSITORY_REVIEW.md) | More recent agreed remote change | Adds receiving-chat comparisons and marks original access failures historical rather than current. |
| [docs/STATUS.md](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/blob/7bb94ce405374bd9b762f5fba0eed36e5ec78280/docs/STATUS.md) | More recent agreed remote change | Prepends verified transfer/handoff results while preserving the originating progress records. |

The newer work is traceable through [browser synchronization](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/commit/4d3e5902bfc0cf89a63e5bca9c074bb9917d23f6) and [handoff verification](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/commit/7bb94ce405374bd9b762f5fba0eed36e5ec78280). The originating local README/STATUS/QA/review/criteria/handoff were not copied over those newer versions. Content reconciliation does not imply that the original local checkout's Git history was merged with browser commits.

## 3. Consistency against source, current documents and the existing PDF

Links below pin executable evidence to the checked code commit. Current documents have final-audit qualifications; older dated progress entries are preserved as historical evidence.

| Required point | Checked evidence | Finding |
| --- | --- | --- |
| Ctrl Alt Elite | [README](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/blob/7bb94ce405374bd9b762f5fba0eed36e5ec78280/README.md#L1), [criteria](CRITERIA_MATRIX.md) | Correct team attribution in current documents. PDF text does not contain a team attribution; its existing product title was not changed. |
| $7.99/month for both parents | [paywall source](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/blob/7bb94ce405374bd9b762f5fba0eed36e5ec78280/demo/app.js#L75), README, PDF slide 4, fresh live modal | Consistent household unit; no charge/card/subscription is connected. |
| Child/parent names, categories and history | [demo ledger](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/blob/7bb94ce405374bd9b762f5fba0eed36e5ec78280/src/data/demo-ledger.ts#L217), [UI](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/blob/7bb94ce405374bd9b762f5fba0eed36e5ec78280/demo/app.js#L97), PDF slide 6 | Fresh add/rename/archive/restore and parent rename/restore succeeded; custom category and audited correction succeeded. No artificial ten-child cap in source; fresh Node suite includes a >10-child command test, but >10 children were not manually added to the site. |
| Approved-only statistics | [childStatistics](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/blob/7bb94ce405374bd9b762f5fba0eed36e5ec78280/src/data/demo-ledger.ts#L270) | Live $87.65 purchases stay separate from $11.11 confirmed reimbursements. Pending/disputed/draft/withdrawn entries and plans are excluded. |
| Pending reimbursement does not reduce remaining | [deriveSettlement](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/blob/7bb94ce405374bd9b762f5fba0eed36e5ec78280/src/domain/settlement.ts#L18), PDF slide 3 | PASS live: $35.06 remains after an $11.11 report; only confirmation reduces it to $23.95. |
| Future plans do not automatically create debt | [createPlan/convertPlan](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/blob/7bb94ce405374bd9b762f5fba0eed36e5ec78280/src/data/demo-ledger.ts#L285), PDF slide 3 | PASS live: $1,234.56 plan and its unapproved derived records leave the approved statistics unchanged. |
| Paywall is test-only | [DemoAccess](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/blob/7bb94ce405374bd9b762f5fba0eed36e5ec78280/src/data/demo-access.ts), PDF slide 4 | No real billing; Add expense and plan conversion are blocked when expired and test unlock works. Corrected-draft route is an open exception (F-02). |
| Same-browser persistence | [persistent-demo](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/blob/7bb94ce405374bd9b762f5fba0eed36e5ec78280/src/data/persistent-demo.ts), PDF slide 5 | PASS live after tab closure/reopen, same browser/device only. No cloud/secure-backup claim. |
| Demo roles are not real collaborative accounts | README, live banner/footer, PDF slides 3/10 | Explicit synthetic roles, no money movement and no verified independent-account/device service. |
| Prepared English PDF, ten slides | [existing PDF](presentation/CoParent_Ledger_Jury_Deck_v2.pdf) | pypdf read 10 English-text pages. SHA-256 `89be515c04d311d22686b71ae1d1cc17faa558d8fe7f49bf99af26602d4e9a21`, identical to the origin manifest. Not regenerated or visually re-reviewed in this pass. |

## 4. Corrections and unresolved findings

**F-01 — corrected documentation:** README said converted drafts required a receipt. [assertCanSubmit](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/blob/7bb94ce405374bd9b762f5fba0eed36e5ec78280/src/domain/transitions.ts#L26) does not require one, and PRODUCT_SPEC already says optional. A new plan-derived draft was freshly submitted on the public site with **Receipt not attached**. README now says optional receipt plus ordinary approval. No product rule was changed.

**F-02 — OPEN functional gap:** trial expiry does not block **Create corrected draft**. [replaceExpenseWithDraft](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/blob/7bb94ce405374bd9b762f5fba0eed36e5ec78280/src/data/demo-ledger.ts#L349) creates a replacement without the access check used by [createDraft](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/blob/7bb94ce405374bd9b762f5fba0eed36e5ec78280/src/data/demo-ledger.ts#L310) and [convertPlan](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/blob/7bb94ce405374bd9b762f5fba0eed36e5ec78280/src/data/demo-ledger.ts#L294). The [UI route](https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite/blob/7bb94ce405374bd9b762f5fba0eed36e5ec78280/demo/app.js#L156) also opens correction without that gate. Fresh public reproduction:

1. Convert the new $1,234.56 plan while test access is enabled, creating `demo-expense-161`.
2. Send it for review with no receipt; it becomes pending and is excluded from agreed balances.
3. Simulate trial expiry. Ordinary Add expense/plan conversion show the paywall.
4. As its payer, choose **Create corrected draft**, enter a synthetic reason and submit.
5. The site creates private replacement `demo-expense-165`, withdraws the original, and still displays **Demo trial ended**.

README and current business/contract/specification/criteria/review/context summaries now disclose this exception rather than claiming a complete creation restriction. **No source fix or deployment was made.** PDF slide 4's broad “expiry blocks new expense drafts” wording is not true for this route and must be read with this qualification; the prepared PDF is intentionally unchanged. A future fix needs an access check in the mutation, a focused expiry/correction regression test, a rebuilt Direct Upload deployment and a public recheck. Passing 62 tests does not cover this reproduced path.

**F-03 — corrected stale publication wording:** README no longer says reviewed materials still require synchronization; it links the recorded completed transfer and this audit.

**F-04 — OPEN submission/access conflict:** FAQ public-source requirements remain incompatible with the owner's PRIVATE constraint. No visibility change or public mirror is authorized. The deck itself records that unresolved access issue on slide 10. No accepted submission or full competition readiness is asserted.

## 5. Fresh execution evidence in this final audit

Executed on the newly downloaded source copy with Node **v24.21.0**, not copied from the previous chat's results.

| Command | Actual result | Boundary |
| --- | --- | --- |
| `npm test` | **62 passed, 0 failed**, exit 0 | Domain/demo/transport/receipt-handler tests; does not cover F-02 or a live backend |
| `npm run demo:pages` | **PASS**, exit 0 | Generates the standalone page locally; does not deploy |
| `./tests/scripts/publish-private.test.ps1` | **6/6 PASS**, exit 0 | Simulated commands; no live terminal publication |
| `npm run check` | **BLOCKED**, exit 2 | TypeScript dependency unavailable |
| `npm run build` | **FAIL**, exit 1 | tsc unavailable; no React/Vite release build |
| `npm run test:integration` | **BLOCKED**, exit 2 | No dedicated Supabase configuration; no live checks ran |
| Automated browser E2E / native RLS / real multi-account | **NOT RUN** | Manual browser steps below do not establish these |

Fresh local Pages artifact SHA-256: `31776CBBF6329B4E3B9BFFEFB04AEDB16CA59AE5BF9418B94DD8C7B33756CE0D`, matching the previously recorded artifact. This does not independently establish the current Cloudflare deployment ID or a freshly downloaded production-HTML hash.

## 6. Fresh published-site verification

Tested [the public HTTPS demo](https://coparent-ledger-demo.pages.dev/) with new synthetic inputs, without registration, payment, real receipt upload or resetting existing guest records. These are manual single-browser-role checks, not independent-account tests.

| Check | Actual new data / observed result |
| --- | --- |
| Family | Parent A renamed to Audit Alex 7bb94 and restored to Alex. Added Audit child 7bb94, renamed to Audit child 7bb94 renamed, archived/restored it. The expense survived archive. |
| New expense | `Final audit expense 7bb94`, `demo-expense-150`, $87.65; payer Alex, reviewer Jordan, 40% = $35.06; new category Audit supplies 7bb94; built-in synthetic receipt. |
| Approval | Jordan demo role agreed to $35.06. No separate signed-in account is implied. |
| Pending report | $11.11 SAMPLE external transfer: confirmed $0, pending $11.11, remaining **$35.06**, available to report $23.95. |
| Confirmation during expired trial | As recipient Alex, confirmed $11.11: pending $0, confirmed $11.11, remaining **$23.95**; history records confirmation. |
| Category correction | Audit supplies 7bb94 → School; amounts unchanged and category-change history retained. |
| Child statistics | Purchases $87.65; agreed share $35.06; confirmed $11.11; remaining $23.95. Reimbursement was not counted as a new purchase. |
| Future plan | `Final audit plan 7bb94`, $1,234.56, 40%, assigned to the new child; initially Planned - no debt. After conversion/submission/replacement, approved statistics remain the same. |
| Normal paywall | Simulated expiry blocked Add expense and Create expense draft from the plan; modal showed $7.99/month per household, both parents, no card/billing. |
| Test unlock | Enable test access opened ordinary creation without card/payment; plan conversion then created a private draft. |
| Optional receipt | Sent plan-derived `demo-expense-161` for review with Receipt not attached. |
| Correction gate | **FAIL / F-02**: expired trial still created replacement `demo-expense-165`. |
| Persistence | Closed the public tab and opened the URL again in the same browser; new expense, sample receipt/history, renamed child/category, plan, and $23.95 balance persisted. Statistics after reopening remained $11.11 / $23.95 confirmed/remaining. |
| End state | Original parent names restored, new child active/restored, demo trial active. Original guest records preserved; new synthetic audit records deliberately remain. |

No new physical-phone, exhaustive responsive/accessibility, cross-device, separate browser-profile, full negative-input or real-account test was performed. One browser command timed out after the approval had already succeeded; state/history was inspected before continuing, and the approval was not blindly retried. Locator mismatches were corrected by inspecting the rendered form, not treated as product failures.

## 7. Snapshot update and publication boundaries

The [updated SYNC_MANIFEST](SYNC_MANIFEST.json) describes the reconciled source/documents in this audit revision, excluding its own bytes. It preserves the same UTF-8/BOM/LF normalization rules and records the original manifest checksum, immutable ZIP baseline and comparison counts. It includes this report and the preserved original snapshot. Product source, tests, existing PDF and image assets retain their checked bytes. Build output, real environment values, dependencies, Git metadata and browser-local records are excluded.

Only documentation and snapshot files are saved to GitHub. Cloudflare Pages is **Direct Upload**; a GitHub commit does not change the deployed site. **No Cloudflare upload/deployment was performed**, and F-02 remains on the public site. Source-view/hash checks and GitHub's changed-file comparison are used after publication to confirm that only the selected documentation paths changed; the final conversation reply links the actual observed publication commit. This report pins the fully ZIP-verified product revision above rather than inventing its own enclosing commit hash.

## Appendix: all 89 supplied manifest paths

Raw SHA-256 values below are the actual original-manifest and downloaded-GitHub values. The six documentation changes were content-reviewed; they are not normalized away.

| Path | Classification | Original raw SHA-256 | Checked GitHub raw SHA-256 |
| --- | --- | --- | --- |
| `.env.example` | Exact bytes | `15064840125078d0b287e40940a4dd9fa3986f3e9516cbc72bb1160e9b477323` | `15064840125078d0b287e40940a4dd9fa3986f3e9516cbc72bb1160e9b477323` |
| `.gitattributes` | Exact bytes | `89df0b7d781ace031c2a202bf90246b43d9445446ca1b7c1725d7356c5b8df80` | `89df0b7d781ace031c2a202bf90246b43d9445446ca1b7c1725d7356c5b8df80` |
| `.gitignore` | Exact bytes | `36347c893b0881300298fb59062e5ad810729525824c5df40465892131d486de` | `36347c893b0881300298fb59062e5ad810729525824c5df40465892131d486de` |
| `README.md` | Newer agreed remote documentation | `1d87fed3b8c85012022da9bf96a251dabfc0c84c06d6a43a61a4e3109573f46e` | `cc6cc7c3c40dbdf6c704123ff42b8f382323ab8ea5b6e38a90a8b2a67989a87d` |
| `demo/app.js` | Exact bytes | `e4e72ab69318ba8cdcf087f3ff86f566e743618801ad2166efc131013689aa6e` | `e4e72ab69318ba8cdcf087f3ff86f566e743618801ad2166efc131013689aa6e` |
| `demo/base-demo.css` | Exact bytes | `3a04bd9bf3633d876ce45dfe05612f87d210d328266ce1da9e5fd404d0c4dc60` | `3a04bd9bf3633d876ce45dfe05612f87d210d328266ce1da9e5fd404d0c4dc60` |
| `demo/demo.css` | Exact bytes | `f8d09449a54d5fc7670779d6f0dbfd20a7eddfb9564f34d64452f0667f46a9db` | `f8d09449a54d5fc7670779d6f0dbfd20a7eddfb9564f34d64452f0667f46a9db` |
| `demo/index.html` | Exact bytes | `5c743a66f9e485816f12cae026c07877f006bcf649f130197b7134d35af8cd21` | `5c743a66f9e485816f12cae026c07877f006bcf649f130197b7134d35af8cd21` |
| `docs/BUSINESS_MODEL.md` | Exact bytes | `76e3bad5660ab3ea679386962317993600e9ee390ea57b7b6356486db1a54775` | `76e3bad5660ab3ea679386962317993600e9ee390ea57b7b6356486db1a54775` |
| `docs/CHAT_HANDOFF.md` | Newer agreed remote documentation | `c804311979da97c274a5ecefa64b0d65caae7a3ff38f9de0c829b1ac7ab24898` | `2dff4fa7ad81b61cbb8272c99c4e0883a2c2ea5bb97449b772891b3cc7bb700a` |
| `docs/CONTRACTS.md` | Exact bytes | `f735d1533bfe215ebbc3dece57b109c8730e7c431a877669a05928cc5c52ca7b` | `f735d1533bfe215ebbc3dece57b109c8730e7c431a877669a05928cc5c52ca7b` |
| `docs/CRITERIA_MATRIX.md` | Newer agreed remote documentation | `1cce118b845c26c5d75f116ae65a3019e61235ece34de089abce36c8fd70a34c` | `773244101c3bd1f05cfe75726ee8c935b9ed165ec7e003fd79f691db2381f41d` |
| `docs/DEMO_SCRIPT.md` | Exact bytes | `78551e7970dd1e95db5adb61eb8cd2fa515afc4e4479b7672818eb29dbc27efb` | `78551e7970dd1e95db5adb61eb8cd2fa515afc4e4479b7672818eb29dbc27efb` |
| `docs/DEVELOPMENT_PROMPTS.txt` | Exact bytes | `f0ec00bf7e1bd2beea5cda2b23946dd5305a49b1b705de58053ba139e40260af` | `f0ec00bf7e1bd2beea5cda2b23946dd5305a49b1b705de58053ba139e40260af` |
| `docs/MARKET_AND_ECONOMICS.md` | Exact bytes | `ff4d1b42f854d19645cfb2a3fbd742403055eb8f34075c61500263c11aae7625` | `ff4d1b42f854d19645cfb2a3fbd742403055eb8f34075c61500263c11aae7625` |
| `docs/PILOT_PLAN.md` | Exact bytes | `8eb898c695e4b75efd42967e9a5addfb2a265c67051d5881eb0656c965e20d37` | `8eb898c695e4b75efd42967e9a5addfb2a265c67051d5881eb0656c965e20d37` |
| `docs/PRODUCT_SPEC.md` | Exact bytes | `af79f616d117f23d68c15f96441d7ef0f207a277028e7cf4885acad5ddc74f92` | `af79f616d117f23d68c15f96441d7ef0f207a277028e7cf4885acad5ddc74f92` |
| `docs/QA_REPORT.md` | Newer agreed remote documentation | `fcf0bed069ca72cd6a16aa706233fa794d16edd10acbdc3ff845bf6cf4ca64db` | `20c3b1d8bd566781a7ce16235b9dea479e723a40581695395274b847efc78521` |
| `docs/README_AND_SUBMISSION_PROMPT.md` | Exact bytes | `c28ff221c1ece85aa63bf851bfd70c8b2f555fdff9d5615c33818667fb6f2e92` | `c28ff221c1ece85aa63bf851bfd70c8b2f555fdff9d5615c33818667fb6f2e92` |
| `docs/REPOSITORY_REVIEW.md` | Newer agreed remote documentation | `fe9ebc9f7128db7d155520c146b5aae0f59a496f9736367269b7b419bb152123` | `c21d257c703110a4479c84f78a2e1444c68aef0be73cb311721ad1e2f5f30a09` |
| `docs/STATUS.md` | Newer agreed remote documentation | `cd1c06a415dafcac3addc8ebec114aff32abe9290bac7f662c981d4652855cc7` | `2c12c34290478b379e749ebc1d31aa2006a064f20d6161adf0b37931b1adc103` |
| `docs/SUBMISSION_BASELINE.md` | Exact bytes | `06660415bb88957d6dcbdf4167048824f9438830933ad75329c130c5124da515` | `06660415bb88957d6dcbdf4167048824f9438830933ad75329c130c5124da515` |
| `docs/presentation/CoParent_Ledger_Jury_Deck_v2.pdf` | Exact bytes | `89be515c04d311d22686b71ae1d1cc17faa558d8fe7f49bf99af26602d4e9a21` | `89be515c04d311d22686b71ae1d1cc17faa558d8fe7f49bf99af26602d4e9a21` |
| `docs/presentation/PITCH_SCRIPT_RU.md` | Exact bytes | `a8b48cdd15e205a6856716908ae20ab70a3df461d923a3483f6d4595ce6f8542` | `a8b48cdd15e205a6856716908ae20ab70a3df461d923a3483f6d4595ce6f8542` |
| `docs/presentation/assets/paywall.png` | Exact bytes | `2b690cfc848b58673aaf9d3499874a691c7087c60dfed5fcf247f7558ac7f97c` | `2b690cfc848b58673aaf9d3499874a691c7087c60dfed5fcf247f7558ac7f97c` |
| `docs/presentation/assets/receipt.png` | Exact bytes | `1edd33ea69c7e87dbd66e9439796000486dd58570f16f20da4c2bf926b6ef04d` | `1edd33ea69c7e87dbd66e9439796000486dd58570f16f20da4c2bf926b6ef04d` |
| `docs/presentation/assets/reimbursement.png` | Exact bytes | `207d9732c7fe47e1747311c7cc29a338b6d46d70a14feabea844463a25bf717b` | `207d9732c7fe47e1747311c7cc29a338b6d46d70a14feabea844463a25bf717b` |
| `docs/presentation/build_submission_v2.py` | Exact bytes | `f9dc50469b9d10524eaf47e1c83b24cbda51abe8da39c246ae936ae136fc251d` | `f9dc50469b9d10524eaf47e1c83b24cbda51abe8da39c246ae936ae136fc251d` |
| `docs/presentation/layout_check_v2.json` | Exact bytes | `d5d19a12a6089dc851c8c8b12cecea1cec1f16f727e1a40156b0616115beb822` | `d5d19a12a6089dc851c8c8b12cecea1cec1f16f727e1a40156b0616115beb822` |
| `index.html` | Exact bytes | `be860878e70d9b12c4f385e9960e29f46f3f1132684c2b81e3afe4083af8c27d` | `be860878e70d9b12c4f385e9960e29f46f3f1132684c2b81e3afe4083af8c27d` |
| `package.json` | Exact bytes | `210038c107b02ca6b59408b48b271cd5192dd9b85556c099a6461dc23a3d56b6` | `210038c107b02ca6b59408b48b271cd5192dd9b85556c099a6461dc23a3d56b6` |
| `playwright.config.ts` | Exact bytes | `3854667693d608c532e5d3acc9edb8f534bef8380cf9e747d432faca8da8a690` | `3854667693d608c532e5d3acc9edb8f534bef8380cf9e747d432faca8da8a690` |
| `public/samples/receipt.svg` | Exact bytes | `abac16653afd38b40489609bb96c84f2189702c745674508df169a5d5fed4781` | `abac16653afd38b40489609bb96c84f2189702c745674508df169a5d5fed4781` |
| `scripts/build-demo.mjs` | Exact bytes | `ba885c2fa9fc0a3c4ab207bafe50f13de212ce7d92e343f2ccc665b181910e12` | `ba885c2fa9fc0a3c4ab207bafe50f13de212ce7d92e343f2ccc665b181910e12` |
| `scripts/build-pages.mjs` | Exact bytes | `ac122ebed3c6a47c3ae12547a94d7410d3db1b59214a903c99bb5193871b8386` | `ac122ebed3c6a47c3ae12547a94d7410d3db1b59214a903c99bb5193871b8386` |
| `scripts/build-standalone.mjs` | Exact bytes | `0782e33fb900bd8984e3eb55f18c9db20e736789e48e5932903c54df03a9b816` | `0782e33fb900bd8984e3eb55f18c9db20e736789e48e5932903c54df03a9b816` |
| `scripts/check-source.mjs` | Exact bytes | `0fdd8bc72a5cb1f6978d3deea5c759cd5ea7cc54939a0967b164690f48ebdf81` | `0fdd8bc72a5cb1f6978d3deea5c759cd5ea7cc54939a0967b164690f48ebdf81` |
| `scripts/publish-private.ps1` | Exact bytes | `91aa8f0b9a3e4d5a94cb6be5859bb1bfa8d2b214bd027aabb4dc53f64080b919` | `91aa8f0b9a3e4d5a94cb6be5859bb1bfa8d2b214bd027aabb4dc53f64080b919` |
| `scripts/serve-demo.mjs` | Exact bytes | `6744969d7028602255ee484bccb84a11106e6171e324f529a4d901fe21dc44e6` | `6744969d7028602255ee484bccb84a11106e6171e324f529a4d901fe21dc44e6` |
| `src/App.tsx` | Exact bytes | `87052f3711a9cce9798c419494eb2b08c049e9f42b6d3c56a45deeb0ab9c285a` | `87052f3711a9cce9798c419494eb2b08c049e9f42b6d3c56a45deeb0ab9c285a` |
| `src/data/demo-access.ts` | Exact bytes | `3f9321dc2b3aea4c190be66282744046312f9e9654a2be1ae2ba504d433d7512` | `3f9321dc2b3aea4c190be66282744046312f9e9654a2be1ae2ba504d433d7512` |
| `src/data/demo-ledger.ts` | Exact bytes | `0335fa94205a7fbd873ec703c6a187759617ca8aab83c8f7cc7fd6ec624a2c70` | `0335fa94205a7fbd873ec703c6a187759617ca8aab83c8f7cc7fd6ec624a2c70` |
| `src/data/ledger-port.ts` | Exact bytes | `bed2ef2154f9c18588f737effd9fd7489497eb3b77b7eeecdfbd661c674ca02b` | `bed2ef2154f9c18588f737effd9fd7489497eb3b77b7eeecdfbd661c674ca02b` |
| `src/data/persistent-demo.ts` | Exact bytes | `18ae26503dfe73a2fa94b83bcc261f7fc2a1fa9fe66acd7be28a2c7c3fc1c108` | `18ae26503dfe73a2fa94b83bcc261f7fc2a1fa9fe66acd7be28a2c7c3fc1c108` |
| `src/data/supabase-ledger.ts` | Exact bytes | `755335c0720c3625f75ed7cbd624a0e154e9663acc2e73e35e8e0609c1533c4b` | `755335c0720c3625f75ed7cbd624a0e154e9663acc2e73e35e8e0609c1533c4b` |
| `src/domain/csv.ts` | Exact bytes | `b003b61ffeb31083cba3d0579ecc80c2ce8263e5b610d4ede90d920cd39519df` | `b003b61ffeb31083cba3d0579ecc80c2ce8263e5b610d4ede90d920cd39519df` |
| `src/domain/money.ts` | Exact bytes | `e2cbf6cd4401632094f109f5410bedaa5001c55bf3634146ebdb4e9d2a4bb1cd` | `e2cbf6cd4401632094f109f5410bedaa5001c55bf3634146ebdb4e9d2a4bb1cd` |
| `src/domain/settlement.ts` | Exact bytes | `a88c5b33aeab1e4d84358f298efc47ed5f89c69cee6a70b9f9eb54ed51cf9c68` | `a88c5b33aeab1e4d84358f298efc47ed5f89c69cee6a70b9f9eb54ed51cf9c68` |
| `src/domain/transitions.ts` | Exact bytes | `34219dd60cf83e010e2d3ca73bfe04e2324fd58cf81f6e3a0aa63a73e577d345` | `34219dd60cf83e010e2d3ca73bfe04e2324fd58cf81f6e3a0aa63a73e577d345` |
| `src/domain/types.ts` | Exact bytes | `12104ab3497dc34929f0ad1645c15686dbfa2fdff578c273b1f094c2e02b3dca` | `12104ab3497dc34929f0ad1645c15686dbfa2fdff578c273b1f094c2e02b3dca` |
| `src/domain/validation.ts` | Exact bytes | `761018ac70a2b2d557a97c70292080c88b5c42620f048b10e937127d8ee293d2` | `761018ac70a2b2d557a97c70292080c88b5c42620f048b10e937127d8ee293d2` |
| `src/features/auth/AuthPages.tsx` | Exact bytes | `fa8f0f372197c6d05af98724e84bbcc56e43c2a5d3107d2ea0df396c8a030097` | `fa8f0f372197c6d05af98724e84bbcc56e43c2a5d3107d2ea0df396c8a030097` |
| `src/features/expenses/ExpenseDetailView.tsx` | Exact bytes | `6399502d0b9506e6c7abe239369954ac3d9cad5e7ba48c3936e2c1734068bd4a` | `6399502d0b9506e6c7abe239369954ac3d9cad5e7ba48c3936e2c1734068bd4a` |
| `src/features/expenses/ExpenseForm.tsx` | Exact bytes | `aaac7b1674da920a488aa467dcd77e1c6edf2696048d1b3a80554d09c563822b` | `aaac7b1674da920a488aa467dcd77e1c6edf2696048d1b3a80554d09c563822b` |
| `src/features/expenses/LedgerView.tsx` | Exact bytes | `8c831cd653b201fe1cb629198c5aa163813f8ea469cdeebe4ea99014b1a36975` | `8c831cd653b201fe1cb629198c5aa163813f8ea469cdeebe4ea99014b1a36975` |
| `src/features/expenses/commands.ts` | Exact bytes | `10c0137d2a28ac93e996694c427500562d512a990430bad6a670de59cc55caad` | `10c0137d2a28ac93e996694c427500562d512a990430bad6a670de59cc55caad` |
| `src/features/household/HouseholdPanel.tsx` | Exact bytes | `27d2af0aa95303256c065df644220746a44bbdd5e4723549cb9581341acdb647` | `27d2af0aa95303256c065df644220746a44bbdd5e4723549cb9581341acdb647` |
| `src/features/reimbursements/RecordPaymentDialog.tsx` | Exact bytes | `cc188ce8a40cc906d40b69361f7453ddf3b6053235cb395eab558c811b46974a` | `cc188ce8a40cc906d40b69361f7453ddf3b6053235cb395eab558c811b46974a` |
| `src/features/ui.tsx` | Exact bytes | `1fe93c74e8e5943540c2596fd6118638ff669b65e05cc9b3aebfbacc96e26e3d` | `1fe93c74e8e5943540c2596fd6118638ff669b65e05cc9b3aebfbacc96e26e3d` |
| `src/main.tsx` | Exact bytes | `1a0cda3a9718b94a38fd7d9a2e5ccd7c8ccaae1cd712e87d27181505cf972f7e` | `1a0cda3a9718b94a38fd7d9a2e5ccd7c8ccaae1cd712e87d27181505cf972f7e` |
| `src/styles.css` | Exact bytes | `aa11771336f97709cbc8b268b0f4a6fdae1fb0bff88c80cf45242ee8ea4d6aa7` | `aa11771336f97709cbc8b268b0f4a6fdae1fb0bff88c80cf45242ee8ea4d6aa7` |
| `src/styles.d.ts` | Exact bytes | `da5bf71d48cf909584a01c80b445f730507068f5b34c920f352e2bfcf0315e4c` | `da5bf71d48cf909584a01c80b445f730507068f5b34c920f352e2bfcf0315e4c` |
| `src/vite-env.d.ts` | Exact bytes | `65996936fbb042915f7b74a200fcdde7e410f32a669b1ab9597cfaa4b0faddb5` | `65996936fbb042915f7b74a200fcdde7e410f32a669b1ab9597cfaa4b0faddb5` |
| `supabase/README.md` | Exact bytes | `fe26a79d6acf3f173a63f27b92a8edc88d9559602eaef6582ae8e679a71d67f8` | `fe26a79d6acf3f173a63f27b92a8edc88d9559602eaef6582ae8e679a71d67f8` |
| `supabase/config.toml` | Exact bytes | `bb3cf8888900606eca0a543eb029d0717931677ed06953beef9f775abc1eec90` | `bb3cf8888900606eca0a543eb029d0717931677ed06953beef9f775abc1eec90` |
| `supabase/functions/_shared/errors.ts` | Exact bytes | `2de358d6e159e75675e6f927da8b7c5f220b51f9e7159b86763d5a79261b354e` | `2de358d6e159e75675e6f927da8b7c5f220b51f9e7159b86763d5a79261b354e` |
| `supabase/functions/_shared/http.ts` | Exact bytes | `a9b4d8458d54cbf3efce0013889aea234d239ed33beb777f9cc8e5b0e00103c4` | `a9b4d8458d54cbf3efce0013889aea234d239ed33beb777f9cc8e5b0e00103c4` |
| `supabase/functions/_shared/receipt-validation.ts` | Exact bytes | `9017a358534d01771d5f25c32d99a1de8ab4f3c3751233f7f6ae8b15a8224de6` | `9017a358534d01771d5f25c32d99a1de8ab4f3c3751233f7f6ae8b15a8224de6` |
| `supabase/functions/receipt-access/index.ts` | Exact bytes | `4e9abfc47abe9a7e809fe965660c888f689141d3d8bcb449322d4c2cdfc3fdf2` | `4e9abfc47abe9a7e809fe965660c888f689141d3d8bcb449322d4c2cdfc3fdf2` |
| `supabase/functions/receipt-upload/index.ts` | Exact bytes | `bffbeb835be3bbab3bbbf5c21223ad660eed9cb0c77dafa7c52eff83b1575410` | `bffbeb835be3bbab3bbbf5c21223ad660eed9cb0c77dafa7c52eff83b1575410` |
| `supabase/migrations/202611140001_ledger.sql` | Exact bytes | `c7c5af9c4cd6029bb51811187375a2691d0d02855d5b4d774c3541a71d4ef2cb` | `c7c5af9c4cd6029bb51811187375a2691d0d02855d5b4d774c3541a71d4ef2cb` |
| `tests/e2e/demo.spec.ts` | Exact bytes | `2c283b6e5e29f830e5f9a66e710eafa1dca6bd79309cbdc882d5c972a5ffb975` | `2c283b6e5e29f830e5f9a66e710eafa1dca6bd79309cbdc882d5c972a5ffb975` |
| `tests/integration/invitations.sql` | Exact bytes | `d02caf4c69e443bd80005e55f0174a82568e421c3eab016f5917100455508a51` | `d02caf4c69e443bd80005e55f0174a82568e421c3eab016f5917100455508a51` |
| `tests/integration/ledger.sql` | Exact bytes | `e7fa1d4940eea82ddb9a4171aee099b0dd9654667820e0c4aadf8b635459c044` | `e7fa1d4940eea82ddb9a4171aee099b0dd9654667820e0c4aadf8b635459c044` |
| `tests/integration/local-bootstrap.sql` | Exact bytes | `25d665b7bbfdfc58855b6824034c14f2a68c8a4b9f97f75895dcc9eb29a2268b` | `25d665b7bbfdfc58855b6824034c14f2a68c8a4b9f97f75895dcc9eb29a2268b` |
| `tests/integration/receipt-storage.sql` | Exact bytes | `b96d3accd5d493eb94f849150a6b2500d687473750f3367a5696a75771b06fd7` | `b96d3accd5d493eb94f849150a6b2500d687473750f3367a5696a75771b06fd7` |
| `tests/integration/receipt-validation.test.ts` | Exact bytes | `256f2d54573dfb2e6dae62af5b9d20afb1629a4530482f8954d73865a06161f8` | `256f2d54573dfb2e6dae62af5b9d20afb1629a4530482f8954d73865a06161f8` |
| `tests/integration/run-sql-single.mjs` | Exact bytes | `049010520f53b70d6db94952ec57b11ef6512df5fa6e148a4d70bf81fc72a1bc` | `049010520f53b70d6db94952ec57b11ef6512df5fa6e148a4d70bf81fc72a1bc` |
| `tests/integration/supabase.integration.mjs` | Exact bytes | `16b80a0e06c617897b95d15c0a40b78306e3bb34d04955f63fa2cd3788fee188` | `16b80a0e06c617897b95d15c0a40b78306e3bb34d04955f63fa2cd3788fee188` |
| `tests/scripts/publish-private.test.ps1` | Exact bytes | `337ad77a8bb15a540648b18a140a1437733f66afd66fea9e8207d3ee91ad010c` | `337ad77a8bb15a540648b18a140a1437733f66afd66fea9e8207d3ee91ad010c` |
| `tests/transport/supabase-ledger.test.ts` | Exact bytes | `ced7e12c700760d50cb5835e960d446e2cff0834860a6ec218e7fea47e0417d1` | `ced7e12c700760d50cb5835e960d446e2cff0834860a6ec218e7fea47e0417d1` |
| `tests/unit/demo-access.test.ts` | Exact bytes | `7e97e57f1390630248f365679872cb7a006b164ae2c9be60814ea7db6fcad20f` | `7e97e57f1390630248f365679872cb7a006b164ae2c9be60814ea7db6fcad20f` |
| `tests/unit/demo-ledger.test.ts` | Exact bytes | `5a42946226a9268af7aceee8eacd56556d352e1dd0866c8f9e7fdbd66c5a9540` | `5a42946226a9268af7aceee8eacd56556d352e1dd0866c8f9e7fdbd66c5a9540` |
| `tests/unit/family-workspace.test.ts` | Exact bytes | `709afbbf20201c0fcd6560031e2fcd04f0a0d27336a5e8cae97214fb02cb60b2` | `709afbbf20201c0fcd6560031e2fcd04f0a0d27336a5e8cae97214fb02cb60b2` |
| `tests/unit/frontend-recovery.test.ts` | Exact bytes | `e8911fe040882e16031be0d93a3c0cdfa7ee557243b2223716e1208a5c687ac6` | `e8911fe040882e16031be0d93a3c0cdfa7ee557243b2223716e1208a5c687ac6` |
| `tests/unit/persistent-demo.test.ts` | Exact bytes | `7a43ff08eae849d59e46d0fd5f2086d8fa178d64a55884cda8f1457dd31db188` | `7a43ff08eae849d59e46d0fd5f2086d8fa178d64a55884cda8f1457dd31db188` |
| `tests/unit/pure-domain.test.ts` | Exact bytes | `22309f7674a62d5ab39ae41de02e4818e25aa36c85d1db99e431532e170670f1` | `22309f7674a62d5ab39ae41de02e4818e25aa36c85d1db99e431532e170670f1` |
| `tsconfig.json` | Exact bytes | `e51eb48b683942fff377bb0127b0ad70cab358da55a99ec854596e3638549086` | `e51eb48b683942fff377bb0127b0ad70cab358da55a99ec854596e3638549086` |
| `vite.config.ts` | Exact bytes | `10a5c63cc9685dfca9f6dd7fc835ea09ea4080579fb4bab0dbc708e59bf66993` | `10a5c63cc9685dfca9f6dd7fc835ea09ea4080579fb4bab0dbc708e59bf66993` |
