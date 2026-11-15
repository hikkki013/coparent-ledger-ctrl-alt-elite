# Three-minute guest product demonstration

Updated 15 November 2026. Open [the public site](https://coparent-ledger-demo.pages.dev/) at its root; no registration or payment. Use synthetic inputs only. This script describes the standalone version, where two sample roles are switched in one browser. The separate [oral pitch](presentation/PITCH_SCRIPT_RU.md) accompanies the [10-slide English PDF](presentation/CoParent_Ledger_Jury_Deck_v2.pdf).

## Preparation

- If the trial was left expired, use labeled test access or Reset demo access. This resets access separately from the ledger.
- Start clean and Load examples replace this browser's saved demo expenses, family and plans after confirmation, including data visible to other tabs. Use an isolated test browser profile if existing records should be preserved.
- Choose Start clean only when that replacement is intended. Start as Alex (Parent A); Jordan (Parent B) and Child 1 are synthetic identities.
- Follow the expected values on the expense itself. Existing examples can contribute other dashboard totals.

## Walkthrough

| Time | Action | Expected result / explanation |
| --- | --- | --- |
| 0:00-0:20 | Show demo banner and Viewing as control | Explain two roles, synthetic data, no money movement and browser-local persistence. |
| 0:20-0:55 | As Alex, create a $64.20 School expense with 50% proposed share; save draft, attach sample receipt and send for review | Proposed Jordan share $32.10; not yet in agreed totals. The fixed sample image is illustrative, not evidence of this purchase. |
| 0:55-1:15 | Switch to Jordan, open the expense and agree to the $32.10 share | Approved; agreed amount is frozen. |
| 1:15-1:40 | Record an external $12.10 reimbursement | Remaining $32.10, pending $12.10; reporting does not prove receipt. |
| 1:40-2:00 | Switch to Alex and confirm receipt; show history | Remaining $20.00, confirmed $12.10, pending $0.00. |
| 2:00-2:20 | Reload the page | The same browser restores the record and balance. Other devices do not synchronize. |
| 2:20-3:00 | Simulate end of trial, return to Expenses and select Add expense; show $7.99 paywall; enable test access and reopen creation | Real creation gate and no-payment unlock. Existing records/confirmations remain accessible; no actual subscription or card. |

These amounts match the recorded 15 November public QA flow; this script is not a new browser-test result. Layout checks were limited to desktop/mobile viewport smoke checks, not a physical phone.

## Additional examples, if time permits

Load examples is a deliberate replacement, not a continuation of the new $64.20 expense. It contains:

| Example | Exact values |
| --- | --- |
| E1 School supplies | $120.01 total; 40% share = $48.00; $20 confirmed; $28 remaining, including a separate pending $10; $18 available to report |
| E2 Pharmacy | $85.55 total; Alex's 50% share = $42.78; $42.78 remaining |
| E3 Activity fee | $69.99 proposed share; disputed and excluded from agreed totals |
| E4 School backpack | $13.35 proposed share; awaiting review and excluded from agreed totals |
| Combined approved examples | $90.78 agreed shares; $20 confirmed; $70.78 remaining; opposite directions stay separate |

Family supports names and child archive/restore; categories can be created/corrected; statistics use approved purchases; future plans remain estimates. Do not claim plan approval, editing/deletion, real receipt upload, actual billing or live account synchronization.

## Answers to likely questions

- Does it transfer money? No. It records an external report and the recipient's confirmation.
- Can an approved amount be edited? No financial correction workflow exists. Standalone category correction is audited without changing money.
- Why pay and return? Repeated shared costs, unfinished reimbursements and a useful history; $7.99 per household is a hypothesis, not validated sales.
- Is the approach unique? Existing co-parenting services already handle expenses; our proposed focus/value must earn preference.
- Is this a full real-account service? The public demo uses synthetic roles. Live Auth/RLS/Storage and independent accounts remain unverified.

For exact evidence and integration boundaries use [QA_REPORT.md](QA_REPORT.md) and [STATUS.md](STATUS.md).
