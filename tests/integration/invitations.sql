-- Run with psql -X -v ON_ERROR_STOP=1 on a migrated TEST database. Fixtures roll back.
begin;
create schema coparent_invite_test;
create function coparent_invite_test.assert_true(ok boolean,label text) returns void language plpgsql as $$ begin if ok is distinct from true then raise exception 'ASSERTION FAILED: %',label; end if; end $$;
create function coparent_invite_test.expect_error(statement text,expected text) returns void language plpgsql as $$ begin begin execute statement; exception when others then if position(expected in sqlerrm)>0 then return; end if; raise exception 'Expected %, got %',expected,sqlerrm; end; raise exception 'Expected failure: %',expected; end $$;
grant usage on schema coparent_invite_test to authenticated;
grant execute on all functions in schema coparent_invite_test to authenticated;
insert into auth.users(id,email,email_confirmed_at) values
 ('30000000-0000-4000-8000-000000000001','coparent-invite-a@example.invalid',now()),
 ('30000000-0000-4000-8000-000000000002','coparent-invite-b@example.invalid',now()),
 ('30000000-0000-4000-8000-000000000003','coparent-invite-u@example.invalid',null);
do $test$
declare
 v_a uuid='30000000-0000-4000-8000-000000000001'; v_b uuid='30000000-0000-4000-8000-000000000002'; v_u uuid='30000000-0000-4000-8000-000000000003';
 v_invite jsonb; v_old_token text; v_token text; v_context jsonb; v_household uuid;
begin
 perform set_config('role','authenticated',true);
 perform set_config('request.jwt.claims','{"role":"authenticated"}',true);
 perform coparent_invite_test.expect_error('select public.ledger_read(''getContext'',null)','UNAUTHENTICATED');
 perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',v_a)::text,true);
 v_context=public.ledger_command('createHousehold','{}',null,'invite-household'); v_household=(v_context#>>'{household,id}')::uuid;
 perform coparent_invite_test.expect_error('select public.ledger_create_invite(''coparent-invite-a@example.invalid'',''http://localhost:5173'')','INVITE_INVALID');
 v_invite=public.ledger_create_invite(' Coparent-invite-b@EXAMPLE.invalid ','http://localhost:5173'); v_old_token=regexp_replace(v_invite->>'url','^.*/','');
 perform coparent_invite_test.assert_true(v_old_token ~ '^[a-f0-9]{64}$','high-entropy opaque invite token');
 perform coparent_invite_test.assert_true((v_invite->>'expiresAt')::timestamptz=now()+interval '72 hours','invite TTL exactly 72 hours');
 v_invite=public.ledger_create_invite('coparent-invite-b@example.invalid','http://localhost:5173'); v_token=regexp_replace(v_invite->>'url','^.*/','');
 perform coparent_invite_test.assert_true(v_old_token<>v_token,'explicit creation rotates the token');
 perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',v_b)::text,true);
 perform coparent_invite_test.expect_error(format('select public.ledger_command(''acceptInvite'',%L,null,''invite-revoked'')',jsonb_build_object('token',v_old_token)),'INVITE_INVALID');
 perform set_config('role','postgres',true);
 update public.household_invites set expires_at=now()-interval '1 second' where household_id=v_household and revoked_at is null;
 perform set_config('role','authenticated',true);
 perform coparent_invite_test.expect_error(format('select public.ledger_command(''acceptInvite'',%L,null,''invite-expired'')',jsonb_build_object('token',v_token)),'INVITE_INVALID');
 perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',v_a)::text,true);
 v_invite=public.ledger_create_invite('coparent-invite-u@example.invalid','http://localhost:5173'); v_token=regexp_replace(v_invite->>'url','^.*/','');
 perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',v_u)::text,true);
 perform coparent_invite_test.expect_error(format('select public.ledger_command(''acceptInvite'',%L,null,''invite-unverified'')',jsonb_build_object('token',v_token)),'INVITE_INVALID');
 perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',v_a)::text,true);
 v_invite=public.ledger_create_invite('coparent-invite-b@example.invalid','http://localhost:5173'); v_token=regexp_replace(v_invite->>'url','^.*/','');
 perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',v_b)::text,true);
 v_context=public.ledger_command('acceptInvite',jsonb_build_object('token',v_token),null,'invite-success');
 perform coparent_invite_test.assert_true(jsonb_array_length(v_context->'members')=2,'verified intended email occupies second slot');
 perform coparent_invite_test.assert_true(v_context=public.ledger_command('acceptInvite',jsonb_build_object('token',v_token),null,'invite-success'),'successful retry before membership rejection');
 perform coparent_invite_test.expect_error('select public.ledger_command(''createHousehold'',''{}'',null,''invite-second-house'')','INVALID_STATE');
 perform coparent_invite_test.expect_error(format('select public.ledger_command(''acceptInvite'',%L,null,''invite-reused'')',jsonb_build_object('token',v_token)),'INVITE_INVALID');
 perform coparent_invite_test.expect_error('select public.ledger_create_invite(''coparent-invite-u@example.invalid'',''http://localhost:5173'')','FORBIDDEN');
 perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',v_a)::text,true);
 perform coparent_invite_test.expect_error('select public.ledger_create_invite(''coparent-invite-u@example.invalid'',''http://localhost:5173'')','HOUSEHOLD_FULL');
 perform public.ledger_command('createChild','{"alias":"Child 1"}',null,'invite-child1');
 perform public.ledger_command('createChild','{"alias":"Child 2"}',null,'invite-child2');
 perform public.ledger_command('createChild','{"alias":"Child 3"}',null,'invite-child3');
 perform coparent_invite_test.expect_error('select public.ledger_command(''createChild'',''{"alias":"Child 4"}'',null,''invite-child4'')','VALIDATION');
 perform set_config('role','postgres',true);
 perform coparent_invite_test.assert_true(not exists(select 1 from public.command_results cr where cr.result::text like '%'||v_token||'%' or cr.result::text like '%'||v_old_token||'%'),'raw invite tokens never enter stored command results');
 perform coparent_invite_test.assert_true((select count(*) from public.household_members hm where hm.household_id=v_household)=2,'maximum two members');
 raise notice 'PASSED: invite email verification, expiry, revocation, replay, privacy and household/child limits';
end $test$;
rollback;
