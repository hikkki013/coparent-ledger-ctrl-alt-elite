# CoParent Ledger

A web MVP for two co-parents to record a child expense, propose a share, agree or object, report an external partial reimbursement, and confirm receipt before reducing the remaining amount.

**Source is saved in the private repository https://github.com/hikkki013/coparent-ledger. This is not yet a verified deployed multiuser service.** The implementation, tests, migrations and documentation were uploaded through the owner's browser account. See `docs/STATUS.md` and `docs/QA_REPORT.md` for verification evidence and remaining integration limits. Only the empty `.env.example` template is included; no real `.env` or credentials are uploaded.

## Competition readiness

The organizer FAQ was reviewed after implementation. The idea fits the Money/B2C/web brief, but the current project is **not ready for submission**: a working paywall and English PDF deck (at most 10 slides) are still missing; the deployed guest demo is available below. The competition also requires public source at submission; this working repository remains **private by the user's explicit instruction**. See [the FAQ evidence matrix](docs/CRITERIA_MATRIX.md) for exact question references and remaining work.

A publicly hosted guest demo with real input-dependent calculations and local storage is permitted by the FAQ. It still needs end-to-end browser verification and must not be represented as a deployed real-account service. Real charges and invitation emails remain disabled.

## Prepare the Cloudflare Pages demo

With Node.js 24 or newer, run `npm run demo:pages`. Upload the resulting `dist-pages` folder, or a ZIP containing its `index.html` at the archive root, using Cloudflare Pages Direct Upload. This is a self-contained synthetic demo, not the React application or the real-account backend. Inspect the upload contents before publishing. Cloudflare Direct Upload projects cannot later switch to Git integration; creating a separate Git-integrated project would be required for automatic deployments.

Public synthetic demo: https://coparent-ledger-demo.pages.dev/ . It opens without registration. Cloudflare Pages Direct Upload deploys only the generated page, not the repository or the authenticated backend. For updates, rebuild and create a new production deployment in the same Cloudflare project; the project URL is intended to remain the same, and should be rechecked after each update. The demo stores changes only in the current browser tab; guest data does not synchronize between devices.

The published HTTPS demo was tested with a new $73.25 expense and a 60% proposed share: $43.95 agreed; $12.50 reported left $43.95 remaining; confirmation changed remaining to $31.45 and recorded history. The result survived a page refresh in the same tab. An independently opened tab loaded the site without login and had its own separate demo state. Layout and selected interactions were checked at 375×812 and 1280×800 browser viewport sizes, not on a physical phone. The demo does not prove a shared multiuser service.

## Run the synthetic demo without installing packages

Requires Node.js 24 or newer. From this repository:

```sh
npm run demo:standalone
```

Open `dist-demo/coparent-demo.html` in a current browser. This file embeds its JavaScript, styles and sample receipt. No server or network is required. If the browser does not permit sessionStorage on local files, serve the same demo on a development machine:

```sh
npm run demo
```

Then open http://127.0.0.1:4173/demo. Only the synthetic `/demo` route exists on this fallback server. `/app` is deliberately absent. Alex and Jordan are sample identities, not signed-in accounts. Demo data is isolated in one sessionStorage key and accepts only built-in SAMPLE receipts. `Start clean` and `Load examples` replace only that tab's synthetic data.

The standalone browser interface uses the same TypeScript domain and DemoLedger as React. It is an additional fallback UI, not proof of shared backend behavior. Browser execution/layout could not be verified in the restricted build session.

## Run the React application

```sh
npm install
cp .env.example .env
npm run dev
```

PowerShell: use `Copy-Item .env.example .env` instead of `cp` if preferred. Open the printed local Vite URL. Configure `VITE_SUPABASE_URL` and the public `VITE_SUPABASE_ANON_KEY` in `.env` for real accounts. Never put a service-role key in frontend configuration.

Routes: `/`, `/pricing`, `/login`, `/invite/:token`, `/app`, `/app/expenses/:id`, `/demo`. Missing backend configuration shows an explicit unavailable screen for real accounts; it never silently substitutes a demo account.

`npm install` was blocked by registry DNS/network restrictions in this session; a dependency lockfile could not be generated. Run installation and commit its real `package-lock.json` before a reproducible release. The React source passed a semantic TypeScript check with an installed official compiler and official React declarations, but Vite production build remains unverified.

## Connect the backend

Use a **dedicated Supabase test project** first. Full commands, RPC contracts and secrets are documented in `supabase/README.md`.

1. Enable email confirmation in Supabase Auth. Add your frontend origin and `/app` plus `/invite/**` confirmation redirects to its allowlist. Use precise production domains.
2. Link the intended project using Supabase CLI, then apply `supabase/migrations/202611140001_ledger.sql` with `supabase db push`.
3. Deploy `receipt-upload` and `receipt-access`; set `ALLOWED_ORIGINS` to your exact frontend origins, including the actual dev hostname/port.
4. Set the two public frontend environment values. Restart Vite.
5. Create two test accounts with separate sessions. Parent A creates a household and a child alias, then copies an email-bound invite link. Parent B signs in with the verified invited email and accepts it. No invitation emails are sent by this application.
6. Complete the whole expense/reimbursement flow and run the live integration harness before real family use.

## Checks

```sh
npm test
npm run check
npm run build
npm run test:integration
```

- `npm test`: dependency-free Node tests for domain/demo, transport mapping and receipt-handler behavior.
- `npm run check`: semantic source check using installed TypeScript/React types. Optional `TYPESCRIPT_PATH` and `TYPECHECK_DEPS` support an existing official compiler/types without changing the application.
- `npm run build`: actual TypeScript + Vite production build; requires installed dependencies.
- `npm run test:integration`: real Supabase checks. Missing test credentials exits with `BLOCKED`, never a passing placeholder. Requires the four `SUPABASE_TEST_*` variables documented in `supabase/README.md`. It creates only synthetic test accounts and leaves its test fixtures for inspection.

For browser tests, start the React app or standalone server separately, install Playwright's Chromium when dependencies/network are available, then run `npm run test:e2e`. `PLAYWRIGHT_BASE_URL` selects the server. These browser checks were prepared, not executed in this session.

The SQL harness can also run on disposable PostgreSQL binaries without a socket; see `supabase/README.md`. Its single-user mode **bypasses RLS**, so SQL success there is not a passing RLS/concurrency test.

## Financial rules

- Integer USD cents and exact half-up division of the other parent's basis-point share.
- Agreed balances include only APPROVED expenses; both directions stay separate.
- PENDING payment reports reserve capacity but do not reduce the remaining amount.
- Only the actual recipient confirms receipt; confirmation reduces the remaining amount once.
- Approval freezes an expense permanently in this MVP. An unapproved submitted correction withdraws the original and creates a private draft with a new ID and no receipt.
- Server commands enforce identity, membership, transitions, revisions and idempotency atomically with history.
- Receipts use private Storage and authorized signed URLs lasting at most 60 seconds.

Example: `$120.01 × 40% = $48.00`. Reporting `$20.00` leaves `$48.00` remaining with `$20.00` pending. Confirming receipt leaves `$28.00` remaining. The separate examples dataset also includes a pending `$10.00` report; do not confuse the datasets.

## Current limits

No money movement, billing, OCR, AI, real-person invitations, custody calendar, chat, PDF export or claims of legal enforceability. Pricing is a `$7.99/month per household` hypothesis; billing is disabled. One household/user, two adults, three child aliases, USD only. No correction/refund workflow for an approved expense or confirmed reimbursement. No account/member deletion or operational retention/backup/recovery tooling yet.

Auth callbacks, native RLS/grants, concurrent live transactions, real private Storage/Edge deployment, Vite build and browser layout require normal-environment verification. Local demo and isolated SQL tests do not establish production readiness.

Source of truth: `docs/DEVELOPMENT_PROMPTS.txt` (PROMPT 00–07), `docs/PRODUCT_SPEC.md`, shared types in `src/domain/types.ts`, and `src/data/ledger-port.ts`.
