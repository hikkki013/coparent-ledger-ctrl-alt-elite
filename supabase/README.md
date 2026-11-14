# Backend setup and verification

The migration implements the shared camelCase contract in `docs/CONTRACTS.md`. The browser has SELECT-only table grants and RLS; financial writes go through transactional RPC. It never receives a service role key.

## Apply to a Supabase test project

Use the Supabase CLI in a trusted development environment, link the intended **test** project, then run `supabase db push`. Deploy `receipt-upload` and `receipt-access`. Set the Edge secret `ALLOWED_ORIGINS` to a comma-separated list of exact frontend origins (default: `http://localhost:5173`). Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to hosted functions. Do not put the latter in `VITE_*`, frontend files, logs, or command-line arguments.

The function config disables the gateway's legacy JWT check because each handler independently verifies the supplied bearer against Auth `/auth/v1/user`. An absent or invalid session is rejected before database or Storage access. Enable email confirmation in Supabase Auth: invitation acceptance requires a currently verified matching email. Invitation links are copied manually; the application does not send invitation messages.

## Public contract

| Transport | Request | Result |
| --- | --- | --- |
| RPC `ledger_read` | `p_operation`: `getContext`, `listChildren`, `listExpenses`, `getExpense`; `p_id`: UUID or null | Corresponding shared type |
| RPC `ledger_command` | `p_operation`, `p_payload` JSON object, `p_expected_revision` integer or null, `p_idempotency_key` string | Context/Child for setup; ExpenseDetail for financial commands |
| RPC `ledger_create_invite` | `p_email`, `p_base_url` (origin only) | `{url, expiresAt}`; URL returned only once |
| POST `receipt-upload` | Bearer + multipart `draftId`, `expectedRevision`, `idempotencyKey`, `file` | ExpenseDetail |
| POST `receipt-access` | Bearer + JSON `{receiptId}` | `{url, expiresAt}` with 60-second signed token |

All financial command names and payload keys match `LedgerPort`. `resolveReimbursement.expectedRevision` is the parent expense revision. Successful retries must preserve the original key, payload and expected revision; they return the original response before a stale-revision check. Receipt retry fingerprints use the file SHA-256, type, size, draft ID and expected revision, not the newly generated Storage path.

Internal service-only RPC signatures:

- `ledger_receipt_preflight(p_actor_id uuid, p_draft_id uuid)` → `{ok:true}`.
- `ledger_receipt_finalize(p_actor_id uuid, p_draft_id uuid, p_expected_revision integer, p_idempotency_key text, p_receipt_id uuid, p_object_path text, p_mime_type text, p_size_bytes integer, p_sha256 text)` → ExpenseDetail.
- `ledger_receipt_lookup(p_actor_id uuid, p_receipt_id uuid)` → `{objectPath,mimeType}`.

Only the verified Auth response supplies `p_actor_id`. Finalization rechecks owner, DRAFT and revision under the expense lock. Submitted expenses retain their receipt forever within this MVP. A corrected draft starts without a receipt. All direct browser access to the `receipts` bucket is denied, including upload, overwrite, deletion and listing; authorized links are issued by the Edge endpoint.

Text limits match the shared domain: alias 60, description 500, merchant 200, method label 100, reason/note 1000 characters; empty descriptions/reasons when required are rejected. Unknown command/draft payload keys are rejected. Amounts are integer USD cents in 1..100000000; share is 0..10000 basis points. Reimbursement audit events contain `reimbursementId`.

## Run checks

Offline Edge behavior and signature checks:

```sh
node --test tests/integration/receipt-validation.test.ts
```

Full live integration, including concurrent HTTP commands and real Storage:

```sh
node tests/integration/supabase.integration.mjs
```

Required environment variables: `SUPABASE_TEST_URL`, `SUPABASE_TEST_ANON_KEY`, `SUPABASE_TEST_SERVICE_ROLE_KEY`, `SUPABASE_TEST_ALLOW_MUTATION=yes`. Use a dedicated disposable test project with the migration and Edge functions deployed. The harness creates three verified synthetic `@example.invalid` accounts without sending email and leaves its prefixed fixtures for inspection. It never resets or deletes other families. Missing environment is **BLOCKED**, with a nonzero exit; it is not a passing integration run.

Native SQL checks against an ordinary migrated test PostgreSQL/Supabase connection (fixtures roll back):

```sh
psql -X -v ON_ERROR_STOP=1 "$TEST_DATABASE_URL" -f tests/integration/ledger.sql
psql -X -v ON_ERROR_STOP=1 "$TEST_DATABASE_URL" -f tests/integration/receipt-storage.sql
psql -X -v ON_ERROR_STOP=1 "$TEST_DATABASE_URL" -f tests/integration/invitations.sql
```

Use a test database-owner connection because these files create synthetic auth rows inside a transaction. Their application commands then run with the authenticated role. They do not send messages or manipulate existing accounts.

If only vanilla PostgreSQL binaries are available, initialize a fresh disposable cluster, then apply `tests/integration/local-bootstrap.sql` **only to that empty cluster**, followed by the migration and SQL test files. Never apply that bootstrap to an actual Supabase database. `PG_BIN` configures the installed binary directory; `PG_TEST_DATA` identifies the disposable data directory:

```sh
node tests/integration/run-sql-single.mjs tests/integration/local-bootstrap.sql supabase/migrations/202611140001_ledger.sql tests/integration/ledger.sql tests/integration/receipt-storage.sql tests/integration/invitations.sql
```

This socket-free fallback executes real PostgreSQL SQL/RPC code, but PostgreSQL single-user mode has implicit superuser privileges. It **cannot verify native RLS/grants or concurrent transactions**. The runner announces that limitation and the SQL skips only those checks. A successful fallback must not be reported as passing live Supabase integration.

## Storage/transaction boundary and current limits

Storage uploads and Postgres cannot commit together. The upload is written under a fresh random path, then finalization atomically links it, increments the expense revision, records history and stores the replay result. A known SQL refusal cleans only this invocation's fresh object. A network failure after finalization may follow a committed transaction, so the handler preserves the object; the next identical request is safe to retry. An uncertain result may leave an unreferenced object.

To inspect cleanup candidates as an administrator, list `storage.objects` in the receipts bucket older than 24 hours whose path is absent from the currently attached `expenses.receipt_id → receipts.object_path` relation. Review candidates before deleting anything; never remove a currently referenced object. There is no client reset or cleanup RPC.

Signed links are temporary bearer access and must not be logged. Expiration and cache behavior do not promise immediate revocation. Upload validation checks type signatures and size; it is not malware scanning or content sanitization. Real family use also requires tested backups/restoration, retention/deletion procedures, abuse limits and account recovery. This implementation has no money movement, billing, account/member deletion, or correction of an already approved expense or confirmed reimbursement.
