create table ironlog.coach_connections (
  id text primary key,
  user_id text not null references ironlog.accounts(id) on delete cascade,
  name text not null check(length(btrim(name)) between 1 and 80),
  config jsonb not null check(jsonb_typeof(config)='object'),
  secret text,
  revision bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index coach_connections_owner on ironlog.coach_connections(user_id,created_at);
alter table ironlog.coach_connections enable row level security;
revoke all on ironlog.coach_connections from public;
do $$ declare browser text; begin
  foreach browser in array array['anon','authenticated','authenticator'] loop
    if exists(select 1 from pg_roles where rolname=browser) then
      execute format('revoke all on ironlog.coach_connections from %I',browser);
    end if;
  end loop;
end $$;
grant select,insert,update,delete on ironlog.coach_connections to ironlog_backend;
create policy backend_only on ironlog.coach_connections for all to ironlog_backend using(true) with check(true);
