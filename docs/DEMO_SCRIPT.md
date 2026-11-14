# Two-to-three-minute demonstration

This script is for an implemented and verified demo. Rehearse the named actions first and report unavailable actions honestly. Use only synthetic Alex, Jordan, Child 1, and built-in SAMPLE receipts. No real parent data, payment, or invitation delivery is part of the demo. Do not invent a preview URL; obtain the current verified launch method from README/STATUS.

## Preparation

- Open `/demo` and verify the visible `Demo - sample data, no money moves` banner.
- Choose `Start clean`, which clears only this tab's demo data, not actual households.
- Start as Alex with a joined synthetic Jordan and Child 1; there are no expenses.
- Keep the separate `Load examples` fixture available for the second half.
- If real backend checks are blocked, say so when asked: sample behavior does not verify live two-account operation.

## Timed walkthrough

| Time | Action and exact expected result | Suggested words |
| --- | --- | --- |
| 0:00-0:20 | Show empty clean ledger and demo banner | "Two parents need the same view of a child's shared expenses: what was proposed, agreed, and actually reimbursed. This demonstration uses sample data and moves no money." |
| 0:20-0:50 | As Alex, add School supplies, Child 1, SCHOOL, $120.01, Jordan's share 40%; optionally attach the built-in sample receipt. Preview Alex $72.01 / Jordan $48.00. Send for review | "Alex paid $120.01 and proposes a 40% share for Jordan. That is a $48 proposal until Jordan makes a decision." |
| 0:50-1:10 | Switch to Jordan only in demo; approve the $48 share | "Jordan confirms this particular amount. The submitted record stays unchanged." |
| 1:10-1:35 | Jordan selects Record external payment for $20.00. Show remaining $48.00, pending $20.00, available to report $28.00 | "Recording a transfer is not proof it arrived. The outstanding amount is still $48 while Alex checks receipt." |
| 1:35-1:55 | Switch to Alex and confirm receipt of that $20.00. Show remaining $28.00, pending $0.00, available $28.00. Open Activity history | "Only the receiving parent confirms receipt. The remaining amount becomes $28, with the decisions preserved in the history." |
| 1:55-2:25 | Explicitly choose Load examples. Show E3 disputed $69.99, E4 awaiting review $13.35, and separate directional totals | "I am now loading additional prepared examples. A disputed proposal is shown separately, not added to agreed amounts. Neither direction is silently offset against the other." |
| 2:25-2:50 | Show pricing copy | "Our proposed pilot price is $7.99 per household for two adults, with a 14-day no-card trial. The invited parent participates free. Billing is not enabled; willingness to pay still needs validation." |

Allow up to ten seconds of slack. No slide presentation is needed.

## Do not confuse the two datasets

| View | Exact amounts |
| --- | --- |
| Clean E1 after $20 confirmation | Total $120.01; Jordan's agreed share $48.00; confirmed $20.00; remaining $28.00; pending $0.00 |
| Loaded E1 example | Same agreed/confirmed/remaining values, plus a separate pending $10.00 report; available to report $18.00 |
| Loaded E2 example | Jordan paid $85.55; Alex's 50% share and remaining are $42.78 |
| Loaded E3 example | Activity fee $99.99; proposed Jordan share $69.99; disputed; excluded from agreed totals |
| Loaded E4 example | School backpack $40.05; proposed Alex share $13.35; awaiting review; excluded from agreed totals |
| Loaded summary | Agreed shares $90.78; confirmed $20.00; agreed remaining $70.78, including the $10.00 pending report |
| Alex's loaded summary | You owe $42.78; Owed to you $28.00 |
| Jordan's loaded summary | You owe $28.00; Owed to you $42.78 |

Do not say the added pending $10 comes from the just-confirmed $20. Do not add pending to the $70.78 again or automatically present a net $14.78.

## Answers to likely questions

- **Does it transfer money?** No. Parents transfer outside the service; the receiving parent confirms a recorded transfer.
- **Can it settle a dispute?** No. It records the concern and the parent's eventual explicit decision.
- **Can an approved amount be edited?** No in this MVP. Corrections to approved expenses and confirmed reimbursements need a future, separately designed workflow.
- **Is this unique?** Existing co-parenting products offer expense/payment features. We are testing a narrow browser experience and household pricing.
- **Is the demo proof of production readiness?** No. It demonstrates the workflow. Current real-backend and deployment verification is reported separately.

## Exact landing copy for frontend handoff

**Headline:** Shared child expenses, clearly agreed.

**Body:** Keep proposed shares, decisions, and confirmed reimbursements in one shared ledger for two parents.

**Three steps:**

1. Add an expense and propose a share.
2. Your co-parent approves or raises a concern.
3. Record an external payment and confirm receipt.

**Primary CTA:** Try sample demo

**Secondary CTA:** Create your shared ledger

**Payment note:** Payments happen outside CoParent Ledger. Only the receiving parent confirms receipt here.

**Pricing:** Pilot pricing: $7.99/month per household, including two adults. Proposed 14-day trial, no card required. Billing is not enabled in this MVP.

**Availability rule:** The real-ledger CTA must lead to functioning authentication or a clear configuration-unavailable state. It must never silently open a sample household as if registration succeeded.
