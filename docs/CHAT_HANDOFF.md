# CoParent Ledger — context for the browser-enabled chat

## Receiving-chat update - 15 November 2026

This file preserves the originating chat's full handoff below. Its statements that browser access/synchronization were blocked describe that earlier conversation, not the current GitHub state.

Before this handoff follow-up, the receiving chat saved and verified the reviewed 21-file delta under **hikkki013** in the **Private** repository, ending at `4d3e5902bfc0cf89a63e5bca9c074bb9917d23f6`. Main was freshly reloaded at that same commit for this follow-up; the owner menu and Private label were checked again. The complete prior download comparison verified 88 files and all 21 uploaded paths; the final STATUS/QA follow-up was also read back through GitHub's source view.

The current originating local folder contains 89 intended files: the only addition since the preceding local comparison is this handoff. No application, backend, test or presentation bytes changed. README, STATUS, QA_REPORT, REPOSITORY_REVIEW and CRITERIA_MATRIX on GitHub already contain newer synchronization evidence than the originating local copies, so the remote versions are the base for this update. Do not overwrite them with the older local snapshots. The original local Git history and remote configuration remain separate from browser-created commits.

This documentation follow-up adds this context file, links it from README/review, and records the comparison in STATUS/QA. The earlier 62 Node tests, six helper simulations and Pages build are previous checks, not newly executed for this follow-up. No product change or redeployment is needed. The existing English 10-slide PDF is retained without regeneration or replacement. The final upload/read-back result is in [STATUS.md](STATUS.md).

---

Prepared 15 November 2026 from the originating conversation. Team: **Ctrl Alt Elite**. This is a handoff of project decisions and known evidence, not a new verification result. Another chat may already have made later changes: read the current local files and remote history before acting; do not overwrite newer work using this snapshot.

## Immediate task

The user wants the repository checked for missing updates and contradictions and the reviewed local work saved in the correct GitHub repository. The receiving chat reportedly has working control of the side-panel browser. The originating chat could edit local files but could not access that browser or synchronize GitHub.

- Local repository: `C:\Users\Gigabyte\Documents\Codex\2026-11-14\new-chat-4\coparent-ledger`.
- User-supplied current GitHub URL: https://github.com/hikkki013/coparent-ledger-ctrl-alt-elite . Verify it under the user's browser session and confirm **Private**.
- Local Git remote still names the old `hikkki013/coparent-ledger`; do not infer successful rename or synchronization from it.
- Public guest site: https://coparent-ledger-demo.pages.dev/ . Cloudflare Pages project uses Direct Upload, not Git integration.

Read these local files first: [README](../README.md), [STATUS](STATUS.md), [repository review](REPOSITORY_REVIEW.md), [QA](QA_REPORT.md), [criteria matrix](CRITERIA_MATRIX.md), [market model](MARKET_AND_ECONOMICS.md). STATUS contains a current summary followed by historical entries. The baseline is a dated earlier audit, not the latest implementation status.

## Persistent user constraints

1. Keep the working GitHub repository **PRIVATE**. Do not create a public copy or change visibility. Use only **hikkki013**; do not use **karim312k1**. The originating chat's GitHub connector identified Karim and was not used for mutations.
2. Do not upload .env, credentials, tokens, real receipts, personal data, node_modules or .git. The empty .env.example template is intentional.
3. Do not collect cards, charge money, enable automatic debits or send invitations/messages to real people. Existing trial/test-access controls must be labeled no-payment demonstrations.
4. Preserve user changes, financial rules, the public URL and saved guest data. No force-push, history reset or blind snapshot upload over remote work.
5. Do not invent tests, users, traction, survey answers or market evidence. Distinguish local, deployed, checked and unverified behavior.
6. The user rejected an artificial ten-child limit. Family management uses child names and archive/restore. Do not add a child-count cap or misleading cap message.

## Actual product scope

The deployed version is a standalone guest web interface. Alex and Jordan are renameable demo roles in one browser, not proven independent accounts or devices. The separate React/Supabase implementation is not the deployed guest site and lacks verified feature parity.

The working synthetic flow is: create expense with manually entered amount/share, attach a labeled sample receipt, submit, approve or object, report a partial external reimbursement, confirm receipt as its recipient, then inspect remaining amount and history. The app records money movement outside the service; it neither transfers nor verifies bank funds.

Financial invariants:

- Integer USD cents and exact half-up share rounding.
- Only approved expenses contribute to agreed amounts; opposite directions are not silently netted.
- A reported but unconfirmed reimbursement does not reduce the amount remaining. Recipient confirmation reduces it once.
- Reimbursements are not extra purchases in spending statistics.
- Future plans are estimates, not debts or approved agreements. One-time conversion produces a draft; normal review still follows.
- Approved financial details are frozen. Standalone category correction is audited and does not change money or payment state.

Standalone features: children and parent names; child archive/restore preserving records; custom categories from Add expense; audited category correction; per-child approved purchases by payer/category; shares/confirmed/remaining; future plans; CSV; paywall; saved guest progress. Plan approval/edit/delete, product PDF expense export, cloud sync and real billing are not implemented.

## Persistence and subscription demonstration

Guest ledger data uses localStorage with Web Locks. It survives reload/tab closure in the same browser/device. Clearing site data, ending a private browsing session, or confirmed Start clean/Load examples can remove or replace it. Another browser/device does not synchronize. The React demo still uses sessionStorage.

The proposed price is **$7.99/month per household**, both parents included. The fourteen-day demo trial has an obvious Simulate end of trial action. Expiry gates new expense drafts and plan conversion. Existing records, receipts/history, CSV and confirmation of existing reimbursements remain available. Enable test access unlocks creation without payment. Reset demo access is separate from resetting ledger records. This is not a paid subscription or server entitlement.

## Known evidence and checks

Prior public QA, 15 Nov: a new $64.20 expense at 50% produced $32.10 agreed. Reporting $12.10 left $32.10 remaining; recipient confirmation changed it to $20.00 with history. Additional preview/public checks cover family, categories, statistics, plans, paywall and persistence within the boundaries in QA.

Latest local review in the originating chat:

- Node tests: **62 passed, 0 failed**.
- Pages build: **passed**. Single-file artifact SHA-256 `31776CBBF6329B4E3B9BFFEFB04AEDB16CA59AE5BF9418B94DD8C7B33756CE0D`, matching the recorded deployment `6d00a0a4`. This is not a fresh fetch of the live site.
- React semantic check blocked by missing TypeScript; React/Vite build failed because tsc was unavailable. Integration reported BLOCKED for missing dedicated Supabase test configuration and ran no live tests.
- Viewport smoke checks are historical; no physical phone, real account synchronization, native RLS/concurrency or comprehensive security audit is claimed.
- Final documentation check before this handoff found 82 valid relative links and 8 passing JS/MJS syntax checks. These are local checks, not external-link or full behavioral coverage.
- Six offline private-publication guard/race simulations passed. The helper refuses wrong identity/public destination/dirty tree/divergent history and uses normal Git push. It has not published live.
- Full working-tree whitespace check still reports pre-existing trailing spaces on demo/app.js lines 16/34; they were preserved to keep the deployed artifact unchanged during the documentation pass.

Do not report these as checks newly executed by the receiving chat. Run appropriate checks after further changes.

## Prepared presentation and economics

The English **10-slide PDF already exists**: [CoParent_Ledger_Jury_Deck_v2.pdf](presentation/CoParent_Ledger_Jury_Deck_v2.pdf). It was copied into the repository locally and linked from README. Do not recreate it because an older remote STATUS says it is missing.

The user first considered Russian slides, then explicitly clarified that the final deck should be **English according to the criteria**. Version 2 removes all survey/interview mentions and focuses on the problem, working flow, paid value, reasons to renew, market, economics and alternatives. [Russian oral notes](presentation/PITCH_SCRIPT_RU.md) contain 625 spoken words for an approximate five-minute pitch. Oral presentation may be Russian; the submitted PDF must be English.

UI screenshots are actual local renders of the unchanged published artifact, with provenance labeled in the deck, not fresh live HTTPS screenshots. The screenshot example is separate from the public QA journey: $48 agreed, $20 confirmed, $28 remaining including a separate $10 pending report.

The owner reported no survey responses at deck preparation; no responses or traction were fabricated. All market/CAC/retention/LTV figures are explicitly conditional hypotheses/calculations in MARKET_AND_ECONOMICS.md. Base blended CAC $25 and contribution LTV $52.84 are not measured project metrics. Conservative and broad paid-acquisition scenarios fail. $100m ARR at this price requires 1,042,971 active paid households, above the modeled initial SAM. Do not present commercial viability as proven.

## Criteria and unresolved submission issue

All 150 FAQ answers were re-read from the local organizer PDF. Scoring: Product & engineering 40%, Value & retention 20%, Problem & user 15%, Business potential 15%, Originality 10%.

Required: B2C US adults aged 25–45, one main Money track, browser-based input-dependent end-to-end product without required jury registration/payment, English PDF up to ten slides total, and a public repository with full deployed source. Labeled guest data, localStorage and a working test paywall are permitted. Real charges, complete backend, AI, CI/CD and automated tests are not mandatory. Stripe test checkout and genuine US validation are optional pluses, not implemented facts.

**Unresolved conflict:** Q23/Q46 require public source, but the owner explicitly requires the working repository PRIVATE and has not authorized a public copy. Record the blocker; do not change access to satisfy it. Prepared artifacts are not proof that the captain submitted them or that organizers accepted the submission. The FAQ gives 15 November 12:00 without a timezone in the inspected answers; use official event instructions for scheduling. Keep the URL live through the final.

## Finish in the receiving chat

1. Confirm current owner/repository/Private through the working browser; compare current remote content and history against local files. Another chat may have made newer changes.
2. Integrate reviewed updates, including missing documentation, PDF/assets, and any source/tests that the comparison proves are missing. Do not restrict the comparison to README if remote source is older; also do not overwrite newer remote changes blindly.
3. Keep local source history and remote browser commits intact; local/remote history parity was not established. The helper refuses divergent histories rather than resolving them automatically.
4. Verify uploaded files, relative README links and Private visibility on GitHub. Update STATUS/QA with the receiving chat's actual observations, replacing the current browser-access blocker only once verified.
5. If only documentation changed, no Pages redeployment is needed. Product changes require a tested build, deployment to the existing Pages project and a public-site recheck.
6. Report local changes, remote commits and website deployment separately, with remaining limits. Never claim an unobserved upload or test.
