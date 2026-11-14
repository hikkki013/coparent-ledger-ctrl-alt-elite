-- psql -X -v ON_ERROR_STOP=1 "$TEST_DATABASE_URL" -f tests/integration/receipt-storage.sql
-- Synthetic metadata only: no real files, users, or existing records are changed.
-- All fixtures, policies, and test helpers disappear at the final ROLLBACK.
begin;
create schema coparent_receipt_test;
create function coparent_receipt_test.assert_true(condition boolean, label text) returns void language plpgsql as $$
begin
  if condition is distinct from true then raise exception 'ASSERTION FAILED: %',label; end if;
end $$;
create function coparent_receipt_test.expect_error(statement text, expected text) returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if position(expected in sqlerrm)>0 then return; end if;
    raise exception 'Expected %, got %',expected,sqlerrm;
  end;
  raise exception 'Expected failure: %',expected;
end $$;
create function coparent_receipt_test.expect_no_write(statement text, label text) returns void language plpgsql as $$
declare affected bigint;
begin
  begin
    execute statement;
    get diagnostics affected = row_count;
  exception when insufficient_privilege then
    return;
  end;
  if affected<>0 then raise exception 'ASSERTION FAILED: % changed % rows',label,affected; end if;
end $$;
grant usage on schema coparent_receipt_test to authenticated,service_role;
grant execute on all functions in schema coparent_receipt_test to authenticated,service_role;

insert into auth.users(id,email,email_confirmed_at) values
 ('20000000-0000-4000-8000-000000000001','coparent-receipt-a@example.invalid',now()),
 ('20000000-0000-4000-8000-000000000002','coparent-receipt-b@example.invalid',now());

do $test$
declare
 v_a uuid='20000000-0000-4000-8000-000000000001';
 v_b uuid='20000000-0000-4000-8000-000000000002';
 v_receipt uuid=gen_random_uuid(); v_replay_receipt uuid=gen_random_uuid(); v_late_receipt uuid=gen_random_uuid(); v_private_receipt uuid=gen_random_uuid();
 v_path text=gen_random_uuid()::text||'.png'; v_replay_path text=gen_random_uuid()::text||'.png'; v_late_path text=gen_random_uuid()::text||'.png'; v_private_path text=gen_random_uuid()::text||'.png';
 v_hash text=repeat('a',64); v_changed_hash text=repeat('b',64);
 v_invite jsonb; v_token text; v_child jsonb; v_input jsonb; v_draft jsonb; v_original_upload jsonb; v_result jsonb; v_submitted jsonb; v_corrected jsonb; v_withdrawn jsonb;
 v_expense uuid; v_corrected_expense uuid; v_original_revision integer; v_revision integer; v_audit_count integer; v_rows integer; v_native_rls boolean;
begin
 perform set_config('request.jwt.claims',jsonb_build_object('sub',v_a,'role','authenticated')::text,true);
 perform set_config('role','authenticated',true);
 v_native_rls=row_security_active('public.expenses');
 if not v_native_rls then
   raise notice 'BLOCKED: native RLS/grants bypassed in single-user mode; direct RLS/grant/Storage assertions are skipped';
 end if;
 perform public.ledger_command('createHousehold','{}',null,'receipt-create-household');
 v_child=public.ledger_command('createChild','{"alias":"Child 1"}',null,'receipt-create-child');
 v_invite=public.ledger_create_invite('coparent-receipt-b@example.invalid','http://localhost:5173');
 v_token=regexp_replace(v_invite->>'url','^.*/','');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',v_b,'role','authenticated')::text,true);
 perform public.ledger_command('acceptInvite',jsonb_build_object('token',v_token),null,'receipt-accept-invite');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',v_a,'role','authenticated')::text,true);
 v_input=jsonb_build_object('childId',v_child->>'id','category','SCHOOL','description','SAMPLE receipt expense','merchant','SAMPLE store','expenseDate','2026-01-15','amountCents',12001,'reviewerShareBps',4000);
 v_draft=public.ledger_command('createDraft',jsonb_build_object('input',v_input),null,'receipt-create-draft');
 v_expense=(v_draft#>>'{expense,id}')::uuid;
 v_original_revision=(v_draft#>>'{expense,lockVersion}')::integer;
 v_audit_count=jsonb_array_length(v_draft->'audit');

 -- A browser cannot obtain the service-only RPC privilege, even for its own draft.
 perform coparent_receipt_test.expect_error(format('select public.ledger_receipt_preflight(%L,%L)',v_a,v_expense),'permission denied');
 perform coparent_receipt_test.expect_error(format('select public.ledger_receipt_lookup(%L,%L)',v_a,v_receipt),'permission denied');
 perform coparent_receipt_test.expect_error(format('select public.ledger_receipt_finalize(%L,%L,%s,%L,%L,%L,%L,68,%L)',v_a,v_expense,v_original_revision,'receipt-browser-spoof',v_receipt,v_path,'image/png',v_hash),'permission denied');
 -- Separately exercise the body guard with EXECUTE privilege but a non-service JWT.
 perform set_config('role','service_role',true);
 perform coparent_receipt_test.expect_error(format('select public.ledger_receipt_preflight(%L,%L)',v_a,v_expense),'FORBIDDEN');
 perform coparent_receipt_test.expect_error(format('select public.ledger_receipt_lookup(%L,%L)',v_a,v_receipt),'FORBIDDEN');
 perform coparent_receipt_test.expect_error(format('select public.ledger_receipt_finalize(%L,%L,%s,%L,%L,%L,%L,68,%L)',v_a,v_expense,v_original_revision,'receipt-browser-spoof',v_receipt,v_path,'image/png',v_hash),'FORBIDDEN');

 -- Storage metadata stands in for completed immutable uploads. There are no actual file bytes.
 perform set_config('role','postgres',true);
 insert into storage.objects(bucket_id,name,metadata) values
 ('receipts',v_path,'{"mimetype":"image/png","size":68}'::jsonb),
 ('receipts',v_replay_path,'{"mimetype":"image/png","size":68}'::jsonb),
 ('receipts',v_late_path,'{"mimetype":"image/png","size":68}'::jsonb),
 ('receipts',v_private_path,'{"mimetype":"image/png","size":68}'::jsonb);
 perform set_config('request.jwt.claims',jsonb_build_object('role','service_role')::text,true);
 perform set_config('role','service_role',true);
 perform coparent_receipt_test.assert_true(public.ledger_receipt_preflight(v_a,v_expense)='{"ok":true}'::jsonb,'owner preflight allowed');
 perform coparent_receipt_test.expect_error(format('select public.ledger_receipt_preflight(%L,%L)',v_b,v_expense),'FORBIDDEN');
 perform coparent_receipt_test.expect_error(format('select public.ledger_receipt_finalize(%L,%L,%s,%L,%L,%L,%L,68,%L)',v_b,v_expense,v_original_revision,'receipt-other-parent-upload',v_receipt,v_path,'image/png',v_hash),'FORBIDDEN');

 v_original_upload=public.ledger_receipt_finalize(v_a,v_expense,v_original_revision,'receipt-upload-original',v_receipt,v_path,'image/png',68,v_hash);
 v_revision=(v_original_upload#>>'{expense,lockVersion}')::integer;
 perform coparent_receipt_test.assert_true(v_revision=v_original_revision+1,'attachment increments expense revision once');
 perform coparent_receipt_test.assert_true(v_original_upload#>>'{expense,receiptId}'=v_receipt::text,'attachment points at the new receipt');
 perform coparent_receipt_test.assert_true(jsonb_array_length(v_original_upload->'audit')=v_audit_count+1,'attachment creates exactly one history event');
 perform coparent_receipt_test.assert_true(exists(select 1 from jsonb_array_elements(v_original_upload->'audit') item where item->>'action'='RECEIPT_ATTACHED' and item->>'actorId'=v_a::text),'attachment history has verified owner');
 perform coparent_receipt_test.assert_true(public.ledger_receipt_lookup(v_a,v_receipt)=jsonb_build_object('objectPath',v_path,'mimeType','image/png'),'owner can retrieve draft receipt metadata');
 perform coparent_receipt_test.expect_error(format('select public.ledger_receipt_lookup(%L,%L)',v_b,v_receipt),'FORBIDDEN');

 -- Replay ignores newly generated storage identifiers but requires identical semantic input.
 v_result=public.ledger_receipt_finalize(v_a,v_expense,v_original_revision,'receipt-upload-original',v_replay_receipt,v_replay_path,'image/png',68,v_hash);
 perform coparent_receipt_test.assert_true(v_result=v_original_upload,'receipt replay returns the exact original result before revision check');
 perform coparent_receipt_test.expect_error(format('select public.ledger_receipt_finalize(%L,%L,%s,%L,%L,%L,%L,68,%L)',v_a,v_expense,v_original_revision,'receipt-upload-original',v_replay_receipt,v_replay_path,'image/png',v_changed_hash),'IDEMPOTENCY_CONFLICT');
 select count(*) into v_rows from public.receipts rr where rr.expense_id=v_expense;
 perform coparent_receipt_test.assert_true(v_rows=1,'replay and conflicting payload create no extra receipt row');
 select count(*) into v_rows from public.command_results cr where cr.actor_id=v_a and cr.operation='uploadReceipt' and cr.idempotency_key='receipt-upload-original';
 perform coparent_receipt_test.assert_true(v_rows=1,'receipt has one idempotency result');
 select count(*) into v_rows from public.audit_events ae where ae.expense_id=v_expense;
 perform coparent_receipt_test.assert_true(v_rows=v_audit_count+1,'replay and conflicting payload create no extra history');
 perform coparent_receipt_test.assert_true((select ee.lock_version=v_revision and ee.receipt_id=v_receipt from public.expenses ee where ee.id=v_expense),'replay and conflict leave the revision and receipt unchanged');

 perform set_config('request.jwt.claims',jsonb_build_object('sub',v_b,'role','authenticated')::text,true);
 perform set_config('role','authenticated',true);
 perform coparent_receipt_test.expect_error(format('select public.ledger_read(''getExpense'',%L)',v_expense),'FORBIDDEN');
 if v_native_rls then
   select count(*) into v_rows from public.receipts rr where rr.id=v_receipt;
   perform coparent_receipt_test.assert_true(v_rows=0,'other parent cannot read draft receipt rows');
   select count(*) into v_rows from public.audit_events ae where ae.expense_id=v_expense;
   perform coparent_receipt_test.assert_true(v_rows=0,'other parent cannot read draft receipt history');
 end if;

 perform set_config('request.jwt.claims',jsonb_build_object('sub',v_a,'role','authenticated')::text,true);
 v_submitted=public.ledger_command('submitExpense',jsonb_build_object('id',v_expense),v_revision,'receipt-submit');
 v_revision=(v_submitted#>>'{expense,lockVersion}')::integer;
 v_audit_count=jsonb_array_length(v_submitted->'audit');
 perform coparent_receipt_test.assert_true(v_submitted#>>'{expense,status}'='PENDING' and v_submitted#>>'{expense,receiptId}'=v_receipt::text,'submission freezes the attached receipt');
 perform coparent_receipt_test.expect_error(format('select public.ledger_command(''saveDraft'',%L,%s,''receipt-edit-submitted'')',jsonb_build_object('id',v_expense,'input',v_input||'{"description":"changed"}'::jsonb),v_revision),'INVALID_STATE');
 if v_native_rls then
   perform coparent_receipt_test.assert_true(row_security_active('storage.objects'),'storage RLS is active for the browser role');
   perform coparent_receipt_test.expect_no_write(format('update storage.objects set metadata=''{}''::jsonb where bucket_id=''receipts'' and name=%L',v_path),'authenticated storage overwrite');
   perform coparent_receipt_test.expect_no_write(format('delete from storage.objects where bucket_id=''receipts'' and name=%L',v_path),'authenticated storage delete');
 end if;

 perform set_config('request.jwt.claims',jsonb_build_object('sub',v_b,'role','authenticated')::text,true);
 perform coparent_receipt_test.assert_true(public.ledger_read('getExpense',v_expense)#>>'{expense,receiptId}'=v_receipt::text,'submitted expense and its receipt are visible to the reviewer');
 if v_native_rls then
   select count(*) into v_rows from public.receipts rr where rr.id=v_receipt;
   perform coparent_receipt_test.assert_true(v_rows=1,'reviewer can read the submitted receipt row');
 end if;

 perform set_config('request.jwt.claims',jsonb_build_object('role','service_role')::text,true);
 perform set_config('role','service_role',true);
 perform coparent_receipt_test.assert_true(public.ledger_receipt_lookup(v_b,v_receipt)=jsonb_build_object('objectPath',v_path,'mimeType','image/png'),'service lookup authorizes reviewer after submission');
 perform coparent_receipt_test.assert_true(exists(select 1 from storage.objects so where so.bucket_id='receipts' and so.name=v_path and so.metadata='{"mimetype":"image/png","size":68}'::jsonb),'original stored object metadata survives browser overwrite/delete attempts');
 perform coparent_receipt_test.expect_error(format('select public.ledger_receipt_finalize(%L,%L,%s,%L,%L,%L,%L,68,%L)',v_a,v_expense,v_revision,'receipt-late-finalize',v_late_receipt,v_late_path,'image/png',v_hash),'INVALID_STATE');
 perform coparent_receipt_test.assert_true(not exists(select 1 from public.receipts rr where rr.id=v_late_receipt),'late finalizer creates no receipt row');
 perform coparent_receipt_test.assert_true(not exists(select 1 from public.command_results cr where cr.actor_id=v_a and cr.operation='uploadReceipt' and cr.idempotency_key='receipt-late-finalize'),'late finalizer creates no cached result');
 select count(*) into v_rows from public.audit_events ae where ae.expense_id=v_expense;
 perform coparent_receipt_test.assert_true(v_rows=v_audit_count,'late finalizer creates no history');
 perform coparent_receipt_test.assert_true((select ee.lock_version=v_revision and ee.receipt_id=v_receipt and ee.status='PENDING' from public.expenses ee where ee.id=v_expense),'late finalizer changes neither snapshot nor revision');
 perform coparent_receipt_test.assert_true(public.ledger_receipt_finalize(v_a,v_expense,v_original_revision,'receipt-upload-original',v_replay_receipt,v_replay_path,'image/png',68,v_hash)=v_original_upload,'a committed upload can be replayed after submission');
 perform coparent_receipt_test.assert_true((select ee.status='PENDING' and ee.lock_version=v_revision from public.expenses ee where ee.id=v_expense),'old replay result does not revert the current expense state');

 perform set_config('request.jwt.claims',jsonb_build_object('sub',v_a,'role','authenticated')::text,true);
 perform set_config('role','authenticated',true);
 v_corrected=public.ledger_command('replaceExpenseWithDraft',jsonb_build_object('id',v_expense,'reason','SAMPLE correction'),v_revision,'receipt-correction');
 v_corrected_expense=(v_corrected#>>'{expense,id}')::uuid;
 perform coparent_receipt_test.assert_true(v_corrected#>>'{expense,status}'='DRAFT' and v_corrected#>>'{expense,receiptId}' is null and v_corrected#>>'{expense,replacesExpenseId}'=v_expense::text,'correction creates a private receipt-free draft linked to the old record');
 v_result=public.ledger_read('getExpense',v_expense);
 perform coparent_receipt_test.assert_true(v_result#>>'{expense,status}'='WITHDRAWN','correction withdraws the old submitted record');
 perform coparent_receipt_test.assert_true((v_result->'expense')-array['status','lockVersion']=(v_submitted->'expense')-array['status','lockVersion'],'correction preserves every other old submitted snapshot field');
 perform coparent_receipt_test.assert_true(jsonb_array_length(v_result->'audit')=v_audit_count+1,'correction adds one withdrawal history event to the old record');
 perform coparent_receipt_test.assert_true(v_corrected=public.ledger_command('replaceExpenseWithDraft',jsonb_build_object('id',v_expense,'reason','SAMPLE correction'),v_revision,'receipt-correction'),'correction replay creates no second draft');

 perform set_config('request.jwt.claims',jsonb_build_object('sub',v_b,'role','authenticated')::text,true);
 perform coparent_receipt_test.assert_true(public.ledger_read('getExpense',v_expense)#>>'{expense,receiptId}'=v_receipt::text,'reviewer retains the old submitted receipt after correction');
 perform coparent_receipt_test.expect_error(format('select public.ledger_read(''getExpense'',%L)',v_corrected_expense),'FORBIDDEN');
 perform set_config('request.jwt.claims',jsonb_build_object('role','service_role')::text,true);
 perform set_config('role','service_role',true);
 perform coparent_receipt_test.assert_true(public.ledger_receipt_lookup(v_b,v_receipt)=jsonb_build_object('objectPath',v_path,'mimeType','image/png'),'old withdrawn submitted receipt remains accessible to reviewer');

 -- A never-submitted withdrawn record and its receipt stay private to their author.
 v_result=public.ledger_receipt_finalize(v_a,v_corrected_expense,(v_corrected#>>'{expense,lockVersion}')::integer,'receipt-private-attach',v_private_receipt,v_private_path,'image/png',68,v_hash);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',v_a,'role','authenticated')::text,true);
 perform set_config('role','authenticated',true);
 v_withdrawn=public.ledger_command('withdrawExpense',jsonb_build_object('id',v_corrected_expense,'reason',''),(v_result#>>'{expense,lockVersion}')::integer,'receipt-private-withdraw');
 perform coparent_receipt_test.assert_true(v_withdrawn#>>'{expense,status}'='WITHDRAWN' and v_withdrawn#>>'{expense,submittedAt}' is null,'private withdrawal never publishes the draft');
 perform coparent_receipt_test.assert_true(public.ledger_read('getExpense',v_corrected_expense)=v_withdrawn,'author retains the private withdrawn record and history');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',v_b,'role','authenticated')::text,true);
 perform coparent_receipt_test.expect_error(format('select public.ledger_read(''getExpense'',%L)',v_corrected_expense),'FORBIDDEN');
 if v_native_rls then
   select count(*) into v_rows from public.receipts rr where rr.id=v_private_receipt;
   perform coparent_receipt_test.assert_true(v_rows=0,'private withdrawn receipt remains hidden by RLS');
   select count(*) into v_rows from public.audit_events ae where ae.expense_id=v_corrected_expense;
   perform coparent_receipt_test.assert_true(v_rows=0,'private withdrawn receipt history remains hidden by RLS');
 end if;
 perform set_config('request.jwt.claims',jsonb_build_object('role','service_role')::text,true);
 perform set_config('role','service_role',true);
 perform coparent_receipt_test.assert_true(public.ledger_receipt_lookup(v_a,v_private_receipt)=jsonb_build_object('objectPath',v_private_path,'mimeType','image/png'),'author retains private withdrawn receipt access');
 perform coparent_receipt_test.expect_error(format('select public.ledger_receipt_lookup(%L,%L)',v_b,v_private_receipt),'FORBIDDEN');
 perform coparent_receipt_test.assert_true(public.ledger_receipt_lookup(v_b,v_receipt)=jsonb_build_object('objectPath',v_path,'mimeType','image/png'),'new private withdrawal cannot alter the old shared receipt');
 perform set_config('role','postgres',true);
 raise notice 'PASSED: receipt RPC lifecycle, snapshot, history, and idempotency assertions; native RLS/grant/Storage checks executed: %',v_native_rls;
end $test$;
rollback;
