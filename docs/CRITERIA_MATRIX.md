# Competition criteria and evidence matrix

Prepared 2026-11-14. Criteria below are attributed by [DEVELOPMENT_PROMPTS.txt](DEVELOPMENT_PROMPTS.txt) to the original user-supplied slide. That brief, not invented judging rules, is the source used here. The 5-7 hour constraint is the team's additional target; the competition timeframe in the supplied brief is 24 hours.

This matrix describes what would demonstrate compliance. It does not mark unrun checks as passed. [STATUS.md](STATUS.md) and the QA report are the authority for current implementation/test results.

| Criterion / source | Product response | UI or document evidence | Required verification / current limit |
| --- | --- | --- | --- |
| US ages 25-45 / supplied slide | Shared child-expense workflow for US adults; English UI, USD, readable US dates | Landing, expense form, PRODUCT_SPEC | Inspect locale/currency; pilot must verify audience fit. No current adoption evidence |
| B2C / supplied slide | One parent is the proposed paying customer; second adult included | Pricing and BUSINESS_MODEL | Display household price and free participation; live billing is disabled |
| Web only / supplied slide | Browser routes for ledger, details, invitation, and demo; no native installation requirement | `/`, `/app`, `/app/expenses/:id`, `/demo` | Run in mobile/desktop browsers at 375/1280 px; report actual results in QA |
| Working product within 24h / supplied slide | Narrow expense-to-reimbursement cycle | CONTRACTS, implementation, STATUS | Build plus real two-account flow and persistence; demo alone is insufficient |
| Significant repeated problem / supplied slide | Proposed shares, disagreements, pending transfers, and remaining balance are distinguished | Expense details and Activity history | Run the clean demo; interview pairs about current frequency/effort. Pain magnitude remains unvalidated |
| Willingness to pay / supplied slide | Proposed $7.99 per household after a 14-day no-card trial | Pricing, BUSINESS_MODEL, PILOT_PLAN | Voluntary price decisions then actual authorized purchases in a later billing stage; no paid-demand claim yet |
| 5-7 hour MVP / team constraint | One household, two adults, USD, manual expense entry, optional image receipt | PRODUCT_SPEC scope; STATUS | Cut decoration or extras first; never remove access controls or correct money rules to meet the clock |

## Functional evidence checklist

| Acceptance condition | Concrete evidence needed |
| --- | --- |
| Real two-person agreement | Two separate real sessions complete create, send, review, report, and receipt confirmation |
| Exact arithmetic | Golden fixtures and boundary tests: 1 cent at 50%, $85.55 at 50%, $40.05 at 33.33% |
| Honest transfer state | Reporting $20 against $48 leaves $48 remaining until the receiving parent confirms |
| Review isolation | Proposed disputed $69.99 and pending $13.35 do not enter agreed totals |
| Frozen records | Approved record and submitted receipt cannot be changed, including direct backend attempts |
| Access isolation | Another household and anonymous requests cannot read records, aliases, receipts, or history |
| Concurrent safety | Competing payment reports cannot exceed available amount; retries produce one effect/event |
| Useful demonstration | Start clean and Load examples are separate modes with disclosed sample data |
| Honest commercial state | Pricing says billing is not enabled; no fake checkout or fabricated paid badge |
| Completion evidence | Actual lint/typecheck/test/build results and an explicitly verified preview URL, if one exists |

At preparation, live Supabase credentials and dependency installation were unavailable; real Auth/RLS/Storage/concurrency and integrated two-session checks therefore had no passing evidence. Consult STATUS for later changes. A local browser demo must remain labeled synthetic and must not conceal those blockers.

## Explicitly unconfirmed

No available scoring weights, mandatory AI, required revenue, $100m ARR requirement, mandatory presentation, or bonus-point rules are established. Money is the selected direction. Do not convert product hypotheses into organizer requirements.

No customer count, pilot enrollment, revenue, percentage time saved, or reduction in conflict is established. These require observation and measurement, not feature screenshots.

## Seven-hour execution target

| Time | Required result |
| --- | --- |
| 0:00-0:45 | Shared contract, project scaffold, environment/account checks, exact money tests |
| 0:45-2:15 | Create/send expense and second adult's approve/concern actions |
| 2:15-3:30 | Partial payment report, confirm/reject, remaining, and activity history |
| 3:30-4:30 | Private receipt and two-session vertical slice |
| 4:30-5:30 | Access, races, retries, golden fixture checks, corrections |
| 5:30-6:15 | Isolated demo, truthful pricing, handoff documentation |
| 6:15-7:00 | Build/preview if available, responsive checks, fixes |

Aim for the core cycle by hour four. This is a target with a ready environment and familiar stack, not a guarantee. Record a blocked live check as BLOCKED and continue independent work; do not replace its evidence with a mock success.
