# CoParent Ledger business model

Prepared 2026-11-14. This is a testable business proposal, not evidence of traction. No paying customers, booked revenue, recruited pilot households, or reduced family conflict are claimed. Actual implementation and verification are tracked in [STATUS.md](STATUS.md).

## Customer and recurring problem

The intended buyer is a US parent, primarily age 25-45, who regularly pays shared child expenses and whose co-parent is willing to participate. School supplies, pharmacy purchases, activities, and other purchases create repeated questions: which amount was proposed, what was agreed, whether a transfer actually arrived, and what remains.

The product offers a shared record of those decisions and confirmations. It does not decide a fair split or establish a legal obligation. If the second adult declines to join, the first can keep private drafts but cannot achieve the two-person agreement outcome.

The recurring use case is a new expense or a partial reimbursement, not a daily engagement target. The paid unit is one two-adult household, not two individual subscriptions.

## Offer and money flows

| Item | Proposal / boundary |
| --- | --- |
| Pilot price | $7.99/month per household, including both adults; unvalidated hypothesis |
| Trial | Proposed 14 days without a card or automatic charging |
| Who pays | One adult; payment grants no authority over the other's decisions |
| Invited adult | Free participation, including concerns and reimbursement decisions |
| MVP billing | Disabled; pricing is displayed as a pilot proposal, no checkout or actual subscription |
| Future cancellation | Stops renewal; existing records, receipts, decisions, concerns, payment recording, and basic export remain available |
| Possible future paid limit | Creating new expenses after the trial; requires a separately implemented entitlement system |
| Family reimbursements | Made outside the service; recorded and confirmed by participants, never platform revenue |

Commercial billing is a separate implementation with a provider actually available to the business, reliable status handling, cancellation, refunds, and idempotent webhook processing. No provider availability or account readiness is assumed.

## Alternatives and differentiation hypothesis

| Alternative | What is established | Implication |
| --- | --- | --- |
| OurFamilyWizard | Its official expense page describes expense logs, percentage splits, receipt attachments, and tracking/payment options | This workflow is not a new category or proven unique feature |
| TalkingParents | Its official Accountable Payments page describes payment requests, transaction records, and sending/receiving funds | Established co-parenting products already address related financial coordination |
| Shared spreadsheet and messaging | A plausible substitute that the pilot should ask people about | A pair may prefer a free tool if it already provides sufficient clarity |

Primary product sources checked 2026-11-14: [OurFamilyWizard expense log](https://www.ourfamilywizard.com/product-features/expense-log) and [TalkingParents Accountable Payments](https://talkingparents.com/features/accountable-payments). These sources establish advertised capabilities, not independent proof of product effectiveness. No competitor pricing, market-share, legal, or safety comparison is asserted.

Our hypothesis is that a narrow browser workflow and one charge for both adults may suit pairs who want only expense coordination. Ease, preference, switching, and willingness to pay must be demonstrated; a smaller feature set alone is not an advantage.

## Three assumptions to test

1. **Two-sided participation:** the second adult accepts an invitation and performs their own review/confirmation without the team acting for them.
2. **Repeat practical value:** pairs complete more than one actual expense cycle with less manual reconciliation effort than their current method. Measure effort; do not assume conflict is reduced.
3. **Willingness to pay:** at least some participating households choose the specific $7.99 offer after trying the workflow, and later complete a real authorized purchase when commercial billing is available. A survey answer or pricing-page click is not revenue.

## Costs and unit economics

Costs include hosting, private receipt storage and delivery, email/auth services, support, operational maintenance, and later payment fees. Financial misunderstandings and mistakes can create support work; support cost is a central pilot measure.

For arithmetic only, 100 paying households at $7.99 would mean $799 monthly subscription revenue before discounts, fees, refunds, taxes, and costs. This is not a forecast. Household reimbursement volume is not company revenue; MRR is not profit. There is no validated acquisition cost, retention rate, lifetime value, or addressable-market size yet.

## Pilot and acquisition hypothesis

Propose a small, opt-in pilot with 5-10 pairs who already share child expenses and both voluntarily agree to participate. No one has been recruited. See [PILOT_PLAN.md](PILOT_PLAN.md) for safety of the rollout, metrics, and decision rules.

Possible future discovery channels are parent communities that permit research invitations and direct referrals from consenting participants. These are hypotheses, not partnerships or permission to contact anyone. No outreach, invitations, or messages are sent as part of this implementation.

## Principal risks

- A second parent refuses to join, preventing the product's core shared outcome.
- A spreadsheet or existing co-parenting service already solves the job adequately.
- Receipt privacy, mistaken confirmations, and support demands can outweigh the price.
- A short successful demo does not establish secure operation with real family information.
- The 5-7 hour build target depends on available tooling and services; environment blockers must not be hidden by local sample data.

The organizer FAQ confirms Product & engineering 40%, Value & retention 20%, Problem & user 15%, Business potential 15%, and Originality 10% (Q17/Q27/Q106). Q58/Q81/Q142 expect price, CAC by channel, retention and LTV assumptions with sources or clear reasoning; the current document does not yet supply that numerical model. Q49 allows labeled hypotheses, and full TAM/SAM/SOM is not mandatory. Q37/Q67 require a working paywall, so the proposed-only pricing page is a remaining product gap. AI and real payments are optional; an achieved $100m ARR is not demonstrated or required by these answers. See CRITERIA_MATRIX.md for the complete audit.
