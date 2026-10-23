-- IronLog's own identity system. No public tables or Supabase Auth identities.
create schema if not exists ironlog;
revoke all on schema ironlog from public;
do $$ begin
  if not exists(select 1 from pg_roles where rolname='ironlog_backend') then
    create role ironlog_backend nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
  end if;
end $$;
-- Managed Supabase's postgres role cannot ALTER SUPERUSER attributes. Validate an
-- existing role instead of issuing a redundant ALTER that requires a superuser.
do $$ begin
  if exists(select 1 from pg_roles where rolname='ironlog_backend' and
    (rolcanlogin or rolsuper or rolcreatedb or rolcreaterole or rolinherit or rolbypassrls)) then
    raise exception 'ironlog_backend has unexpected privileges; inspect before provisioning';
  end if;
end $$;
do $$ declare browser text; begin
  foreach browser in array array['anon','authenticated','authenticator'] loop
    if exists(select 1 from pg_roles where rolname=browser) then
      execute format('revoke ironlog_backend from %I',browser);
    end if;
  end loop;
end $$;
grant ironlog_backend to postgres;
grant usage on schema ironlog to ironlog_backend;
create table ironlog.accounts (
  id text primary key,
  data jsonb not null check(jsonb_typeof(data)='object' and data->>'id'=id),
  name_key text generated always as (data->>'loginKey') stored,
  email_key text generated always as (lower(btrim(data->>'email'))) stored,
  created_at timestamptz not null default now(),
  unique(name_key), unique(email_key)
);
create table ironlog.identities(key text primary key,user_id text not null references ironlog.accounts(id) on delete cascade);
create index identities_user on ironlog.identities(user_id);
create table ironlog.credentials (
  id text primary key, user_id text not null references ironlog.accounts(id) on delete cascade,
  data jsonb not null check(data->>'id'=id and data->>'userId'=user_id)
);
create index credentials_user on ironlog.credentials(user_id);
create table ironlog.profiles (
  user_id text primary key references ironlog.accounts(id) on delete cascade,
  state jsonb not null check(jsonb_typeof(state)='object' and not(state?'active')),
  revision bigint not null default 0 check(revision>=0), write_id text,
  updated_at timestamptz not null default now()
);
create table ironlog.invites(code text primary key,data jsonb not null);
create table ironlog.tokens (
  hash text primary key,purpose text not null,user_id text references ironlog.accounts(id) on delete cascade,
  data jsonb not null,expires timestamptz not null
);
create index tokens_expiry on ironlog.tokens(expires);
create index tokens_user on ironlog.tokens(user_id,purpose);
create table ironlog.limits(key text primary key,hits integer not null,expires timestamptz not null);
create index limits_expiry on ironlog.limits(expires);
create table ironlog.subscriptions (
  endpoint_hash text primary key,user_id text not null references ironlog.accounts(id) on delete cascade,
  data jsonb not null,updated_at timestamptz not null default now()
);
create index subscriptions_user on ironlog.subscriptions(user_id);
create table ironlog.presence (
  user_id text primary key references ironlog.accounts(id) on delete cascade,
  data jsonb not null,expires timestamptz not null
);
create table ironlog.jobs (
  id text primary key,kind text not null,payload jsonb not null,
  due_at timestamptz not null,lease_until timestamptz,attempts integer not null default 0,
  done_at timestamptz,last_error text,created_at timestamptz not null default now()
);
create index jobs_due on ironlog.jobs(due_at) where done_at is null;
create table ironlog.media (
  user_id text not null references ironlog.accounts(id) on delete cascade,
  hash text not null check(hash~'^[0-9a-f]{64}$'),path text not null unique,
  mime text not null,size bigint not null check(size>0),
  unreferenced_since timestamptz,created_at timestamptz not null default now(),
  primary key(user_id,hash)
);
create index media_gc on ironlog.media(unreferenced_since) where unreferenced_since is not null;
create table ironlog.transfers (
  id text primary key,user_id text not null references ironlog.accounts(id) on delete cascade,
  kind text not null check(kind in ('media','snapshot')),path text not null unique,
  data jsonb not null,expires timestamptz not null,completed_at timestamptz
);
create index transfers_user on ironlog.transfers(user_id,expires);
create index transfers_expiry on ironlog.transfers(expires);
create table ironlog.audit (
  id bigint generated always as identity primary key,
  event text not null,user_id text,data jsonb not null,at timestamptz not null default now()
);
create index audit_at on ironlog.audit(at);
create table ironlog.settings(key text primary key,value jsonb not null);
insert into ironlog.settings values('generation','"ironlog-cloud-1"');
-- Custom sessions are checked in the backend. Browser roles have NO privileges,
-- and the server's non-bypass role has explicit policies instead of auth.uid().
do $$ declare t text; begin
  foreach t in array array['accounts','identities','credentials','profiles','invites','tokens','limits','subscriptions','presence','jobs','media','transfers','audit','settings'] loop
    execute format('alter table ironlog.%I enable row level security',t);
    execute format('create policy backend_only on ironlog.%I to ironlog_backend using(true) with check(true)',t);
    execute format('grant select,insert,update,delete on ironlog.%I to ironlog_backend',t);
  end loop;
end $$;
grant usage,select on all sequences in schema ironlog to ironlog_backend;
revoke all on all tables in schema ironlog from public;
revoke all on all sequences in schema ironlog from public;
-- Storage buckets and Cron are installed by the explicit provisioning command;
-- this schema migration is also runnable on stock Postgres for integration tests.
