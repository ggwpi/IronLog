-- Credentials and pending AI proposals never enter synced profile state or browser Data API.
create table ironlog.coach (
  user_id text primary key references ironlog.accounts(id) on delete cascade,
  config jsonb not null default '{}'::jsonb,
  secret text,
  state jsonb not null default '{}'::jsonb,
  version bigint not null default 0,
  updated_at timestamptz not null default now(),
  check(jsonb_typeof(config)='object' and jsonb_typeof(state)='object')
);
alter table ironlog.coach enable row level security;
revoke all on ironlog.coach from public;
do $$ declare browser text; begin
  foreach browser in array array['anon','authenticated','authenticator'] loop
    if exists(select 1 from pg_roles where rolname=browser) then
      execute format('revoke all on ironlog.coach from %I',browser);
    end if;
  end loop;
end $$;
grant select, insert, update, delete on ironlog.coach to ironlog_backend;
create policy backend_only on ironlog.coach for all to ironlog_backend using(true) with check(true);
