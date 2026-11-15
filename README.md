# CoParent Ledger

**A Money / B2C project by Ctrl Alt Elite**

[Open the guest demo](https://coparent-ledger-demo.pages.dev/) · [English pitch PDF](docs/presentation/CoParent_Ledger_Jury_Deck_Submission.pdf) · [QA report](docs/QA_REPORT.md) · [Status and limitations](docs/STATUS.md)

CoParent Ledger helps parents living apart keep a child's expense, the proposed share, their agreement, reimbursements and the remaining balance in one traceable record. The initial target is US co-parents aged 25–45 who need to coordinate recurring child-related costs. Audience fit and willingness to pay are hypotheses, not measured customer results.

The proposed subscription is **$7.99 per month per household, both parents included**, for maintaining expense records, agreements, reimbursement history and an explainable balance. The demo paywall is a simulation: no card, payment or paid subscription is connected.

## Try it as a judge

The [demo](https://coparent-ledger-demo.pages.dev/) needs no registration. Use synthetic amounts and names only. The two demo roles run in **one browser**; they are not independent shared accounts.

1. As Alex, choose **Add expense**, enter your own amount, child, category and other parent's percentage, then save and **Send for review**. A receipt is optional; the built-in sample is synthetic.
2. Switch **Viewing as** to Jordan, open the expense and **Agree to this share**.
3. Still as Jordan, use **Record external payment** with a test amount. The remaining balance does not decrease while the report awaits confirmation.
4. Switch to Alex, open the expense and select **I received this payment**. The confirmed amount reduces the remaining balance and both actions appear in History.
5. Refresh in the same browser to return to the saved records. For example, $100 at 50% leaves $50 agreed; reporting $20 keeps $50 remaining, and confirming it leaves $30.

To see the paywall, select **Simulate end of trial**, then **Add expense**. Select **Enable test access — no payment** to continue; nothing is charged. Existing records and confirmations remain accessible after expiry.

Guest records are stored in this browser on this device. They do not sync to another browser or device and may be lost if browser data is cleared. This is not a secure backup. **Start clean** and **Load examples** replace the current browser's saved demo records after confirmation.

## Run, test and publish

Node.js 24 or newer is required. The synthetic demo and Node test suite do not require the React/Vite dependencies.

```bash
npm run demo          # local guest demo: http://127.0.0.1:4173/demo
npm test              # domain, demo and transport unit tests
npm run demo:pages    # build dist-pages/index.html for Cloudflare Pages
```

The existing `coparent-ledger-demo` Pages project uses **Direct Upload**, so a GitHub commit does not deploy the site. Upload only the checked `dist-pages` output to that existing project, then verify the production URL. Do not upload `.env`, credentials, real receipts, browser data, dependencies or Git metadata. For the separate React/backend implementation, setup and integration prerequisites are in [supabase/README.md](supabase/README.md).

## Evidence and limitations

- On 15 November 2026, the Node suite passed 65 tests and the Pages build succeeded in the recorded correction-fix run. See [QA](docs/QA_REPORT.md) and [final sync report](docs/FINAL_SYNC_REPORT.md) for the scope and earlier results.
- A fresh production demo check used a synthetic $100 purchase, a $50 agreed share and a $20 report: $50 remained pending and $30 after confirmation; the result and history survived refresh. The paywall opened and test access was enabled without a card.
- The guest demo does not provide real payments, bank verification, cloud backup, cross-device sync or authenticated shared parent accounts. React build/browser checks and live Supabase integration require dependencies and a dedicated test environment and have not been verified in this pass.
- The repository's visibility and unauthenticated source access must be checked separately before submission. See [README review](docs/README_REVIEW_REPORT.md).

[Product specification](docs/PRODUCT_SPEC.md) · [Criteria matrix](docs/CRITERIA_MATRIX.md) · [Market assumptions](docs/MARKET_AND_ECONOMICS.md) · [Historical sync evidence](docs/FINAL_SYNC_REPORT.md)
