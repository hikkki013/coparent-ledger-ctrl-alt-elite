# Business Cup 2.0 requirements and evidence audit

Reviewed 2026-11-14 against all 150 answers in the organizer document **Business Cup 2.0 | FAQ по кейсу** (29 pages). Q numbers below refer to that document. This FAQ supplies competition rules missing from the earlier development brief; financial rules and command interfaces remain unchanged.

**Verdict: the idea fits, but the current project is not ready for a compliant submission.** A public deployed product, working paywall, and English PDF deck are missing. The working repository stays PRIVATE under the user's explicit instruction; public submission-source access remains an unresolved competition requirement. This audit does not authorize changing visibility or publishing a public copy.

## Pass/fail and submission conditions

| Organizer requirement | Evidence in this project | Assessment / required action |
| --- | --- | --- |
| B2C; one main track; US adults ages 25-45 (Q2, Q6, Q15, Q38, Q80) | Money track; individual US co-parent pays; English UI and USD; family expenses explicitly fit Money | FITS the brief; user research and willingness to pay remain hypotheses |
| Browser product; no native installation (Q18, Q40, Q87) | React web routes and standalone browser demo | FITS the architecture; deployed browser behavior still needs verification |
| Public product URL, end-to-end, no required registration/login (Q1, Q47, Q54, Q65, Q92) | `/demo` accepts manual input and uses shared calculations; only local delivery is verified | NOT MET: deploy a working guest flow and test the actual submitted URL. Local HTML, localhost, Figma, video and GitHub source links are not substitutes |
| Full source of deployed revision in a public GitHub repository (Q23, Q46, Q61, Q104) | All source is in private hikkki013/coparent-ledger | NOT MET FOR SUBMISSION; deliberately retained private as instructed. A separate private working repository is allowed; do not change visibility or create a public copy without the user's instruction |
| English PDF pitch deck, maximum 10 slides total (Q16, Q18, Q53, Q75, Q81, Q86) | Markdown business/demo documentation only; no submitted deck | NOT MET: title and appendices count toward the total. Include screenshots; a video is not required |
| Link remains available through the end of the November 15 final (Q47, Q73, Q103) | No verified production URL | NOT VERIFIED; check availability on the hosting URL, not just a local build |
| Product created during the hackathon; generic starters allowed (Q64, Q93, Q98) | Local and browser commits dated November 14 | Preserve actual history; timestamps alone do not prove the complete event-window condition |

The FAQ states a November 15 12:00 submission deadline, review until 15:00, and final pitches at 16:30 in Green Hall (Q70, Q77). It does not specify a timezone in those answers. Confirm scheduling against the organizer's submission instructions rather than inventing a timezone.

## Actual scoring weights and current gaps

| Criterion | Weight | Existing evidence | Remaining gap |
| --- | ---: | --- | --- |
| Product & engineering | 40% | Shared domain, manual amounts/splits, review states, partial reports, recipient confirmation and audit history; 48 Node tests and isolated SQL suites previously passed | No verified public end-to-end URL; no browser E2E/layout pass. SQL single-user tests do not verify native RLS or concurrency |
| Value & retention | 20% | Agreed remaining amounts, unresolved expenses and accumulating history provide a reason to return | The standalone guest demo uses localStorage and survives tab closure in the same browser; the paywall is test-only. Browser storage can be cleared; retention remains unmeasured |
| Problem & user | 15% | Defined US co-parent segment and repeated shared-expense problem | No collected interviews or US customer evidence. These are a plus, not mandatory (Q49, Q74, Q149); explain the problem with sourced evidence or explicit assumptions |
| Business potential | 15% | Proposed $7.99 per household; two adults included; payer and revenue unit identified | Price alone is insufficient. Add CAC by channel, retention/churn, LTV and payback assumptions with sources or clear reasoning (Q58, Q81, Q120, Q142). Full TAM/SAM/SOM is not mandatory |
| Originality | 10% | Narrow expense coordination focus and recipient-confirmed balances | Existing co-parenting services already offer related workflows. Establish a concrete difference in mechanism or value; a new category is not required and a cheaper/smaller product alone does not prove novelty (Q31, Q57, Q79, Q97, Q123) |

Weights are explicitly confirmed in Q17, Q27 and Q106. Do not invent a numerical jury score from this review.

## Clarifications that change the previous interpretation

1. **A backend is not a competition prerequisite.** Q47 permits temporary/local storage, Q135 permits localStorage and anonymous sessions, and Q105 allows GitHub Pages when the flow works. A public guest demo with actual input-dependent logic can satisfy the contest flow. A local-only demo cannot. This permission does not establish that our separate authenticated multiuser service works.
2. **Seed data is allowed.** Q66, Q69, Q84, Q94, Q127 and Q134 permit labeled examples passed through real logic, alongside judges' own input. DemoLedger computes each submitted amount, applies state/role checks, and updates balances/history. The prepared $120.01 example is not the only accepted input. Browser verification of the submitted URL is still outstanding.
3. **Two windows are an allowed option, not a universal requirement.** Q52 accepts separate role links without registration and asks for instructions on the landing page. Our current demo switches roles in one tab; it does not synchronize independent parent windows or devices. The user's original real-two-account acceptance requirement remains separate and unverified.
4. **Real payments and a checkout are not required.** Q20, Q37, Q55, Q67, Q95, Q115, Q118 and Q137 require a clear working paywall/pricing interaction while allowing the jury to continue without a real payment. Test checkout is optional extra evidence. The current PricingPage only describes a proposed price and links to `/demo`; it has no entitlement/gating behavior. The standalone demo has no pricing/paywall screen. This is a confirmed gap, not a reason to add real charges.
5. **Retention must be visible in the product.** Q30, Q72, Q100 and Q148 allow weekly/seasonal use; daily engagement is not the goal. Saved records, outstanding balances and continued reimbursement progress suit this product, but the current guest tab-lifetime storage limits a real return demonstration.
6. **AI, CI/CD and automated tests are optional.** Q23, Q25 and Q63 do not require them. Existing tests are valuable evidence but do not replace a usable deployed product.
7. **Sensitive family/medical expenses are allowed with restraint.** Q26, Q78, Q138 and Q150 favor minimal data and no medical promises. Keep child aliases, sample receipts and the distinction between recording payments and moving money. Never publish secrets.

## Code evidence inspected

- `src/App.tsx`: React `/demo` route still uses sessionStorage; the published standalone demo has separate persistent localStorage.
- `src/data/demo-ledger.ts`: editable manual inputs, exact shared calculations, command/state enforcement, stored history and demo-only actor switching.
- `demo/app.js`: manual amount/share forms, same shared domain, approval/dispute/payment/confirmation actions and same-tab storage.
- `src/features/expenses/LedgerView.tsx`: demo controls, separate directional balances and history; explicit sample labeling.
- `docs/BUSINESS_MODEL.md`: proposed pricing and acquisition hypotheses; missing numeric CAC/LTV/retention assumptions.
- `docs/QA_REPORT.md`: passed checks and explicit blocked/unrun integrations. Existing results were reused; this document-only audit did not rerun unchanged application tests.

## Required next evidence

1. A verified public URL that allows a judge to enter a fresh expense, attach a labeled sample receipt, agree or object, report a partial reimbursement, confirm receipt and observe the correct remaining amount/history without registering or paying.
2. A real paywall interaction with a visible $7.99 price and clearly labeled test access that changes demo access state; no bank transfer or actual subscription charge. Existing records, reviews, confirmations and export must remain accessible under the product's stated policy.
3. A visible, tested return path to prior guest progress. Keep it isolated from real accounts and label the scope of persistence accurately.
4. An English PDF deck of no more than 10 slides covering the user/problem, working flow, payment value, retention, economics and differentiation. Oral pitch may be Russian, Kazakh or English; format is five minutes plus two minutes for questions (Q45, Q109, Q121).
5. A later explicit user decision about public submission-source access. The current private repository remains unchanged in visibility.

Do not mark any missing deliverable complete merely because its code or design is described. No real payments or real-person invitations are authorized by this audit.
