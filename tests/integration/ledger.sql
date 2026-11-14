-- psql -X -v ON_ERROR_STOP=1 "$TEST_DATABASE_URL" -f tests/integration/ledger.sql
-- Entire synthetic fixture set is rolled back, including the test helper schema.
begin;
create schema coparent_test;
create function coparent_test.assert_true(condition boolean, label text) returns void language plpgsql as $$ begin if condition is distinct from true then raise exception 'ASSERTION FAILED: %',label; end if; end $$;
create function coparent_test.expect_error(statement text, expected text) returns void language plpgsql as $$
begin
  begin execute statement;
  exception when others then
    if position(expected in sqlerrm)>0 then return; end if;
    raise exception 'Expected %, got %',expected,sqlerrm;
  end;
  raise exception 'Expected failure: %',expected;
end $$;
grant usage on schema coparent_test to authenticated;
grant execute on all functions in schema coparent_test to authenticated;
select coparent_test.assert_true(to_regprocedure('public.ledger_command(text,jsonb,integer,text)') is not null,'ledger_command exists');
insert into auth.users(id,email,email_confirmed_at) values
 ('10000000-0000-4000-8000-000000000001','coparent-sql-a@example.invalid',now()),
 ('10000000-0000-4000-8000-000000000002','coparent-sql-b@example.invalid',now()),
 ('10000000-0000-4000-8000-000000000003','coparent-sql-c@example.invalid',now());
do $test$
declare
 a uuid='10000000-0000-4000-8000-000000000001'; b uuid='10000000-0000-4000-8000-000000000002'; c uuid='10000000-0000-4000-8000-000000000003';
 context jsonb; invitation jsonb; token text; child jsonb; result jsonb; original jsonb; input jsonb; expense_id uuid; revision integer; report_id uuid; count_rows integer; before_audit integer;
begin
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 perform set_config('role','authenticated',true);
 context=public.ledger_command('createHousehold','{}',null,'sql-create-household');
 perform coparent_test.assert_true(context=public.ledger_command('createHousehold','{}',null,'sql-create-household'),'household retry exact');
 child=public.ledger_command('createChild','{"alias":"Child 1"}',null,'sql-create-child');
 input=jsonb_build_object('childId',child->>'id','category','SCHOOL','description','SAMPLE supplies','merchant','SAMPLE store','expenseDate','2026-01-15','amountCents',12001,'reviewerShareBps',4000);
 result=public.ledger_command('createDraft',jsonb_build_object('input',input),null,'sql-create-draft');
 perform public.ledger_command('createDraft',jsonb_build_object('input',input||jsonb_build_object('description',repeat('a',500),'merchant',repeat('b',200))),null,'sql-text-boundaries');
 perform coparent_test.expect_error(format('select public.ledger_command(''createDraft'',%L,null,''sql-long-description'')',jsonb_build_object('input',input||jsonb_build_object('description',repeat('a',501)))),'VALIDATION');
 perform coparent_test.expect_error(format('select public.ledger_command(''createDraft'',%L,null,''sql-spoof-status'')',jsonb_build_object('input',input||'{"status":"APPROVED"}'::jsonb)),'VALIDATION');
 expense_id=(result#>>'{expense,id}')::uuid; revision=(result#>>'{expense,lockVersion}')::integer;
 perform coparent_test.assert_true((result#>>'{expense,reviewerOwedCents}')::integer=4800,'integer rounding');
 perform coparent_test.expect_error(format('select public.ledger_command(''submitExpense'',%L,%s,''sql-premature-submit'')',jsonb_build_object('id',expense_id),revision),'INVALID_STATE');
 invitation=public.ledger_create_invite('coparent-sql-b@example.invalid','http://localhost:5173');
 token=regexp_replace(invitation->>'url','^.*/','');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',c,'role','authenticated')::text,true);
 perform coparent_test.expect_error(format('select public.ledger_command(''acceptInvite'',%L,null,''sql-wrong-email'')',jsonb_build_object('token',token)),'INVITE_INVALID');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 original=public.ledger_command('acceptInvite',jsonb_build_object('token',token),null,'sql-accept');
 perform coparent_test.assert_true(original=public.ledger_command('acceptInvite',jsonb_build_object('token',token),null,'sql-accept'),'accept retry exact');
 perform coparent_test.assert_true(public.ledger_read('listExpenses',null)='[]'::jsonb,'private draft hidden');
 if row_security_active('public.expenses'::regclass) then
   select count(*) into count_rows from public.audit_events;
   perform coparent_test.assert_true(count_rows=0,'draft audit hidden');
   perform coparent_test.expect_error('select * from public.command_results','permission denied');
 else raise notice 'BLOCKED: native RLS/grants are bypassed by PostgreSQL single-user mode; run this SQL against a normal test server for those checks'; end if;
 perform coparent_test.expect_error(format('select public.ledger_read(''getExpense'',%L)',expense_id),'FORBIDDEN');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 result=public.ledger_command('submitExpense',jsonb_build_object('id',expense_id),revision,'sql-submit'); revision=(result#>>'{expense,lockVersion}')::integer;
 perform coparent_test.expect_error(format('select public.ledger_command(''reviewExpense'',%L,%s,''sql-self-approve'')',jsonb_build_object('id',expense_id,'decision','APPROVE','note',''),revision),'FORBIDDEN');
 if row_security_active('public.expenses'::regclass) then
   perform coparent_test.expect_error(format('update public.expenses set status=''APPROVED'' where id=%L',expense_id),'permission denied');
 end if;
 perform coparent_test.expect_error(format('select public.ledger_command(''saveDraft'',%L,%s,''sql-edit-sent'')',jsonb_build_object('id',expense_id,'input',input),revision),'INVALID_STATE');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 result=public.ledger_command('reviewExpense',jsonb_build_object('id',expense_id,'decision','APPROVE','note',''),revision,'sql-approve'); revision=(result#>>'{expense,lockVersion}')::integer;
 result=public.ledger_command('reportReimbursement',jsonb_build_object('expenseId',expense_id,'amountCents',2000,'paidOn','2026-01-16','methodLabel','SAMPLE','note',''),revision,'sql-report');
 original=result; report_id=(result#>>'{reimbursements,0,id}')::uuid;
 perform coparent_test.assert_true(original=public.ledger_command('reportReimbursement',jsonb_build_object('expenseId',expense_id,'amountCents',2000,'paidOn','2026-01-16','methodLabel','SAMPLE','note',''),revision,'sql-report'),'report retry exact');
 perform coparent_test.expect_error(format('select public.ledger_command(''reportReimbursement'',%L,%s,''sql-report'')',jsonb_build_object('expenseId',expense_id,'amountCents',2001,'paidOn','2026-01-16','methodLabel','SAMPLE','note',''),revision),'IDEMPOTENCY_CONFLICT');
 revision=(result#>>'{expense,lockVersion}')::integer;
 perform coparent_test.expect_error(format('select public.ledger_command(''resolveReimbursement'',%L,%s,''sql-self-confirm'')',jsonb_build_object('reportId',report_id,'decision','CONFIRM','note',''),revision),'FORBIDDEN');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 result=public.ledger_command('resolveReimbursement',jsonb_build_object('reportId',report_id,'decision','CONFIRM','note',''),revision,'sql-confirm');
 perform coparent_test.assert_true(result=public.ledger_command('resolveReimbursement',jsonb_build_object('reportId',report_id,'decision','CONFIRM','note',''),revision,'sql-confirm'),'confirm retry exact');
 revision=(result#>>'{expense,lockVersion}')::integer;
 perform coparent_test.assert_true(result#>>'{reimbursements,0,status}'='CONFIRMED','creditor confirms');
 perform coparent_test.assert_true(exists(select 1 from jsonb_array_elements(result->'audit') audit_item where audit_item->>'action'='PAYMENT_CONFIRMED' and audit_item->>'reimbursementId'=report_id::text),'history links the confirmed report');
 perform coparent_test.assert_true((result#>>'{expense,reviewerOwedCents}')::integer-(result#>>'{reimbursements,0,amountCents}')::integer=2800,'remaining exact');
 perform coparent_test.expect_error(format('select public.ledger_command(''withdrawExpense'',%L,%s,''sql-withdraw-approved'')',jsonb_build_object('id',expense_id,'reason','test'),revision),'INVALID_STATE');
 before_audit=jsonb_array_length(result->'audit');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 perform coparent_test.expect_error(format('select public.ledger_command(''reportReimbursement'',%L,%s,''sql-overpayment'')',jsonb_build_object('expenseId',expense_id,'amountCents',2801,'paidOn','2026-01-16','methodLabel','','note',''),revision),'AMOUNT_EXCEEDS_AVAILABLE');
 result=public.ledger_read('getExpense',expense_id);
 perform coparent_test.assert_true(jsonb_array_length(result->'audit')=before_audit,'failed command has no audit side effect');
 result=public.ledger_command('reportReimbursement',jsonb_build_object('expenseId',expense_id,'amountCents',1000,'paidOn','2026-01-17','methodLabel','','note',''),revision,'sql-report-to-reject');
 revision=(result#>>'{expense,lockVersion}')::integer;
 select (item->>'id')::uuid into report_id from jsonb_array_elements(result->'reimbursements') item where item->>'status'='PENDING';
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 perform coparent_test.expect_error(format('select public.ledger_command(''resolveReimbursement'',%L,%s,''sql-blank-reject'')',jsonb_build_object('reportId',report_id,'decision','REJECT','note','   '),revision),'VALIDATION');
 perform coparent_test.expect_error(format('select public.ledger_command(''resolveReimbursement'',%L,%s,''sql-tab-reject'')',jsonb_build_object('reportId',report_id,'decision','REJECT','note',chr(9)||chr(10)),revision),'VALIDATION');
 result=public.ledger_command('resolveReimbursement',jsonb_build_object('reportId',report_id,'decision','REJECT','note','SAMPLE payment not received'),revision,'sql-reject');
 revision=(result#>>'{expense,lockVersion}')::integer;
 perform coparent_test.assert_true(exists(select 1 from jsonb_array_elements(result->'reimbursements') item where item->>'id'=report_id::text and item->>'status'='REJECTED'),'creditor rejects the exact report');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 result=public.ledger_command('reportReimbursement',jsonb_build_object('expenseId',expense_id,'amountCents',2800,'paidOn','2026-01-18','methodLabel','','note',''),revision,'sql-final-report');
 revision=(result#>>'{expense,lockVersion}')::integer;
 select (item->>'id')::uuid into report_id from jsonb_array_elements(result->'reimbursements') item where item->>'status'='PENDING';
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 result=public.ledger_command('resolveReimbursement',jsonb_build_object('reportId',report_id,'decision','CONFIRM','note',''),revision,'sql-final-confirm');
 revision=(result#>>'{expense,lockVersion}')::integer;
 perform coparent_test.assert_true((select sum((item->>'amountCents')::bigint) from jsonb_array_elements(result->'reimbursements') item where item->>'status'='CONFIRMED')=4800,'rejected reservation released; exactly fully reimbursed');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 perform coparent_test.expect_error(format('select public.ledger_command(''reportReimbursement'',%L,%s,''sql-paid-extra-cent'')',jsonb_build_object('expenseId',expense_id,'amountCents',1,'paidOn','2026-01-19','methodLabel','','note',''),revision),'AMOUNT_EXCEEDS_AVAILABLE');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',c,'role','authenticated')::text,true);
 perform public.ledger_command('createHousehold','{}',null,'sql-c-household');
 if row_security_active('public.expenses'::regclass) then
   select count(*) into count_rows from public.expenses;
   perform coparent_test.assert_true(count_rows=0,'third family cannot read via direct SQL');
 end if;
 perform coparent_test.expect_error(format('select public.ledger_read(''getExpense'',%L)',expense_id),'FORBIDDEN');
 perform set_config('role','postgres',true);
 raise notice 'PASSED: SQL financial/explicit authorization/retry assertions (fixtures rolled back); native RLS status is reported separately above';
end $test$;
rollback;
