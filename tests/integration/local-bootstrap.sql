-- ONLY for a fresh disposable vanilla PostgreSQL cluster, never a Supabase project.
-- Minimal platform roles/schema let the migration and RLS run on real PostgreSQL.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create schema storage;
create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb default '{}'::jsonb);
create function auth.uid() returns uuid language sql stable as $$ select (nullif(current_setting('request.jwt.claims',true),'')::jsonb ->> 'sub')::uuid $$;
create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claims',true),'')::jsonb ->> 'role' $$;
grant usage on schema auth, public to anon,authenticated,service_role;
grant execute on function auth.uid(), auth.role() to anon,authenticated,service_role;
create table storage.buckets(id text primary key,name text not null,public boolean default false,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text not null,metadata jsonb,unique(bucket_id,name));
alter table storage.objects enable row level security;
grant all on storage.objects,storage.buckets to service_role;
grant select,insert,update,delete on storage.objects to anon,authenticated;
grant usage on schema storage to anon,authenticated,service_role;
