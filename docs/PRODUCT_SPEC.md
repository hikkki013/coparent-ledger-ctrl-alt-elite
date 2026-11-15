# CoParent Ledger product specification

> **Final-audit qualification, 15 November 2026:** [FINAL_SYNC_REPORT.md](FINAL_SYNC_REPORT.md) records a fresh public-site test and the exact ZIP reconciliation. Normal new-expense creation and plan conversion are gated after trial expiry, but **Create corrected draft** still creates a replacement draft; that published functional gap is open. Receipts are optional. The guest roles and storage remain browser-local; no charge, verified shared account or deployment is claimed by this documentation revision. Public-source submission access remains unresolved while the working repository stays PRIVATE.

**Scope update, 15 November 2026:** The original real-account/backend requirements below are not a deployment claim. The published guest standalone uses two roles in one browser, localStorage with Web Locks, custom family/category data, child statistics, future plans and a working test paywall. Those extensions are not all implemented in SupabaseLedger/React. [README](../README.md), [CONTRACTS.md](CONTRACTS.md) and [QA_REPORT.md](QA_REPORT.md) define the current executable/verified scope. Real two-account operation remains unverified. No real payments or cloud backup are claimed.

Version: 2026-11-14. Source: [DEVELOPMENT_PROMPTS.txt](DEVELOPMENT_PROMPTS.txt), especially PROMPT 00. This is the consolidated product requirement, not a claim that every feature has passed verification. [CONTRACTS.md](CONTRACTS.md) defines the executable interfaces; [STATUS.md](STATUS.md) and the QA report record implementation evidence.

## Intent and audience

A browser-based shared-expense ledger for two US parents, primarily ages 25-45, who have separated and are both willing to use it. A parent records a purchase, proposes the other parent's share, receives an explicit decision, and records external reimbursements. The receiving parent confirms whether money arrived. Both adults see the same submitted records and activity history.

The product does not establish child support, decide legal obligations, resolve disagreements, move money, or verify bank transactions. A disputed proposal is not an agreed debt. One adult's subscription or ownership of the household never supplies the other adult's consent.

## Criteria versus product choices

The supplied development brief attributes these criteria to the user's original competition slide: US ages 25-45, B2C, web only, a working product within 24 hours, and a substantial problem with willingness to pay. The team's additional target is a 5-7 hour MVP. The subsequently supplied organizer FAQ confirms scoring weights, a public no-login product URL, public submission-source access, a working paywall and an English PDF deck of at most 10 slides. See [CRITERIA_MATRIX.md](CRITERIA_MATRIX.md) for the updated requirements and gaps. The user explicitly requires the working repository to remain private for now. AI and real payment processing are not required.

The name, narrow expense workflow, USD-only scope, technical architecture, and $7.99 pricing are project decisions. Demand and willingness to pay are hypotheses. No customers, revenue, adoption, legal validity, or reduction in conflict have been demonstrated by this document.

## Required working slice

1. Authenticated Alex creates a private draft, optionally attaching a receipt.
2. Alex explicitly sends it to the joined second adult, Jordan.
3. Jordan approves the proposed share or raises a concern with a reason.
4. For an approved share, Jordan records a transfer made outside this service.
5. Alex confirms or rejects receipt of that specific transfer.
6. Both adults see the resulting amount and activity history after refresh.

The user's original service acceptance condition must ultimately run through two real authenticated sessions. A local role-switched demo does not prove authentication, RLS, storage isolation, concurrency, or persistence across accounts. Separately, the competition FAQ permits a publicly deployed guest flow using real input-dependent logic and local storage; it does not require a live backend for that guest flow.

## MVP boundaries

| Area | Requirement |
| --- | --- |
| Household | One household per user; at most two adult members; no removal of the second member in this MVP |
| Ownership | Owner can create an invitation; financial permissions remain determined by each expense's payer/reviewer |
| Before joining | Owner may keep private drafts; submission requires the second member |
| Children | Child aliases; no child accounts, birth dates, SSNs, school addresses, diagnoses, or child documents. Standalone supports adding, naming, archiving/restoring children; the original backend has a narrower schema. Do not infer feature parity. |
| Expenses | One actual payer and one total; only that payer creates the expense; no jointly paid purchase |
| Categories | Backend defaults: SCHOOL, MEDICAL, ACTIVITIES, PURCHASES, OTHER. Standalone additionally supports custom categories and audited category corrections. |
| Currency | USD only; total from 1 through 100000000 integer cents |
| Split | Other parent's share from 0 through 100%, at most two decimal places; stored as 0-10000 basis points |
| Receipt | Optional, one JPG/PNG/WebP image up to 5 MiB; no PDF or OCR |
| Export | Basic CSV of records visible to the requesting adult; no private URLs or tokens |
| Payments | External payment records only; no processing, bank connections, automatic debits, or payment-provider integration claims |

Excluded: custody calendars, chat, AI, reminders, SMS/push, recurring expenses, multiple currencies, automatic offsets, merchant refunds, interest, legal reports, and correction of already approved expenses or confirmed reimbursements.

## Exact money rules

`reviewer_share_bps` always means the share of the adult who did not pay the purchase.

```text
owed_cents = floor((total_cents * reviewer_share_bps + 5000) / 10000)
payer_share_cents = total_cents - owed_cents
confirmed_cents = sum(CONFIRMED reimbursements)
pending_cents = sum(PENDING reimbursements)
remaining_cents = owed_cents - confirmed_cents
available_to_report_cents = remaining_cents - pending_cents
```

Parse decimal inputs from strings, not `parseFloat(value) * 100`. Use exact intermediate integer arithmetic, with checked safe integers at JSON boundaries. Rounding is half up for the reviewer's share; the payer receives the remainder. Preserve `payer_share_cents + owed_cents = total_cents` and `0 <= confirmed_cents + pending_cents <= owed_cents`; never hide invalid state with `max(0, balance)`.

Only APPROVED expenses contribute to agreed shares and agreed remaining. DRAFT, PENDING, DISPUTED, and WITHDRAWN do not. Pending transfer reports remain part of the outstanding balance and are shown separately as awaiting receipt confirmation; do not add them to remaining a second time. Keep A-to-B and B-to-A amounts separate with no automatic netting. A zero share has settlement status NOT_REQUIRED and accepts no payment report. Settlement is derived independently of approval: NOT_REQUIRED, UNPAID, PARTIAL, or SETTLED.

## Expense states and corrections

| From | Action / actor | Result |
| --- | --- | --- |
| DRAFT | Payer edits | DRAFT; only author can see it |
| DRAFT | Payer sends, second adult exists | PENDING; content and receipt freeze |
| PENDING | Reviewer approves | APPROVED |
| PENDING | Reviewer raises concern with nonblank reason | DISPUTED |
| DISPUTED | Reviewer approves the unchanged share | APPROVED |
| DRAFT / PENDING / DISPUTED | Author withdraws; reason required if submitted | WITHDRAWN, terminal |
| PENDING / DISPUTED | Author creates corrected draft with reason | Atomically withdraw old record and create a new private DRAFT linked through replacesExpenseId |

The original backend freezes amount, share, description, merchant, category, date, payer, child alias snapshot and receipt after first submission. The standalone permits an audited category-only reclassification without changing money, approval or reimbursement state; this is not a financial edit or a backend-supported exception. A corrected financial draft has a new ID, no receipt and no inherited approval. The original snapshot and receipt remain unchanged. Resubmission and a fresh decision are required. `lockVersion` protects concurrent commands; it is not a content-versioning system.

APPROVED is frozen even before any reimbursement. No edit, withdrawal, return to dispute, or silent financial correction is available. Explain this limitation before approval. Never-submitted drafts and their withdrawn records stay private to their author, including their activity and attachments.

## Reimbursement states

Only the reviewer owing an APPROVED expense can create a PENDING report. Its amount must be positive and no greater than `available_to_report_cents`. Amount, payer, recipient, date, and report content cannot subsequently be edited.

Only the original expense payer, who should receive that reimbursement, can choose CONFIRMED or REJECTED. Rejection requires a reason. Both outcomes are terminal. Confirmation decreases remaining exactly once; rejection releases the pending reservation without increasing confirmed funds. Correcting a mistaken confirmation or recording a reverse transfer is outside this MVP; no negative compensating record is invented.

Use `Record external payment`, `I received this payment`, and `I have not received this payment`. Do not use `Send money` or `Bank verified`. A user-entered method label does not establish an integration with that provider.

## Access, consistency, and receipts

- Derive identity from the server session. Never trust client actor, owner, paidBy, household, role, computed owed, server time, or demo flags.
- Enforce household membership, at-most-two membership, one household per user, same-household foreign relationships, actor roles, and state transitions on the server/database.
- Each financial command locks its expense and atomically commits the mutation, activity event, revision increment, and idempotency result. Check an already successful idempotent replay before rejecting its old revision. Same actor/operation/key with different payload is a conflict.
- Clients cannot directly alter financial statuses, computed balances, activity events, or memberships. Activity visibility inherits the expense's visibility. Command results are private to the command actor.
- Invitations target a verified email, use a random single-use token valid for 72 hours, and store only its hash. Accepting and taking the second seat are atomic. A new explicit invitation replaces the old unused one. No raw invitation token in logs, audit, or command results. Copying a link is enough; no unsolicited email delivery.
- Receipts use a private bucket and random paths. Server checks actual image type, size, author, and draft state. Final attachment rechecks DRAFT and revision while holding the expense lock. Unfinished uploads cannot be submitted.
- After submission, prevent receipt overwrite, upsert, and deletion, including direct Storage API attempts. Access checks precede short signed URLs lasting at most 60 seconds. Those URLs are temporary bearer access, not instantly revocable links.
- No receipt data, aliases, invite tokens, or sessions go to analytics or LLM services. CSV neutralizes spreadsheet-formula prefixes and excludes signed URLs.

Do not call Activity history tamper-proof, court-certified, or a legal guarantee. Before handling real family information, separately complete and validate recovery, retention/deletion, abuse controls, and handling of mistaken confirmations.

## Minimum interface

Routes: `/`, `/pricing`, `/login`, `/invite/:token`, `/app`, `/app/expenses/:id`, `/demo`. Expense creation may be a dialog inside `/app`.

The ledger separates You owe, Owed to you, Awaiting review, Disputed, and Payments awaiting confirmation. The detail view shows total, proposed/agreed share, confirmed received, remaining, pending transfers, receipt state, permitted actions, and Activity history. Draft entry previews both shares and labels the percentage `Your co-parent's share`.

Use calm, neutral English, USD, and readable US dates. No parent ratings, blame, threats, fake testimonials, or empty charts. Provide keyboard navigation, labels, text status cues, loading/empty/error/success states, and responsive layouts at 375 and 1280 pixels. Preserve input on network failure. On stale revision, refresh and ask the person to review changes before retrying; never silently change the action's meaning.

## Synthetic demo and exact golden data

The React `/demo` remains sessionStorage-backed. The published standalone at the root URL displays a synthetic-demo banner and stores its ledger in localStorage on the same browser/device, coordinated with Web Locks. Both use shared domain rules, have no real-session privileges and accept only built-in SAMPLE receipts. Alex/Jordan switching and demo reset must never exist as real-app authority controls.

| Example | Payer | Total cents | Other share bps | Proposed/agreed cents | Payer cents | Review | Confirmed cents | Pending cents | Agreed remaining cents | Available cents |
| --- | --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: |
| E1 School supplies | Alex | 12001 | 4000 | 4800 | 7201 | APPROVED | 2000 | 1000 | 2800 | 1800 |
| E2 Pharmacy | Jordan | 8555 | 5000 | 4278 | 4277 | APPROVED | 0 | 0 | 4278 | 4278 |
| E3 Activity fee | Alex | 9999 | 7000 | 6999 | 3000 | DISPUTED | 0 | 0 | Excluded | Not reportable |
| E4 School backpack | Jordan | 4005 | 3333 | 1335 | 2670 | PENDING | 0 | 0 | Excluded | Not reportable |

E3 reason: `Please clarify which session this charge covers.` Golden agreed shares are $90.78; confirmed reimbursements $20.00; agreed remaining $70.78. The $10.00 pending report is already within remaining. Alex owes $42.78 and is owed $28.00; Jordan sees the reverse. Show the proposed $13.35 awaiting review and proposed $69.99 disputed separately. Do not automatically display a net $14.78 obligation.

`Start clean` starts with a joined synthetic household, Child 1, and no expenses. The clean E1 flow ends after confirming $20 with remaining $28 and pending $0. `Load examples` replaces the stored demo with E1-E4, including the separate pending $10. In standalone, reset replaces saved records for this browser/device after confirmation and affects other tabs' saved view; access state remains separate. Clearly announce the replacement; do not describe the fixture as an unbroken continuation of the clean flow.

## Pricing and release evidence

The proposed price is $7.99/month per household for both parents with a 14-day no-card trial. The published standalone implements a browser-local creation gate, trial-expiry simulation, one-button test unlock and separate access reset. This is test access, not a paid subscription or server authorization. There is no checkout, real charge or card collection. The judge can complete the core flow without registration or payment. React pricing copy alone is not evidence of the published gate; use the standalone source and dated QA.

The demo gates new expense drafts and plan conversion after trial expiry; existing records, receipts, history, basic CSV and confirmation of recorded reimbursements remain available. Real subscription cancellation/renewal is not implemented. No commission on family reimbursements or sale of family data is proposed.

At the original document's preparation, dependency installation and live Supabase checks were blocked. Later public deployment and synthetic-flow checks are recorded in STATUS/QA. Requested owner remains `hikkki013`; the user later supplied `coparent-ledger-ctrl-alt-elite`, whose current remote metadata is unverified here. Money/state tests and the standalone build do not establish real backend isolation, two-account persistence, RLS, private Storage or production account recovery. These remain required evidence before claiming real-family service readiness.
