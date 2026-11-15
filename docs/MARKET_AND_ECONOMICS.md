# CoParent Ledger: US market and subscription economics

Prepared and sources accessed **15 November 2026**. Currency: USD. Research and scenario arithmetic, **not traction, a revenue forecast or proof of commercial viability**. This document supersedes the numerical-market gaps in BUSINESS_MODEL.md and SUBMISSION_BASELINE.md; it does not supersede their product limitations.

## 1. What the jury can rely on

**Conclusion:** recurring expense coordination is a plausible paid job in an established category. Our $7.99 household offer is a price hypothesis. Low-cost acquisition and repeat use must be demonstrated; broad paid acquisition does not work in the scenarios below. The narrow initial US segment does not substantiate $100m ARR at this price.

Labels used throughout:

- **Fact (external):** a source reports the number or advertised feature; this is not independent verification of a vendor's performance.
- **Project evidence:** local code and recorded QA, with their stated boundaries.
- **Hypothesis (H):** a chosen model input, not a measured CoParent Ledger metric or an industry statistic.
- **Calculation (C):** arithmetic conditional on those inputs. Precision aids reproducibility, not certainty.
- **Unknown:** evidence has not been collected or inspected.

| Criterion | Organizer expectation, based on supplied FAQ and local baseline | Evidence in this document / remaining boundary |
| --- | --- | --- |
| Q33 | Public benchmarks and justified assumptions for acquisition, conversion and renewal | Sections 5–9 separate web hypotheses from app benchmarks and distinguish clicks, leads and paying households. |
| Q49 | Labeled hypotheses with sources suffice; interviews, surveys and initial users are a plus | Sections 3–4 size a conditional market. No responses, users or payments are claimed. |
| Q58 | Numerical price, CAC by channel and retention assumptions with sources or reasoning; actual users/payments are a strong plus | Sections 4–9 provide formulas and sensitivities; section 12 contains slide-ready wording. These figures still need to be placed in the deck. |
| Q120 | Monetization figures with sources or understandable logic; full business analytics unnecessary | Revenue, contribution, acquisition and retention have explicit units. Evidence from users remains unknown. |

FAQ provenance: user-supplied answers and [SUBMISSION_BASELINE.md](SUBMISSION_BASELINE.md), which records the prior PDF review (Q33 p.7, Q49 p.11, Q58 p.13, Q120 p.24). This research pass did not re-open the organizer PDF. No claim of organizer approval is made.

## 2. Current product, payer and measurement unit

The offer shown in [demo/app.js](../demo/app.js) is **$7.99/month per household, both parents included**, with a 14-day demo trial. Expiry gates new expense drafts; a test button unlocks them without billing. The standalone demo covers expense → sample receipt → agreement/objection → partial reimbursement report → recipient confirmation → balance/history. Family, categories, statistics, plans and browser-local persistence are described in [README](../README.md) and the dated [QA report](QA_REPORT.md). Plans do not automatically become debts and unconfirmed reimbursement reports do not reduce balances.

This is a synthetic guest demo, with two roles in one browser, not verified collaboration between real accounts/devices. Billing, server entitlements and actual customer retention are not established. The public URL is [coparent-ledger-demo.pages.dev](https://coparent-ledger-demo.pages.dev/). The research fetcher could not retrieve that page in this pass; the product assessment relies on source inspection and previous dated browser QA, not a new functional test.

**Commercial unit:** one subscription for one co-parenting pair and its shared children, even though the adults live at two physical addresses. Here “household” is the product billing unit, not a Census household. One payer buys access for both; two parents must never be counted as two subscriptions. Multiple children do not create multiple subscriptions. Complex multi-partner families require separate validation and are not modeled as extra purchases.

**Initial audience (H):** US adults, primarily a paying parent aged 25–45, who repeatedly coordinate child expenses, want an English browser workflow and have a co-parent willing to participate. It can include separated or never-married parents; restricting the pitch to divorced parents would require another population filter. Court-mandated use of another platform, unwilling participation and needs for verified legal records may make a family unsuitable.

**Traction status:** no verified paid household, payment, renewal, CAC, measured time saving or survey result is available in the inspected materials. Demo access is not a paid conversion. The existence of a survey link is not validation.

## 3. Official market anchors: what they count

| External fact | Reference period / publication | Appropriate use |
| --- | --- | --- |
| Census reports **13.9m custodial parents** and **22.2m children under 21** with a parent outside the household | CPS-CSS April 2023; support/income reference year 2022; report August 2025, pp.1–2 [S1] | Population context, not counts of subscriptions or willing buyers. |
| **55.8%** reported at least one type of noncash support | Same report, p.5 [S1] | Indicates financial coordination beyond cash support; includes gifts and does not establish recurring reimbursement needs. |
| **2.6m parents received in-kind support**; **4.0m received cash support** | 2024 SIPP, reference year 2023; January 2026 factsheet [S2] | A more recent, differently measured cross-check. The groups overlap and must not be added. |

CPS universe: US civilian noninstitutionalized custodial parents aged 15+ living with their own children under 21 whose other parent lives elsewhere. It is broader than the 25–45 buyer target. SIPP and CPS are different surveys: the in-kind figures are not a comparable growth series. No 2026 population growth extrapolation is applied. These were the latest relevant releases found, not a claim that every later dataset was ruled out.

**Do not use child-support dollars as software TAM.** Reimbursements belong to families and are not CoParent Ledger revenue. Nor does a child-support order establish willingness to purchase this tool. No audited count of distinct, eligible, willing-to-pay pairs was found.

## 4. TAM, SAM and SOM: conditional scenarios

### Market inputs and formulas

These are transparent planning scenarios, **not statistical estimates or a confidence interval**. Apart from the population anchor and displayed price, all filters are hypotheses chosen to expose uncertainty. Each percentage is conditional on the preceding eligible population; multiplying them does not assert statistical independence.

`P = $7.99/month; annualized revenue per active paid household = 12P = $95.88.`

`Potential pair-equivalents = 13.9m × k`

`TAM households = 13.9m × k × r`

`SAM households = TAM × f × b × w`

`Annualized opportunity at full penetration = household count × $95.88`

| Input | Conservative H | Base H | Meaning and evidence needed |
| --- | ---: | ---: | --- |
| k: parent-to-pair mapping | 0.75 | 1.00 | Planning adjustment for overlap and complex family relationships. Neither is a measured deduplication rate. Base assumes one distinct pair per counted parent; microdata/household research must test it. Do not simply divide the parent anchor by two: it counts custodial parents, not both members of every pair. |
| r: recurring expense coordination fits the job | 25% | 40% | Excludes many one-off gifts, cash-only arrangements and families without repeated shared purchases. Lower than broad noncash-support prevalence, but not inferred from it. Ask frequency and current process. |
| f: initial age/language/web and product-scope fit | 50% | 60% | Composite launch filter, including payer age 25–45 and English/browser suitability. No exact joint distribution was extracted. |
| b: both adults willing/able to cooperate | 40% | 50% | Conditional participation, including freedom to choose this tool; no verified two-person activation data. |
| w: ability and willingness to consider $7.99 | 50% | 60% | Conditional commercial fit, not checkout conversion and not measured willingness to pay. A survey can inform intent; purchase/renewal is stronger evidence. |

| Calculated opportunity | Conservative | Base |
| --- | ---: | ---: |
| Potential pair-equivalents before recurring-need filter | 10,425,000 | 13,900,000 |
| TAM: potential households with recurring job | 2,606,250 | 5,560,000 |
| TAM annualized opportunity, 100% paid penetration | $249,887,250 | $533,092,800 |
| SAM: initially serviceable commercial-fit households | 260,625 | 1,000,800 |
| SAM annualized opportunity, 100% paid penetration | $24,988,725 | $95,956,704 |

Slide rounding: **illustrative TAM $250m–$533m; illustrative SAM $25m–$96m**, always with “scenario, not measured demand.” The unpublished commercial backend is a prerequisite: SAM describes the intended operable service, not today's paying capacity of the demo. Even the conservative scenario may overstate demand if cooperation or willingness to pay is much lower. With no willingness to pay, the monetizable market is zero.

Sensitivity: halving r halves both TAM and SAM; halving b or w halves SAM. If, instead of the broad anchor plus r, one starts solely with the narrower **2.6m SIPP in-kind recipients** and applies k/f/b/w, results become **195,000–468,000** potential households ($18.70m–$44.87m annualized). This is an alternative scoped scenario, not a merged survey estimate or a guaranteed lower bound; in-kind gifts still do not prove repeated demand.

### SOM: first 12 months after a commercially operable launch

SOM is acquisition-capacity-based, not “we will get 1% of TAM.” No launch date or available pipeline is assumed. All volumes below are H and exclude today's demo visitors. Start from zero paid households.

| Monthly acquisition funnel H | Conservative | Base |
| --- | ---: | ---: |
| Qualified first-parent visits from content/referrals | 1,000 | 2,000 |
| Visit → trial | 10% | 15% |
| Trial → both adults complete a first shared cycle | 40% | 50% |
| Activated pair → first paid month | 25% | 20% |
| New paid households/month, a (C) | 10 | 30 |
| Total trial → paid (C) | 10% | 10% |
| Total visit → paid (C) | 1% | 1.5% |

The conditional paid rate is lower in the broader base funnel; rates are not copied from install-to-paid benchmarks. Count one purchasing pair once, deduplicate repeat visitors and avoid counting the second parent's visit as another prospect. Trial conversion is evaluated after the 14-day trial and follow-up; the simplified revenue model starts when a cohort first pays. A realistic ramp or delayed traffic would reduce first-year results.

For monthly churn c, acquisitions at the beginning of each monthly billing period, no expansion/reactivation, and `N0=0`:

`Nt = (1−c) × N(t−1) + a`

`N12 = a × [1−(1−c)^12] / c`

`Year-one gross subscription revenue = P × sum(N1 ... N12)`

| Calculated 12-month result | Conservative (c=20%) | Base (c=12%) |
| --- | ---: | ---: |
| New paid acquisitions in year | 120 | 360 |
| Active paid households at month 12 | 46.56 (~47) | 196.08 (~196) |
| SOM as share of scenario SAM | 0.0179% | 0.0196% |
| Month-12 MRR | $372.05 | $1,566.70 |
| Month-12 annualized run rate (ARR) | $4,464.56 | $18,800.36 |
| Year-one gross subscription revenue | $3,305.81 | $12,480.89 |

Fractional households are expected values; tables use unrounded values. ARR is a point-in-time annualization, not revenue collected during the year. A free-trial household contributes zero MRR.

### What $100m ARR actually requires

`ceil($100,000,000 / $95.88) = 1,042,971 simultaneously active paying households.`

This is **400.2% of conservative SAM and 104.2% of base SAM**. Consequently, the current narrow-segment assumptions cannot support $100m ARR at $7.99, even at full penetration. Capturing all SAM is itself unrealistic. The number is a scale requirement, not a promised destination. Broader eligible segments, additional geographies or a different proven revenue model would need separate validation; none is counted here. Increasing the price cannot be assumed to leave demand unchanged.

Revenue illustration at stable active counts: 100 households = $799 MRR/$9,588 ARR; 1,000 = $7,990/$95,880; 10,000 = $79,900/$958,800. No such customer counts exist as verified project evidence.

## 5. Benchmarks and transfer limits

| External benchmark | Publication/data scope | How it is used |
| --- | --- | --- |
| RevenueCat 2026: monthly-plan year-one retention typically 6–14% across category medians; first monthly renewal 53–61% in its overview | Target data year 2025, with older cohorts where needed; 115,000+ RevenueCat-integrated apps, $16bn+ revenue, minimum activity thresholds [S3] | A warning against assuming durable retention. Not a US co-parenting-web cohort or a startup success probability. |
| Adapty 2026: displayed global/all-category trial → paid 27.8% | 2025 data; 16,000+ apps, $3bn+ revenue; predominantly Apple App Store. App-level aggregation and insufficient-data exclusions [S4] | Broad context only. Card requirements, platforms, populations and funnel stages differ from our card-free, two-parent web trial. No US 25–45 cohort is inferred. |
| WordStream/LocaliQ 2026: search CPC $5.42, CPL $66.69 | 13,474 US Google/Microsoft campaigns, 1 Apr 2025–31 Mar 2026; reported averages are medians [S5] | Paid-search stress input, not a quote for our keywords. A lead is not a paying household. |

These datasets are vendor-selected, established monetizing apps/campaigns and often broad industries; survival/selection bias matters. Do not combine a median CPC and another population's conversion rate and label the result observed CAC. Exact publication dates for the RevenueCat/Adapty annual web editions were not established; their edition and measurement years are shown instead.

## 6. Costs, margin, retention and LTV

One billed monthly household costs P=$7.99 before any tax added to the bill. The following are planned commercial-service allowances, **not costs of the free static demo**.

| Monthly per-active-household cost H | Conservative | Base | Rationale |
| --- | ---: | ---: | --- |
| Payment processing/billing allowance | 4% × P + $0.30 = $0.6196 | Same | For context only, US Stripe lists 2.9% + $0.30 domestic-card processing and separate pay-as-you-go Billing at 0.7% [S6, S7]. Rounded-up allowance is not a provider quote. |
| Refund/loss allowance | 1% × P = $0.0799 | Same | Untested allowance, not an observed refund rate; sensitivity can be material. |
| Hosting, receipt storage/delivery, auth/email | $0.40 | $0.20 | Placeholder variable budget; no production load test or usage invoice. |
| Variable support | $1.50 | $0.50 | At an assumed $25/hour loaded cost: 3.6 versus 1.2 minutes per household/month. Test with both adults' requests. |
| Other variable operating allowance | $0.25 | $0.25 | Placeholder; not a complete risk reserve. |
| Contribution CM (C), before acquisition/fixed costs | **$5.1405** | **$6.3405** | P minus all rows above. |
| Contribution margin / P (C) | 64.34% | 79.36% | Not net profit margin. |

Provider availability for the business's jurisdiction, taxes, cross-border fees and chargeback exposure remain unknown. Stripe was read solely as a public fee reference; no account, integration, card, transaction or subscription was created. Fixed engineering, legal/compliance, security, base infrastructure, owner compensation and taxes are excluded from CM. Unit allowances may be too low, particularly support and storage.

Use **household subscription churn**, not parent-account churn or DAU. `c = lost paying households / paying households at the beginning of the period`, excluding new additions. Separate voluntary and failed-payment churn in real measurement.

Under the deliberately simplified constant-churn model:

`R(m) = (1−c)^m` (survival through m renewals)

`Expected paid months = 1/c`

`Revenue LTV = P/c; contribution LTV = CM/c`

`Contribution LTV over first 12 billed months = CM × [1−(1−c)^12]/c`

The initial paid month is included in LTV; twelve renewals and twelve billed months have different endpoints. There is no discounting, reactivation, price growth or upsell. Real LTV should use `sum(CM_t × cohort survival_t)` and a finite horizon; `CM/c` is unreliable with small or changing cohorts.

| H/C | Conservative | Base |
| --- | ---: | ---: |
| Monthly churn H | 20% | 12% |
| Implied renewal each month C | 80% | 88% |
| Survival through 6 renewals C | 26.21% | 46.44% |
| Survival through 12 renewals C | 6.87% | 21.57% |
| Expected paid months C | 5.00 | 8.33 |
| Revenue LTV C | $39.95 | $66.58 |
| Contribution LTV C | **$25.70** | **$52.84** |
| Contribution LTV, first 12 billed months C | $23.94 | $41.44 |

Base retention is a **stretch operating hypothesis**, above broad app medians; recurrent shared obligations are a reason to test it, not evidence it will happen. Even the conservative constant hazard overstates the benchmark's first renewal. To expose this problem, a separate stress case assumes **57% first renewal** (illustrative within the reported range), then 88% each later renewal: lifetime contribution becomes `6.3405 × (1 + 0.57/0.12) = $36.46`; survival through 12 renewals becomes **13.97%**. Do not claim 88% first renewal as a public benchmark.

## 7. CAC by channel and economic feasibility

`CAC = (attributable acquisition cash + valued acquisition labor + allocated tools/creative) / new first-paying households`. Match costs to their conversion cohort; do not count free trials, leads, duplicate parents or test unlocks as customers.

| Channel | Conservative hypothesis → CAC | Base hypothesis → CAC | What the number establishes |
| --- | --- | --- | --- |
| Opt-in referrals/community partnerships | $225 allocated effort/cost ÷ 5 new payers = **$45** | $300 ÷ 15 = **$20** | No partnerships, outreach permissions or referral pipeline are established. Budget includes labor valued at $25/hour; unpaid founder work is not free. |
| Helpful content/organic search | $300 ÷ 5 = **$60** | $450 ÷ 15 = **$30** | Work and conversion volume assumptions; search ranking, timing and attribution unverified. |
| Paid search | $5.42 CPC ÷ 1% click→paid + $20 overhead/payer = **$562** | $5.42 ÷ 2% + $10 = **$281** | CPC from S5; conversion and overhead are H. Does not use CPL as CAC. |
| Paid social | $1.50 CPC ÷ 0.5% click→paid + $20 = **$320** | $1.00 ÷ 1% + $10 = **$110** | All inputs H; no sourced co-parenting-social CAC benchmark or campaign result. |

These paid-channel conversion rates refer to the full click-to-first-payment journey, including the second parent's participation. They are separate test scenarios from the organic/referral funnel in section 4. No paid campaigns or messages were run.

For the SOM model, only a **50/50 mix of acquired payers from referrals and organic** is assumed. The monthly budgets are $525/$750, consistent with 10/30 new payers. Blended CAC is **$52.50 conservative / $25.00 base**. Producing the assumed 1,000/2,000 qualified visits from those budgets is unproven; this is a capacity goal, not free traffic.

| Economics C | Conservative | Base |
| --- | ---: | ---: |
| Blended contribution LTV/CAC | 0.49× | 2.11× |
| Simple payback = CAC/CM, ignoring churn | 10.21 months | 3.94 months |
| Cohort-aware expected payback | Never under these assumptions: LTV < CAC | 6 billed months, using cumulative surviving contribution |
| Year-one acquisition budget | $6,300 | $9,000 |
| Year-one contribution after acquisition, before fixed costs | **−$4,173.15** | **+$904.27** |

Both paid channels have CAC above LTV in both scenarios. Base referral LTV/CAC is 2.64×; organic is 1.76×. Base economics exceed 1× but do not establish a resilient business: the front-loaded renewal stress reduces blended LTV/CAC to **1.46×**. An illustrative additional $500/month fixed budget changes base year-one contribution to **−$5,095.73**. Profitability is not established.

The familiar 3× LTV/CAC rule is used only as an internal cushion, not an organizer requirement or universal industry fact. Base 3× target CAC is **$17.61**. At 2% click-to-paid, base break-even ad CPC before overhead is only **$1.06**, versus the broad $5.42 search benchmark. Do not scale acquisition on unmeasured renewal assumptions.

## 8. Sensitivity: which assumptions matter

Hold base CM=$6.3405 and CAC=$25 fixed; change only churn. These rows are scenarios, not reported benchmarks.

| Monthly churn | Survival through 12 renewals | Contribution LTV | LTV/CAC | CAC ceiling at 3× |
| --- | ---: | ---: | ---: | ---: |
| 5% | 54.04% | $126.81 | 5.07× | $42.27 |
| 8% | 36.77% | $79.26 | 3.17× | $26.42 |
| 12% | 21.57% | $52.84 | 2.11× | $17.61 |
| 20% | 6.87% | $31.70 | 1.27× | $10.57 |

The 20% sensitivity row retains base costs; it is therefore different from the conservative case, whose support costs are higher. Lower-churn rows are aspirational, not validated.

- Halving conversion doubles CAC at fixed spend and halves new acquisitions. It is not fixed by a large TAM.
- Halving the second-parent activation rate halves funnel output even if first-parent trial starts are unchanged.
- Another $1 monthly support cost lowers base contribution LTV to **$44.50**.
- A higher price raises revenue per subscriber only if acquisition and retention hold; no evidence yet establishes that elasticity.
- If demographic/cooperation filters shrink, the $100m scale requirement becomes less plausible. Market size cannot compensate for CAC above lifetime contribution.

## 9. Why a household might renew, and what to measure

The retention hypothesis is a repeated practical job: new school/medical/activity expenses, unresolved shares, partial reimbursements and a useful history. Local guest persistence supports returning to a demonstration; it is not observed subscription renewal or secure cloud backup. Future plans may create a reason to return but are not current debt. Existing records should remain usable after a creation limit; retention should come from continuing usefulness.

Before asserting economics, measure consenting eligible households as cohorts: trial start; both adults activate; first agreed expense; first recipient-confirmed reimbursement; second distinct expense cycle within 30 days; declared price choice; and, only in a separately authorized commercial phase, successful first payment and renewal at months 1/3/6. Record denominators, channel, first-payment date, refunds, churn reason and support minutes. Survey willingness is intent; demo completion is usability evidence; neither is revenue. The current task authorized neither outreach nor payment collection, and none was performed.

## 10. Alternatives verified on official sites

Prices are the displayed US/USD web offers checked on 15 November 2026, before applicable taxes, promotions or hardship/military discounts. Vendor features below are advertised capabilities, not hands-on test results. Monthly equivalents of annual plans are not monthly-billing offers.

| Alternative | Verified price/unit | Relevant advertised capabilities | Comparison boundary |
| --- | --- | --- | --- |
| **OurFamilyWizard** [S8, S9] | Entry $110/year **per parent**; Essentials $149.99/year per parent. Two entry subscriptions = $220/year (~$18.33/month combined), C. | Receipts, categories and percentage splits, partial/outside-payment recording, expense reports; OFWpay options depend on plan. | Broader established suite. Our expense workflow is not category invention; entry pricing is not a claim all add-ons are included. |
| **AppClose** [S10, S11] | US web $7.99/month per account; $83.88/year prepaid. Two monthly accounts = $15.98/month, C; other parent needs an active subscription. | Expense categories, receipts, reimbursement requests and approvals/denials, integrated ipayou payments. | Has web access; do not portray it as native-only or free. Same headline number as ours, different billing unit. |
| **TalkingParents** [S12] | Listed monthly tiers $7/$16/$32; co-parents can choose different plans. | Messaging, calendar and Accountable Payments; displayed payment fees 4%/3%/2% by tier. | Prices are plan prices, not a verified household bundle. Do not claim our demo transfers money or has equivalent record protections. |
| **2houses** [S13, S14] | **$169.99 every 12 months for the whole family** (~$14.17/month); both parents included. | Expense balances, categories, reports/CSV/PDF, calendar and messages. | Direct counterexample to “only we charge once for both parents.” Our possible advantage must be demonstrated focus/value, not invented uniqueness. |
| **Manual spreadsheet + messages** | $0 incremental software fee assumed when existing free tools suffice; this is a substitute hypothesis, not a price survey. | A family can manually maintain totals and share evidence. | Ask actual users what fails; do not assume they need a new paid service or that manual methods always fail. |

**Positioning hypothesis:** a focused browser workflow at one explicit household price may appeal to cooperative pairs who need expense reconciliation without a larger coordination suite. No superiority in trust, legal acceptance, security, time savings or conflict reduction has been established. CoParent Ledger currently lacks proven shared accounts/device sync and actual billing; competitor pricing does not prove willingness to pay for this demo.

## 11. Evidence needed and decision gates

| Unknown | Evidence to collect, without implying it exists | Decision impact |
| --- | --- | --- |
| Repeated problem and existing workaround | Genuine voluntary US interviews/survey; eligibility, sample size, selection limits, frequency, current tools, consent; aggregate results only | Replace r and narrow the segment. |
| Cooperation and trust | Two distinct consenting adults complete a shared cycle on a verified service | Replace b and the 40–50% activation hypotheses; demo role switching does not count. |
| Price acceptance | Explicit $7.99 offer feedback, then future authorized purchase/renewal evidence | Replace w, conversion and churn; intent remains weaker than payment. |
| Affordable acquisition | Cohort-attributed cash/labor cost per first-paying pair; no unsupported partnerships | Replace channel CAC before scaling. |
| Support/retention | Support time and cohort survival, including first renewal; sufficiently long follow-up | Replace CM and hazard profile rather than reporting theoretical LTV as actual. |

No survey responses were accessed in this pass. No source repository visibility, public-site deployment or application code was changed. The separate Q23 public-source conflict remains unresolved: the repository is required by the owner to remain private. This document is not evidence that every submission requirement is satisfied.

## 12. Short English text for the deck

**Problem and market:** “US Census counted 13.9 million custodial parents in its 2022-reference report. That is a population anchor, not a customer count. Our target is cooperative US co-parents with recurring shared expenses.” [S1]

**Market sizing:** “Our explicitly hypothetical filters imply a $250m–$533m annualized TAM and a $25m–$96m initial SAM at $7.99 per household. We have not measured willingness to pay; the initial 12-month acquisition scenarios end at approximately 47–196 paying households.”

**Monetization:** “The proposed subscription is $7.99 per month for both parents. The current paywall is test-only. Base modeled contribution LTV is $52.84 against $25 blended acquisition cost; a weaker-retention scenario fails. Broad paid search is not viable under these assumptions.”

**Retention:** “The reason to return is the next expense, outstanding reimbursement and shared history. We will evaluate repeat completed cycles and paid renewals, rather than treating daily visits as proof of value. Actual renewals are unmeasured.”

**Competition and scale:** “Existing services already track family expenses, and 2houses already charges per family. Our focus and household price are a positioning hypothesis. At today's price, $100m ARR needs 1.043 million active paid households—above our modeled initial SAM, so we do not claim a validated route to that scale.”

**Evidence footer:** “Working synthetic demo; no verified paid traction. Market, acquisition and retention scenarios are hypotheses. Sources checked 15 Nov 2026.”

## 13. Source register

All links below were opened or retrieved from the primary publisher on 15 November 2026. Access date is not publication date. Live vendor pages may change; recheck prices before presenting. No gated report download, contact form or mailing-list signup was used.

| ID | Source/link | Date, exact location and use |
| --- | --- | --- |
| S1 | US Census, [Custodial Parents and Their Child Support: 2022, P60-285](https://www2.census.gov/library/publications/2025/demo/p60-285.pdf); [publication page](https://www.census.gov/library/publications/2025/demo/p60-285.html) | August 2025 (page dated Aug 12); p.1 population definition, p.2 parent count, p.5 noncash support. Reference year 2022 / survey April 2023. |
| S2 | US Census, [Child Support Received: 2023, P70FS-214](https://www.census.gov/content/dam/Census/library/factsheets/2026/demo/p70fs-214.pdf) | January 2026; one-page factsheet; 2024 SIPP reference year 2023. Cash/in-kind recipient context. |
| S3 | RevenueCat, [State of Subscription Apps 2026](https://www.revenuecat.com/state-of-subscription-apps) | Methodology; “Retained subscribers after 1 year by plan duration”; “First 3 monthly subscription renewals by category.” Target data year 2025; some older cohorts. |
| S4 | Adapty, [State of In-App Subscriptions 2026](https://adapty.io/state-of-in-app-subscriptions-report/) | Opening methodology; “Conversion rates by user journey stage,” global/all-category default. Analysis covers 2025. |
| S5 | WordStream/LocaliQ, [Google Ads Benchmarks 2026](https://www.wordstream.com/blog/2026-google-ads-benchmarks) | CPC/CPL sections and “About the data”; campaign period Apr 2025–Mar 2026. Broad medians, not household paid acquisition. |
| S6 | Stripe, [US standard payments pricing](https://stripe.com/pricing) | Current domestic-card rate. No business eligibility or provider integration is inferred. |
| S7 | Stripe, [Billing pricing](https://stripe.com/billing/pricing) | Current pay-as-you-go Billing rate, separate from processing. |
| S8 | OurFamilyWizard, [Plans and pricing](https://www.ourfamilywizard.com/plans-and-pricing) | One-year prices and FAQ on separate parent subscriptions. Page publication date unspecified. |
| S9 | OurFamilyWizard, [Expense log](https://www.ourfamilywizard.com/product-features/expense-log) | Categories/splits, receipts, reports and payment FAQ. Date unspecified. |
| S10 | AppClose, [Pricing](https://appclose.com/pricing/) | Web/annual pricing and expense/request features. Date unspecified. |
| S11 | AppClose, [Subscription and fee-waiver FAQ](https://support.appclose.com/hc/en-us/articles/45803225192091-AppClose-Subscription-Fee-Waiver-Frequently-Asked-Questions) | Updated 9 July 2026; US price row and “Does my subscription apply to the entire Circle or only to me?” |
| S12 | TalkingParents, [Pricing](https://talkingparents.com/pricing) and [FAQ](https://talkingparents.com/faqs) | Monthly tiers, Accountable Payments fees and different-plan FAQ. Date unspecified; no household-bundle claim. |
| S13 | 2houses, [Pricing](https://www.2houses.com/en/pricing) | Displayed USD annual price and whole-family coverage. Page date unspecified. |
| S14 | 2houses, [Features](https://www.2houses.com/en/features) | Finance categories, balance, reports/exports and wider tools. Date unspecified. |

## 14. Verification record

The scenario arithmetic was executed independently with JavaScript, including market filters, the 12-step acquisition/churn recurrence, geometric LTV, sensitivity and $100m rounding. A subsequent verification passed **18 arithmetic assertions**, including agreement between the monthly recurrence and closed-form count, revenue, contribution after acquisition, first-renewal stress and cohort-aware payback. No product tests were rerun for this documentation-only task; previous 62-test results belong to the dated QA report. Source access failures and evidence limitations are stated above. Existing unrelated local changes were preserved. No fabricated customers, payments, responses or market observations were introduced.
