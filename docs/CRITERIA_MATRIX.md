# Business Cup 2.0: criteria and current evidence

> **Final-audit qualification, 15 November 2026:** [FINAL_SYNC_REPORT.md](FINAL_SYNC_REPORT.md) records a fresh public-site test and the exact ZIP reconciliation. Normal new-expense creation and plan conversion are gated after trial expiry, but **Create corrected draft** still creates a replacement draft; that published functional gap is open. Receipts are optional. The guest roles and storage remain browser-local; no charge, verified shared account or deployment is claimed by this documentation revision. Public-source submission access remains unresolved while the working repository stays PRIVATE.

Updated 15 November 2026 for **Ctrl Alt Elite**. All 150 answers in the 29-page organizer FAQ were re-read locally during the documentation review. FAQ references below are rules from that document, not organizer approval of this project. Product evidence is limited to the dated [QA report](QA_REPORT.md), inspected source and local checks. The later browser synchronization verified the hikkki013 owner session and Private destination; see STATUS for the actual upload results. Opening the public entry page is not a rerun of the financial workflow.

## Pass/fail and submission requirements

| Requirement / FAQ | Project evidence | Status and boundary |
| --- | --- | --- |
| B2C, US adults 25-45, one primary track; Q2/Q6/Q15/Q16/Q38/Q80 | Money; intended buyer is an individual US co-parent sharing child expenses. English UI and USD. | Aligned positioning; audience fit and willingness to pay remain hypotheses. |
| Web product without native installation; Q18/Q40/Q87 | Public browser guest version. | Implemented; mobile viewport checks have limits described in QA. |
| Public no-login, input-dependent end-to-end flow; Q1/Q3/Q47/Q54/Q65/Q69/Q96/Q118 | [Published URL](https://coparent-ledger-demo.pages.dev/); prior public test: $64.20 purchase, $32.10 agreed, $12.10 pending/confirmed, $20 remaining and history. | Recorded public-flow evidence, not a fresh URL fetch. Two roles in one browser; no real-account synchronization. |
| Working price/paywall; Q20/Q37/Q55/Q67/Q115/Q130/Q137 | $7.99/month per household, both parents; trial expiry blocks new drafts and test access unlocks without payment. | Implemented and previously exercised. Test-only entitlement; no checkout, card or real subscription. |
| A visible return mechanism; Q30/Q72/Q100 | Stored expenses, unfinished reimbursements and history restore from localStorage on the same browser/device. | Implemented guest progress; paid renewal and secure backup not established. |
| English PDF, at most 10 slides including cover/appendices, screenshots; Q8/Q53/Q75/Q76/Q81/Q86/Q121 | [Version 2 PDF](presentation/CoParent_Ledger_Jury_Deck_v2.pdf), 10 slides, with product/value/retention/economics. | Prepared and visually checked; submission not verified. UI captures are local renders of the unchanged deployed artifact, labeled in the deck. |
| Public repository containing the full deployed source, no access request; Q23/Q46/Q61/Q104 | Owner requires the working repository PRIVATE. User supplied `hikkki013/coparent-ledger-ctrl-alt-elite`; the hikkki013 session and current Private status were verified in the restored side browser. | **Unresolved submission blocker.** No permission to change visibility or publish a copy. The pre-upload archive comparison found all application source and existing tests identical; reviewed documentation/materials are synchronized as recorded in STATUS. |
| Link stays live through the final; Q47/Q73/Q103 | Existing Cloudflare Pages project and prior deployment evidence. | Must check availability at submission/judging; future uptime cannot be guaranteed by a previous test. |
| Product built during event; generic libraries/templates allowed; Q64/Q93/Q98 | Existing project history and dated development records. | Preserve actual history; these records are not independent proof of full event-window compliance. |
| Basic data hygiene; Q26/Q78/Q138/Q150 | Synthetic inputs, built-in sample receipts and ignored environment/build directories. | No real family data authorized; prior pattern scans are not comprehensive security audits. |

The captain submits the PDF, production URL and public GitHub URL through the submission link sent by the organizers (Q82). The FAQ states 15 November 12:00, browser review until 15:00, and final pitches at 16:30 in Green Hall; no timezone was specified in the inspected answers (Q70/Q77). Oral pitch: five minutes plus two minutes of questions, in Kazakh, Russian or English (Q45/Q75/Q109/Q121). No accepted submission is claimed.

## Scoring criteria

| Criterion | Weight | Current evidence | What is not established |
| --- | ---: | --- | --- |
| Product & engineering | 40% | Real input-dependent state/money logic, history, recorded public cycle, 62 local tests, Pages build; see QA. | Full automated E2E, live Auth/RLS/Storage, concurrent real accounts and React/Vite release build. |
| Value & retention | 20% | $7.99 offer, working test limit/unlock, browser-local saved progress and continuing expense cycles. | Actual paid renewals, measured retention, cloud synchronization. |
| Problem & user | 15% | Defined US co-parent audience, recurring expense problem, official market context and explicitly labeled hypotheses. | Verified demand, customer savings or adoption; no invented validation. |
| Business potential | 15% | [Market/economics report](MARKET_AND_ECONOMICS.md): CAC by channel, retention, LTV, sources, sensitivity and $100m ARR calculation. | Commercial viability: conservative and broad paid-acquisition scenarios fail; base retention is ambitious. |
| Originality | 10% | Focused expense record connecting receipt, agreement and confirmed balance; alternatives acknowledged. | Category invention, unique family pricing or demonstrated superiority. |

Weights: Q17/Q27/Q106. No numerical jury score is inferred. Price/CAC/retention/LTV assumptions need sources or understandable logic (Q33/Q49/Q58/Q81/Q120/Q142); full TAM/SAM/SOM is optional. The report supplies conditional scenarios, not measured traction.

## Optional pluses and interpretation

- Stripe test-mode checkout is a plus, not required (Q20/Q55/Q67/Q91/Q95). It is not implemented. Real payments are neither necessary nor authorized here.
- Real target-user feedback is a plus, not mandatory (Q39/Q49/Q74/Q102/Q149). Do not invent users, interviews, responses or payments.
- Mobile-adaptive web is a plus (Q60/Q70/Q103). Viewport smoke checks are recorded; no physical phone test is claimed.
- A marketing/CAC plan strengthens Business potential (Q143/Q144). Our referral/content/search costs are assumptions, not campaigns or partnerships.
- AI, CI/CD and automated tests are not prerequisites (Q23/Q25/Q63). Tests do not replace the usable public flow.
- Local storage and labeled seed inputs are allowed if the result depends on the user's input (Q47/Q66/Q69/Q84/Q94/Q127/Q134/Q135). This does not prove safe handling of real financial data.
- Q52 accepts separate role windows as one option; our implemented judge journey switches roles in one browser. No independent parent sessions are claimed.

## Remaining actions

1. Resolve the owner's private-repository constraint against the public-source rule; do not change visibility without authorization.
2. Retain the reviewed browser synchronization evidence in STATUS; the original local Git history remains separate and must be reconciled before any future terminal push.
3. Repeat the public guest/paywall/persistence journey and availability check near submission; use a physical phone if available.
4. Submit all three required materials through the captain's official link and verify acceptance. A prepared deck is not an accepted submission.

Real two-account backend operation remains a separate service-development goal. [SUBMISSION_BASELINE.md](SUBMISSION_BASELINE.md) is preserved as a historical snapshot; [STATUS.md](STATUS.md) records later changes.
