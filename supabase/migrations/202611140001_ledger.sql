-- CoParent Ledger: financial commands are transactional; browser roles are read-only.
-- Apply through Supabase migrations as the database owner. No real data or users are seeded.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.households (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create table public.household_members (
  household_id uuid not null references public.households(id),
  user_id uuid primary key references auth.users(id),
  slot smallint not null check (slot in (1,2)),
  display_name text not null check (length(display_name) between 1 and 80),
  created_at timestamptz not null default now(),
  unique(household_id,slot), unique(household_id,user_id)
);
create table public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id),
  created_by uuid not null references auth.users(id),
  target_email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.children (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id),
  alias text not null check (length(btrim(alias)) between 1 and 60),
  created_at timestamptz not null default now(),
  unique(id,household_id)
);
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id),
  paid_by uuid not null,
  reviewer_id uuid,
  child_id uuid not null,
  child_alias_snapshot text not null,
  category text not null check (category in ('SCHOOL','MEDICAL','ACTIVITIES','PURCHASES','OTHER')),
  description text not null check(length(btrim(description)) between 1 and 500),
  merchant text not null default '' check(length(merchant)<=200),
  expense_date date not null,
  currency text not null default 'USD' check(currency='USD'),
  amount_cents bigint not null check(amount_cents between 1 and 100000000),
  reviewer_share_bps integer not null check(reviewer_share_bps between 0 and 10000),
  reviewer_owed_cents bigint generated always as ((amount_cents * reviewer_share_bps::bigint + 5000) / 10000) stored,
  status text not null default 'DRAFT' check(status in ('DRAFT','PENDING','APPROVED','DISPUTED','WITHDRAWN')),
  submitted_at timestamptz,
  replaces_expense_id uuid,
  receipt_id uuid,
  lock_version integer not null default 0 check(lock_version>=0),
  created_at timestamptz not null default now(),
  unique(id,household_id),
  foreign key(household_id,paid_by) references public.household_members(household_id,user_id),
  foreign key(household_id,reviewer_id) references public.household_members(household_id,user_id),
  foreign key(child_id,household_id) references public.children(id,household_id),
  foreign key(replaces_expense_id,household_id) references public.expenses(id,household_id),
  check(reviewer_id is null or reviewer_id<>paid_by),
  check(status in ('DRAFT','WITHDRAWN') or (submitted_at is not null and reviewer_id is not null))
);
create table public.receipts (
  id uuid primary key,
  household_id uuid not null,
  expense_id uuid not null,
  object_path text not null unique,
  mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')),
  size_bytes integer not null check(size_bytes between 1 and 5242880),
  sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  unique(id,expense_id,household_id),
  foreign key(expense_id,household_id) references public.expenses(id,household_id)
);
alter table public.expenses add constraint expense_receipt_same_record_fk
  foreign key(receipt_id,id,household_id) references public.receipts(id,expense_id,household_id);
create table public.reimbursements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  expense_id uuid not null,
  from_user_id uuid not null,
  to_user_id uuid not null,
  amount_cents bigint not null check(amount_cents between 1 and 100000000),
  paid_on date not null,
  method_label text not null default '' check(length(method_label)<=100),
  note text not null default '' check(length(note)<=1000),
  status text not null default 'PENDING' check(status in ('PENDING','CONFIRMED','REJECTED')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique(id,expense_id,household_id),
  foreign key(expense_id,household_id) references public.expenses(id,household_id),
  foreign key(household_id,from_user_id) references public.household_members(household_id,user_id),
  foreign key(household_id,to_user_id) references public.household_members(household_id,user_id),
  check(from_user_id<>to_user_id),
  check((status='PENDING')=(resolved_at is null))
);
create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  expense_id uuid not null,
  actor_id uuid not null references auth.users(id),
  reimbursement_id uuid,
  action text not null,
  created_at timestamptz not null default now(),
  amount_cents bigint,
  note text not null default '' check(length(note)<=1000),
  foreign key(expense_id,household_id) references public.expenses(id,household_id),
  foreign key(reimbursement_id,expense_id,household_id) references public.reimbursements(id,expense_id,household_id),
  foreign key(household_id,actor_id) references public.household_members(household_id,user_id)
);
create table public.command_results (
  actor_id uuid not null references auth.users(id),
  operation text not null,
  idempotency_key text not null,
  request_hash text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key(actor_id,operation,idempotency_key)
);
create index expenses_household_status_idx on public.expenses(household_id,status,created_at desc);
create index children_household_idx on public.children(household_id);
create index receipts_expense_idx on public.receipts(expense_id);
create index reimbursements_expense_status_idx on public.reimbursements(expense_id,status);
create index audit_events_expense_time_idx on public.audit_events(expense_id,created_at,id);
create index household_invites_active_idx on public.household_invites(household_id) where consumed_at is null and revoked_at is null;

create function private.current_household() returns uuid
language sql stable security definer set search_path='' as $$
  select household_id from public.household_members where user_id=auth.uid()
$$;
create function private.can_read_expense(p_id uuid,p_actor uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.expenses e join public.household_members m on m.household_id=e.household_id
    where e.id=p_id and m.user_id=p_actor and (e.paid_by=p_actor or e.submitted_at is not null))
$$;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.children enable row level security;
alter table public.expenses enable row level security;
alter table public.receipts enable row level security;
alter table public.reimbursements enable row level security;
alter table public.audit_events enable row level security;
alter table public.command_results enable row level security;
create policy household_read on public.households for select to authenticated using(id=(select private.current_household()));
create policy membership_read on public.household_members for select to authenticated using(household_id=(select private.current_household()));
create policy children_read on public.children for select to authenticated using(household_id=(select private.current_household()));
create policy expenses_read on public.expenses for select to authenticated using(household_id=(select private.current_household()) and (paid_by=(select auth.uid()) or submitted_at is not null));
create policy receipts_read on public.receipts for select to authenticated using(exists(select 1 from public.expenses e where e.id=expense_id and e.receipt_id=receipts.id));
create policy reimbursements_read on public.reimbursements for select to authenticated using(exists(select 1 from public.expenses e where e.id=expense_id));
create policy audit_read on public.audit_events for select to authenticated using(exists(select 1 from public.expenses e where e.id=expense_id));
revoke all on public.households,public.household_members,public.household_invites,public.children,public.expenses,public.receipts,public.reimbursements,public.audit_events,public.command_results from anon,authenticated;
grant select on public.households,public.household_members,public.children,public.expenses,public.receipts,public.reimbursements,public.audit_events to authenticated;
grant all on public.households,public.household_members,public.household_invites,public.children,public.expenses,public.receipts,public.reimbursements,public.audit_events,public.command_results to service_role;
grant usage on schema private to authenticated;
revoke all on function private.current_household(),private.can_read_expense(uuid,uuid) from public,anon,authenticated;
grant execute on function private.current_household() to authenticated;

-- Trigger is defense in depth: published content stays frozen even if a later RPC is wrong.
create function private.freeze_submitted_expense() returns trigger
language plpgsql set search_path='' as $$
begin
 if old.submitted_at is not null and (
   new.household_id,new.paid_by,new.reviewer_id,new.child_id,new.child_alias_snapshot,new.category,new.description,new.merchant,new.expense_date,new.currency,new.amount_cents,new.reviewer_share_bps,new.receipt_id,new.submitted_at,new.replaces_expense_id
 ) is distinct from (
   old.household_id,old.paid_by,old.reviewer_id,old.child_id,old.child_alias_snapshot,old.category,old.description,old.merchant,old.expense_date,old.currency,old.amount_cents,old.reviewer_share_bps,old.receipt_id,old.submitted_at,old.replaces_expense_id
 ) then raise exception using message='INVALID_STATE',errcode='P0001'; end if;
 if old.status in ('APPROVED','WITHDRAWN') and new.status<>old.status then raise exception using message='INVALID_STATE',errcode='P0001'; end if;
 return new;
end $$;
create trigger expense_snapshot_immutable before update on public.expenses for each row execute function private.freeze_submitted_expense();

create function private.expense_json(e public.expenses) returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('id',e.id,'householdId',e.household_id,'paidBy',e.paid_by,'reviewerId',e.reviewer_id,'childId',e.child_id,'childAliasSnapshot',e.child_alias_snapshot,'category',e.category,'description',e.description,'merchant',e.merchant,'expenseDate',e.expense_date,'currency',e.currency,'amountCents',e.amount_cents,'reviewerShareBps',e.reviewer_share_bps,'reviewerOwedCents',e.reviewer_owed_cents,'status',e.status,'submittedAt',e.submitted_at,'replacesExpenseId',e.replaces_expense_id,'receiptId',e.receipt_id,'lockVersion',e.lock_version,'createdAt',e.created_at)
$$;
create function private.detail(p_id uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('expense',private.expense_json(e),'reimbursements',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'householdId',r.household_id,'expenseId',r.expense_id,'fromUserId',r.from_user_id,'toUserId',r.to_user_id,'amountCents',r.amount_cents,'paidOn',r.paid_on,'methodLabel',r.method_label,'note',r.note,'status',r.status,'createdAt',r.created_at,'resolvedAt',r.resolved_at) order by r.created_at,r.id) from public.reimbursements r where r.expense_id=e.id),'[]'::jsonb),'audit',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'householdId',a.household_id,'expenseId',a.expense_id,'actorId',a.actor_id,'reimbursementId',a.reimbursement_id,'action',a.action,'createdAt',a.created_at,'amountCents',a.amount_cents,'note',a.note) order by a.created_at,a.id) from public.audit_events a where a.expense_id=e.id),'[]'::jsonb)) from public.expenses e where e.id=p_id
$$;
create function private.context(p_actor uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('userId',p_actor,'household',(select jsonb_build_object('id',h.id,'createdBy',h.created_by,'createdAt',h.created_at) from public.households h where h.id=(select household_id from public.household_members where user_id=p_actor)),'members',coalesce((select jsonb_agg(jsonb_build_object('userId',m.user_id,'displayName',m.display_name) order by m.slot) from public.household_members m where m.household_id=(select household_id from public.household_members where user_id=p_actor)),'[]'::jsonb),'children',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'householdId',c.household_id,'alias',c.alias) order by c.created_at,c.id) from public.children c where c.household_id=(select household_id from public.household_members where user_id=p_actor)),'[]'::jsonb))
$$;
create function private.request_hash(p_payload jsonb,p_revision integer) returns text language sql immutable set search_path='' as $$
 select encode(sha256(convert_to(jsonb_build_object('payload',p_payload,'expectedRevision',p_revision)::text,'UTF8')),'hex')
$$;
create function private.replay(p_actor uuid,p_operation text,p_key text,p_hash text) returns jsonb language plpgsql set search_path='' as $$
declare saved public.command_results;
begin
 if p_key is null or length(p_key) not between 1 and 200 then raise exception using message='VALIDATION',errcode='P0001'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text||':'||p_operation||':'||p_key,0));
 select * into saved from public.command_results where actor_id=p_actor and operation=p_operation and idempotency_key=p_key;
 if found then
   if saved.request_hash<>p_hash then raise exception using message='IDEMPOTENCY_CONFLICT',errcode='P0001'; end if;
   return saved.result;
 end if;
 return null;
end $$;
create function private.store_result(p_actor uuid,p_operation text,p_key text,p_hash text,p_result jsonb) returns void language sql set search_path='' as $$
 insert into public.command_results(actor_id,operation,idempotency_key,request_hash,result) values(p_actor,p_operation,p_key,p_hash,p_result)
$$;
create function private.audit(p_expense public.expenses,p_actor uuid,p_action text,p_amount bigint default null,p_note text default '',p_reimbursement_id uuid default null) returns void language sql set search_path='' as $$
 insert into public.audit_events(household_id,expense_id,actor_id,action,amount_cents,note,reimbursement_id) values(p_expense.household_id,p_expense.id,p_actor,p_action,p_amount,coalesce(p_note,''),p_reimbursement_id)
$$;
create function private.valid_date(p_value text) returns date language plpgsql immutable set search_path='' as $$
declare value date;
begin
 if p_value is null or p_value !~ '^\d{4}-\d{2}-\d{2}$' then raise exception using message='VALIDATION',errcode='P0001'; end if;
 value=p_value::date;
 if to_char(value,'YYYY-MM-DD')<>p_value then raise exception using message='VALIDATION',errcode='P0001'; end if;
 return value;
end $$;
create function private.valid_int(p_value jsonb,p_min bigint,p_max bigint) returns bigint language plpgsql immutable set search_path='' as $$
declare value bigint;
begin
 if p_value is null or jsonb_typeof(p_value)<>'number' or p_value::text !~ '^[0-9]+$' then raise exception using message='VALIDATION',errcode='P0001'; end if;
 value=(p_value::text)::bigint;
 if value<p_min or value>p_max then raise exception using message='VALIDATION',errcode='P0001'; end if;
 return value;
end $$;
create function private.valid_text(p_value jsonb,p_min integer,p_max integer) returns text language plpgsql immutable set search_path='' as $$
declare value text;
begin
 if p_value is null or jsonb_typeof(p_value)<>'string' then raise exception using message='VALIDATION',errcode='P0001'; end if;
 value=btrim(p_value#>>'{}',E' \t\n\r\f\v'||chr(160)||chr(65279));
 if length(value)<p_min or length(value)>p_max then raise exception using message='VALIDATION',errcode='P0001'; end if;
 return value;
end $$;
create function private.check_keys(p_value jsonb,p_allowed text[]) returns void language plpgsql immutable set search_path='' as $$
begin
 if p_value is null or jsonb_typeof(p_value)<>'object' then raise exception using message='VALIDATION',errcode='P0001'; end if;
 if exists(select 1 from jsonb_object_keys(p_value) k where not(k=any(p_allowed))) then raise exception using message='VALIDATION',errcode='P0001'; end if;
end $$;

create function public.ledger_read(p_operation text,p_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare actor uuid=auth.uid(); result jsonb;
begin
 if actor is null then raise exception using message='UNAUTHENTICATED',errcode='P0001'; end if;
 if p_operation='getContext' then return private.context(actor);
 elsif p_operation='listChildren' then return private.context(actor)->'children';
 elsif p_operation='listExpenses' then
   select coalesce(jsonb_agg(private.detail(e.id) order by e.created_at desc,e.id),'[]'::jsonb) into result from public.expenses e where private.can_read_expense(e.id,actor); return result;
 elsif p_operation='getExpense' then
   if not private.can_read_expense(p_id,actor) then raise exception using message='FORBIDDEN',errcode='P0001'; end if;
   return private.detail(p_id);
 end if;
 raise exception using message='VALIDATION',errcode='P0001';
end $$;

create function public.ledger_create_invite(p_email text,p_base_url text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid=auth.uid(); h public.households; token text; expiry timestamptz; target_email_value text=lower(btrim(p_email));
begin
 if actor is null then raise exception using message='UNAUTHENTICATED',errcode='P0001'; end if;
 if target_email_value is null or length(target_email_value)>254 or target_email_value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception using message='VALIDATION',errcode='P0001'; end if;
 -- The app provides its origin; never accept credentials, fragments, queries or paths here.
 if p_base_url is null or length(p_base_url)>300 or p_base_url !~ '^https?://[a-zA-Z0-9.-]+(:[0-9]{1,5})?$' then raise exception using message='VALIDATION',errcode='P0001'; end if;
 select h0.* into h from public.households h0 join public.household_members m on m.household_id=h0.id where m.user_id=actor for update of h0;
 if not found or h.created_by<>actor then raise exception using message='FORBIDDEN',errcode='P0001'; end if;
 if (select count(*) from public.household_members where household_id=h.id)>=2 then raise exception using message='HOUSEHOLD_FULL',errcode='P0001'; end if;
 if exists(select 1 from auth.users where id=actor and lower(btrim(auth.users.email))=target_email_value) then raise exception using message='INVITE_INVALID',errcode='P0001'; end if;
 update public.household_invites set revoked_at=now() where household_id=h.id and consumed_at is null and revoked_at is null;
 token=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''); expiry=now()+interval '72 hours';
 insert into public.household_invites(household_id,created_by,target_email,token_hash,expires_at) values(h.id,actor,target_email_value,encode(sha256(convert_to(token,'UTF8')),'hex'),expiry);
 -- The raw token exists only in this returned value, never command_results or history.
 return jsonb_build_object('url',p_base_url||'/invite/'||token,'expiresAt',expiry);
end $$;

create function public.ledger_command(p_operation text,p_payload jsonb,p_expected_revision integer,p_idempotency_key text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 actor uuid=auth.uid(); h_id uuid; e public.expenses; new_e public.expenses; r public.reimbursements; child public.children; invitation public.household_invites;
 payload_hash text; result jsonb; input jsonb; child_id uuid; expense_id uuid; report_id uuid; reviewer uuid; amount bigint; share integer; reserved bigint; alias_value text; note_value text; category_value text; description_value text; merchant_value text; entered_date date; invite_hash text; verified_email text;
begin
 if actor is null then raise exception using message='UNAUTHENTICATED',errcode='P0001'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or p_operation not in ('createHousehold','acceptInvite','createChild','createDraft','saveDraft','submitExpense','reviewExpense','withdrawExpense','replaceExpenseWithDraft','reportReimbursement','resolveReimbursement') then raise exception using message='VALIDATION',errcode='P0001'; end if;
 perform private.check_keys(p_payload,case p_operation
   when 'createHousehold' then array[]::text[] when 'acceptInvite' then array['token'] when 'createChild' then array['alias']
   when 'createDraft' then array['input'] when 'saveDraft' then array['id','input'] when 'submitExpense' then array['id']
   when 'reviewExpense' then array['id','decision','note'] when 'withdrawExpense' then array['id','reason'] when 'replaceExpenseWithDraft' then array['id','reason']
   when 'reportReimbursement' then array['expenseId','amountCents','paidOn','methodLabel','note'] when 'resolveReimbursement' then array['reportId','decision','note'] end);
 payload_hash=private.request_hash(p_payload,p_expected_revision);
 result=private.replay(actor,p_operation,p_idempotency_key,payload_hash);
 if result is not null then return result; end if;
 -- Serializes membership creation for this user, including concurrent accepts into different homes.
 if p_operation in ('createHousehold','acceptInvite') then perform pg_advisory_xact_lock(hashtextextended(actor::text||':membership',0)); end if;
 select household_id into h_id from public.household_members where user_id=actor;

 if p_operation='createHousehold' then
   if h_id is not null then raise exception using message='INVALID_STATE',errcode='P0001'; end if;
   insert into public.households(created_by) values(actor) returning id into h_id;
   insert into public.household_members(household_id,user_id,slot,display_name) values(h_id,actor,1,'Parent 1');
   result=private.context(actor);
 elsif p_operation='acceptInvite' then
   if h_id is not null then raise exception using message='INVITE_INVALID',errcode='P0001'; end if;
   invite_hash=encode(sha256(convert_to(private.valid_text(p_payload->'token',32,256),'UTF8')),'hex');
   select * into invitation from public.household_invites where token_hash=invite_hash;
   if not found then raise exception using message='INVITE_INVALID',errcode='P0001'; end if;
   perform 1 from public.households where id=invitation.household_id for update;
   select * into invitation from public.household_invites where id=invitation.id for update;
   select lower(btrim(email)) into verified_email from auth.users where id=actor and email_confirmed_at is not null;
   if invitation.created_by=actor or invitation.consumed_at is not null or invitation.revoked_at is not null or invitation.expires_at<=now() or verified_email is null or invitation.target_email<>verified_email then raise exception using message='INVITE_INVALID',errcode='P0001'; end if;
   if (select count(*) from public.household_members where household_id=invitation.household_id)>=2 then raise exception using message='HOUSEHOLD_FULL',errcode='P0001'; end if;
   insert into public.household_members(household_id,user_id,slot,display_name) values(invitation.household_id,actor,2,'Parent 2');
   update public.household_invites set consumed_at=now() where id=invitation.id;
   update public.household_invites set revoked_at=now() where household_id=invitation.household_id and id<>invitation.id and consumed_at is null and revoked_at is null;
   result=private.context(actor);
 elsif p_operation='createChild' then
   if h_id is null then raise exception using message='FORBIDDEN',errcode='P0001'; end if;
   perform 1 from public.households where id=h_id for update;
   if (select count(*) from public.children where household_id=h_id)>=3 then raise exception using message='VALIDATION',errcode='P0001'; end if;
   alias_value=private.valid_text(p_payload->'alias',1,60);
   insert into public.children(household_id,alias) values(h_id,alias_value) returning * into child;
   result=jsonb_build_object('id',child.id,'householdId',child.household_id,'alias',child.alias);
 else
   if h_id is null then raise exception using message='FORBIDDEN',errcode='P0001'; end if;
   if p_operation<>'createDraft' then
     if p_operation='reportReimbursement' then expense_id=(p_payload->>'expenseId')::uuid;
     elsif p_operation='resolveReimbursement' then
       report_id=(p_payload->>'reportId')::uuid;
       select rr.expense_id into expense_id from public.reimbursements rr where rr.id=report_id;
     else expense_id=(p_payload->>'id')::uuid; end if;
     select * into e from public.expenses where id=expense_id for update;
     if not found or e.household_id<>h_id or not private.can_read_expense(e.id,actor) then raise exception using message='FORBIDDEN',errcode='P0001'; end if;
     if p_expected_revision is null or p_expected_revision<0 then raise exception using message='VALIDATION',errcode='P0001'; end if;
     if e.lock_version<>p_expected_revision then raise exception using message='STALE_REVISION',errcode='P0001'; end if;
   end if;
   if p_operation in ('createDraft','saveDraft') then
     if p_operation='saveDraft' then
       if e.paid_by<>actor then raise exception using message='FORBIDDEN',errcode='P0001'; end if;
       if e.status<>'DRAFT' then raise exception using message='INVALID_STATE',errcode='P0001'; end if;
     end if;
     input=p_payload->'input';
     if input is null or jsonb_typeof(input)<>'object' then raise exception using message='VALIDATION',errcode='P0001'; end if;
     perform private.check_keys(input,array['childId','category','description','merchant','expenseDate','amountCents','reviewerShareBps']);
     child_id=(input->>'childId')::uuid;
     select * into child from public.children where id=child_id and household_id=h_id;
     if not found then raise exception using message='FORBIDDEN',errcode='P0001'; end if;
     amount=private.valid_int(input->'amountCents',1,100000000);
     share=private.valid_int(input->'reviewerShareBps',0,10000)::integer;
     category_value=private.valid_text(input->'category',1,30);
     if category_value not in ('SCHOOL','MEDICAL','ACTIVITIES','PURCHASES','OTHER') then raise exception using message='VALIDATION',errcode='P0001'; end if;
     description_value=private.valid_text(input->'description',1,500);
     merchant_value=private.valid_text(input->'merchant',0,200);
     entered_date=private.valid_date(input->>'expenseDate');
     select user_id into reviewer from public.household_members where household_id=h_id and user_id<>actor;
     if p_operation='createDraft' then
       insert into public.expenses(household_id,paid_by,reviewer_id,child_id,child_alias_snapshot,category,description,merchant,expense_date,amount_cents,reviewer_share_bps)
       values(h_id,actor,reviewer,child.id,child.alias,category_value,description_value,merchant_value,entered_date,amount,share) returning * into e;
       perform private.audit(e,actor,'DRAFT_CREATED');
     else
       update public.expenses set reviewer_id=reviewer,child_id=child.id,child_alias_snapshot=child.alias,category=category_value,description=description_value,merchant=merchant_value,expense_date=entered_date,amount_cents=amount,reviewer_share_bps=share,lock_version=lock_version+1 where id=e.id returning * into e;
       perform private.audit(e,actor,'DRAFT_UPDATED');
     end if;
   elsif p_operation='submitExpense' then
     if e.paid_by<>actor then raise exception using message='FORBIDDEN',errcode='P0001'; end if;
     if e.status<>'DRAFT' then raise exception using message='INVALID_STATE',errcode='P0001'; end if;
     select user_id into reviewer from public.household_members where household_id=h_id and user_id<>actor;
     if reviewer is null then raise exception using message='INVALID_STATE',errcode='P0001'; end if;
     if e.receipt_id is not null and not exists(select 1 from public.receipts rr join storage.objects o on o.bucket_id='receipts' and o.name=rr.object_path where rr.id=e.receipt_id) then raise exception using message='UPLOAD_INVALID',errcode='P0001'; end if;
     update public.expenses set reviewer_id=reviewer,status='PENDING',submitted_at=now(),lock_version=lock_version+1 where id=e.id returning * into e;
     perform private.audit(e,actor,'SUBMITTED',e.reviewer_owed_cents);
   elsif p_operation='reviewExpense' then
     if e.reviewer_id is distinct from actor then raise exception using message='FORBIDDEN',errcode='P0001'; end if;
     note_value=private.valid_text(p_payload->'note',0,1000);
     if p_payload->>'decision'='APPROVE' and e.status in ('PENDING','DISPUTED') then
       update public.expenses set status='APPROVED',lock_version=lock_version+1 where id=e.id returning * into e;
       perform private.audit(e,actor,'APPROVED',e.reviewer_owed_cents,note_value);
     elsif p_payload->>'decision'='DISPUTE' and e.status='PENDING' then
       if length(note_value)=0 then raise exception using message='VALIDATION',errcode='P0001'; end if;
       update public.expenses set status='DISPUTED',lock_version=lock_version+1 where id=e.id returning * into e;
       perform private.audit(e,actor,'CONCERN_RAISED',e.reviewer_owed_cents,note_value);
     else raise exception using message='INVALID_STATE',errcode='P0001'; end if;
   elsif p_operation in ('withdrawExpense','replaceExpenseWithDraft') then
     if e.paid_by<>actor then raise exception using message='FORBIDDEN',errcode='P0001'; end if;
     if e.status not in ('DRAFT','PENDING','DISPUTED') or (p_operation='replaceExpenseWithDraft' and e.status='DRAFT') then raise exception using message='INVALID_STATE',errcode='P0001'; end if;
     note_value=private.valid_text(p_payload->'reason',case when e.submitted_at is null then 0 else 1 end,1000);
     if exists(select 1 from public.reimbursements rr where rr.expense_id=e.id) then raise exception using message='INVALID_STATE',errcode='P0001'; end if;
     update public.expenses set status='WITHDRAWN',lock_version=lock_version+1 where id=e.id returning * into e;
     perform private.audit(e,actor,'WITHDRAWN',null,note_value);
     if p_operation='replaceExpenseWithDraft' then
       insert into public.expenses(household_id,paid_by,reviewer_id,child_id,child_alias_snapshot,category,description,merchant,expense_date,amount_cents,reviewer_share_bps,replaces_expense_id)
       values(e.household_id,e.paid_by,e.reviewer_id,e.child_id,e.child_alias_snapshot,e.category,e.description,e.merchant,e.expense_date,e.amount_cents,e.reviewer_share_bps,e.id) returning * into new_e;
       perform private.audit(new_e,actor,'DRAFT_CREATED',null,'Corrected draft'); e=new_e;
     end if;
   elsif p_operation='reportReimbursement' then
     if e.reviewer_id is distinct from actor then raise exception using message='FORBIDDEN',errcode='P0001'; end if;
     if e.status<>'APPROVED' then raise exception using message='INVALID_STATE',errcode='P0001'; end if;
     amount=private.valid_int(p_payload->'amountCents',1,100000000);
     entered_date=private.valid_date(p_payload->>'paidOn');
     merchant_value=private.valid_text(p_payload->'methodLabel',0,100); note_value=private.valid_text(p_payload->'note',0,1000);
     select coalesce(sum(rr.amount_cents),0) into reserved from public.reimbursements rr where rr.expense_id=e.id and rr.status in ('PENDING','CONFIRMED');
     if amount>e.reviewer_owed_cents-reserved then raise exception using message='AMOUNT_EXCEEDS_AVAILABLE',errcode='P0001'; end if;
     insert into public.reimbursements(household_id,expense_id,from_user_id,to_user_id,amount_cents,paid_on,method_label,note) values(h_id,e.id,actor,e.paid_by,amount,entered_date,merchant_value,note_value) returning id into report_id;
     update public.expenses set lock_version=lock_version+1 where id=e.id returning * into e;
     perform private.audit(e,actor,'PAYMENT_REPORTED',amount,note_value,report_id);
   elsif p_operation='resolveReimbursement' then
     if e.paid_by<>actor then raise exception using message='FORBIDDEN',errcode='P0001'; end if;
     if e.status<>'APPROVED' then raise exception using message='INVALID_STATE',errcode='P0001'; end if;
     select * into r from public.reimbursements rr where rr.id=report_id and rr.expense_id=e.id for update;
     if not found or r.status<>'PENDING' then raise exception using message='INVALID_STATE',errcode='P0001'; end if;
     if p_payload->>'decision' not in ('CONFIRM','REJECT') or p_payload->>'decision' is null then raise exception using message='VALIDATION',errcode='P0001'; end if;
     note_value=private.valid_text(p_payload->'note',case when p_payload->>'decision'='REJECT' then 1 else 0 end,1000);
     update public.reimbursements set status=case when p_payload->>'decision'='CONFIRM' then 'CONFIRMED' else 'REJECTED' end,resolved_at=now() where id=r.id;
     update public.expenses set lock_version=lock_version+1 where id=e.id returning * into e;
     perform private.audit(e,actor,case when p_payload->>'decision'='CONFIRM' then 'PAYMENT_CONFIRMED' else 'PAYMENT_REJECTED' end,r.amount_cents,note_value,r.id);
   end if;
   result=private.detail(e.id);
 end if;
 perform private.store_result(actor,p_operation,p_idempotency_key,payload_hash,result);
 return result;
exception when invalid_text_representation or numeric_value_out_of_range or invalid_datetime_format or datetime_field_overflow or not_null_violation or check_violation or foreign_key_violation then
 raise exception using message='VALIDATION',errcode='P0001';
end $$;

-- These three RPCs are service_role-only. Edge functions authenticate the bearer
-- through Auth /user and pass that verified ID; browser payloads never supply it.
create function public.ledger_receipt_preflight(p_actor_id uuid,p_draft_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if auth.role() is distinct from 'service_role' then raise exception using message='FORBIDDEN',errcode='P0001'; end if;
 if not exists(select 1 from public.expenses e join public.household_members m on m.household_id=e.household_id where e.id=p_draft_id and e.paid_by=p_actor_id and m.user_id=p_actor_id) then raise exception using message='FORBIDDEN',errcode='P0001'; end if;
 -- Published owners may retry a previously committed upload. Finalize checks replay first.
 return '{"ok":true}'::jsonb;
end $$;
create function public.ledger_receipt_finalize(p_actor_id uuid,p_draft_id uuid,p_expected_revision integer,p_idempotency_key text,p_receipt_id uuid,p_object_path text,p_mime_type text,p_size_bytes integer,p_sha256 text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare e public.expenses; payload_hash text; result jsonb;
begin
 if auth.role() is distinct from 'service_role' then raise exception using message='FORBIDDEN',errcode='P0001'; end if;
 perform public.ledger_receipt_preflight(p_actor_id,p_draft_id);
 payload_hash=private.request_hash(jsonb_build_object('draftId',p_draft_id,'mimeType',p_mime_type,'sizeBytes',p_size_bytes,'sha256',p_sha256),p_expected_revision);
 result=private.replay(p_actor_id,'uploadReceipt',p_idempotency_key,payload_hash);
 if result is not null then return result; end if;
 select * into e from public.expenses where id=p_draft_id for update;
 if e.paid_by<>p_actor_id or not private.can_read_expense(e.id,p_actor_id) then raise exception using message='FORBIDDEN',errcode='P0001'; end if;
 if e.status<>'DRAFT' then raise exception using message='INVALID_STATE',errcode='P0001'; end if;
 if p_expected_revision is null or e.lock_version<>p_expected_revision then raise exception using message='STALE_REVISION',errcode='P0001'; end if;
 if p_receipt_id is null or p_object_path is null or p_object_path !~ '^[0-9a-f-]{36}\.(jpg|png|webp)$' or p_mime_type is null or p_mime_type not in ('image/jpeg','image/png','image/webp') or p_size_bytes is null or p_size_bytes not between 1 and 5242880 or p_sha256 is null or p_sha256 !~ '^[a-f0-9]{64}$' or not exists(select 1 from storage.objects where bucket_id='receipts' and name=p_object_path) then raise exception using message='UPLOAD_INVALID',errcode='P0001'; end if;
 insert into public.receipts(id,household_id,expense_id,object_path,mime_type,size_bytes,sha256) values(p_receipt_id,e.household_id,e.id,p_object_path,p_mime_type,p_size_bytes,p_sha256);
 update public.expenses set receipt_id=p_receipt_id,lock_version=lock_version+1 where id=e.id returning * into e;
 perform private.audit(e,p_actor_id,'RECEIPT_ATTACHED');
 result=private.detail(e.id);
 perform private.store_result(p_actor_id,'uploadReceipt',p_idempotency_key,payload_hash,result);
 return result;
end $$;
create function public.ledger_receipt_lookup(p_actor_id uuid,p_receipt_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare r public.receipts;
begin
 if auth.role() is distinct from 'service_role' then raise exception using message='FORBIDDEN',errcode='P0001'; end if;
 select rr.* into r from public.receipts rr join public.expenses e on e.receipt_id=rr.id where rr.id=p_receipt_id and private.can_read_expense(e.id,p_actor_id);
 if not found then raise exception using message='FORBIDDEN',errcode='P0001'; end if;
 return jsonb_build_object('objectPath',r.object_path,'mimeType',r.mime_type);
end $$;

-- No client can upload, overwrite, list, sign or delete receipt objects directly.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('receipts','receipts',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy receipts_no_client_access on storage.objects as restrictive for all to anon,authenticated using(bucket_id<>'receipts') with check(bucket_id<>'receipts');

revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.current_household() to authenticated;
revoke all on function public.ledger_read(text,uuid),public.ledger_create_invite(text,text),public.ledger_command(text,jsonb,integer,text),public.ledger_receipt_preflight(uuid,uuid),public.ledger_receipt_finalize(uuid,uuid,integer,text,uuid,text,text,integer,text),public.ledger_receipt_lookup(uuid,uuid) from public,anon,authenticated;
grant execute on function public.ledger_read(text,uuid),public.ledger_create_invite(text,text),public.ledger_command(text,jsonb,integer,text) to authenticated;
grant execute on function public.ledger_receipt_preflight(uuid,uuid),public.ledger_receipt_finalize(uuid,uuid,integer,text,uuid,text,text,integer,text),public.ledger_receipt_lookup(uuid,uuid) to service_role;
commit;
