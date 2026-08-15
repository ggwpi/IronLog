begin;

create schema if not exists private;

create type public.exercise_tracking_type as enum ('weight_reps', 'reps', 'duration', 'distance');
create type public.exercise_muscle_role as enum ('primary', 'secondary', 'stabilizer');
create type public.workout_status as enum ('draft', 'active', 'completed', 'cancelled');
create type public.training_cycle_status as enum ('planned', 'active', 'completed', 'cancelled');
create type public.set_type as enum ('warmup', 'working', 'backoff', 'drop', 'failure', 'amrap');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  avatar_url text,
  timezone text not null default 'Asia/Jerusalem',
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.muscles (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  name_he text,
  region text not null,
  created_at timestamptz not null default now()
);

create table public.exercises (
  id bigint generated always as identity primary key,
  owner_user_id uuid references auth.users(id) on delete cascade,
  slug text,
  name text not null check (length(trim(name)) between 2 and 120),
  name_he text,
  equipment text,
  tracking_type public.exercise_tracking_type not null default 'weight_reps',
  is_system boolean not null default false,
  instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint exercises_system_owner_check check (
    (is_system and owner_user_id is null and slug is not null)
    or (not is_system and owner_user_id is not null)
  )
);

create unique index exercises_system_slug_uidx on public.exercises(slug) where is_system;
create unique index exercises_owner_name_uidx on public.exercises(owner_user_id, lower(name)) where archived_at is null and not is_system;
create index exercises_owner_user_id_idx on public.exercises(owner_user_id) where owner_user_id is not null;

create table public.exercise_muscles (
  exercise_id bigint not null references public.exercises(id) on delete cascade,
  muscle_id bigint not null references public.muscles(id) on delete restrict,
  role public.exercise_muscle_role not null,
  volume_credit numeric(3,2) not null check (volume_credit > 0 and volume_credit <= 1),
  created_at timestamptz not null default now(),
  primary key (exercise_id, muscle_id)
);
create index exercise_muscles_muscle_id_idx on public.exercise_muscles(muscle_id);

create table public.training_programs (
  id bigint generated always as identity primary key,
  owner_user_id uuid references auth.users(id) on delete cascade,
  slug text,
  name text not null check (length(trim(name)) between 2 and 120),
  description text,
  planned_weeks smallint check (planned_weeks between 1 and 104),
  version smallint not null default 1 check (version > 0),
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint programs_system_owner_check check (
    (is_system and owner_user_id is null and slug is not null)
    or (not is_system and owner_user_id is not null)
  )
);
create unique index training_programs_system_slug_uidx on public.training_programs(slug) where is_system;
create index training_programs_owner_user_id_idx on public.training_programs(owner_user_id) where owner_user_id is not null;

create table public.workout_templates (
  id bigint generated always as identity primary key,
  program_id bigint references public.training_programs(id) on delete set null,
  owner_user_id uuid references auth.users(id) on delete cascade,
  slug text,
  code text,
  name text not null check (length(trim(name)) between 2 and 120),
  description text,
  weekday smallint check (weekday between 0 and 6),
  position smallint not null default 0 check (position >= 0),
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint templates_system_owner_check check (
    (is_system and owner_user_id is null and slug is not null)
    or (not is_system and owner_user_id is not null)
  )
);
create unique index workout_templates_system_slug_uidx on public.workout_templates(slug) where is_system;
create index workout_templates_program_id_idx on public.workout_templates(program_id);
create index workout_templates_owner_user_id_idx on public.workout_templates(owner_user_id) where owner_user_id is not null;

create table public.template_exercises (
  id bigint generated always as identity primary key,
  template_id bigint not null references public.workout_templates(id) on delete cascade,
  exercise_id bigint not null references public.exercises(id) on delete restrict,
  position smallint not null check (position > 0),
  planned_sets smallint not null check (planned_sets between 1 and 20),
  target_reps text not null,
  rep_min smallint check (rep_min is null or rep_min > 0),
  rep_max smallint check (rep_max is null or rep_max >= rep_min),
  target_rir_min numeric(3,1) check (target_rir_min between 0 and 10),
  target_rir_max numeric(3,1) check (target_rir_max between target_rir_min and 10),
  rest_min_seconds smallint check (rest_min_seconds > 0),
  rest_max_seconds smallint check (rest_max_seconds >= rest_min_seconds),
  notes text,
  created_at timestamptz not null default now(),
  unique (template_id, position)
);
create index template_exercises_exercise_id_idx on public.template_exercises(exercise_id);

create table public.training_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id bigint references public.training_programs(id) on delete set null,
  name text not null,
  starts_on date not null,
  planned_weeks smallint not null check (planned_weeks between 1 and 104),
  status public.training_cycle_status not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index training_cycles_user_id_idx on public.training_cycles(user_id);
create index training_cycles_program_id_idx on public.training_cycles(program_id) where program_id is not null;

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id bigint references public.workout_templates(id) on delete set null,
  cycle_id uuid references public.training_cycles(id) on delete set null,
  template_name text,
  status public.workout_status not null default 'draft',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (completed_at is null or completed_at >= started_at)
);
create index workout_sessions_user_started_idx on public.workout_sessions(user_id, started_at desc);
create index workout_sessions_template_id_idx on public.workout_sessions(template_id) where template_id is not null;
create index workout_sessions_cycle_id_idx on public.workout_sessions(cycle_id) where cycle_id is not null;

create table public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id bigint not null references public.exercises(id) on delete restrict,
  template_exercise_id bigint references public.template_exercises(id) on delete set null,
  position smallint not null check (position > 0),
  exercise_name text not null,
  planned_sets smallint,
  target_reps text,
  target_rir_min numeric(3,1),
  target_rir_max numeric(3,1),
  rest_min_seconds smallint,
  rest_max_seconds smallint,
  created_at timestamptz not null default now(),
  unique (session_id, position)
);
create index session_exercises_user_id_idx on public.session_exercises(user_id);
create index session_exercises_session_id_idx on public.session_exercises(session_id);
create index session_exercises_exercise_id_idx on public.session_exercises(exercise_id);

create table public.performed_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  session_exercise_id uuid not null references public.session_exercises(id) on delete cascade,
  exercise_id bigint not null references public.exercises(id) on delete restrict,
  set_number smallint not null check (set_number between 1 and 100),
  set_type public.set_type not null default 'working',
  load_kg numeric(7,3) check (load_kg is null or load_kg >= 0),
  reps smallint check (reps is null or reps >= 0),
  rir numeric(3,1) check (rir is null or rir between 0 and 10),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  distance_meters numeric(10,2) check (distance_meters is null or distance_meters >= 0),
  rest_seconds integer check (rest_seconds is null or rest_seconds >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  completed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_exercise_id, set_number),
  check (completed_at is null or started_at is null or completed_at >= started_at)
);
create index performed_sets_user_completed_idx on public.performed_sets(user_id, completed_at desc) where completed;
create index performed_sets_session_id_idx on public.performed_sets(session_id);
create index performed_sets_session_exercise_id_idx on public.performed_sets(session_exercise_id);
create index performed_sets_exercise_completed_idx on public.performed_sets(exercise_id, completed_at desc) where completed;

create table public.body_weight_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_at timestamptz not null default now(),
  weight_kg numeric(6,3) not null check (weight_kg between 20 and 500),
  context text,
  notes text,
  created_at timestamptz not null default now()
);
create index body_weight_user_measured_idx on public.body_weight_measurements(user_id, measured_at desc);

create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_at timestamptz not null default now(),
  measurement_type text not null check (measurement_type in ('waist', 'chest', 'arm_left', 'arm_right', 'thigh_left', 'thigh_right', 'calf_left', 'calf_right', 'hips', 'body_fat')),
  value numeric(7,3) not null check (value > 0),
  unit text not null check (unit in ('cm', 'percent')),
  notes text,
  created_at timestamptz not null default now()
);
create index body_measurements_user_measured_idx on public.body_measurements(user_id, measured_at desc);

create table public.recovery_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  sleep_minutes smallint check (sleep_minutes between 0 and 1440),
  readiness smallint check (readiness between 1 and 7),
  fatigue smallint check (fatigue between 1 and 7),
  soreness smallint check (soreness between 1 and 7),
  stress smallint check (stress between 1 and 7),
  resting_heart_rate smallint check (resting_heart_rate between 20 and 250),
  hrv_ms numeric(7,2) check (hrv_ms is null or hrv_ms >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);
create index recovery_logs_user_date_idx on public.recovery_logs(user_id, log_date desc);

create table public.nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  calories integer check (calories is null or calories >= 0),
  protein_g numeric(7,2) check (protein_g is null or protein_g >= 0),
  carbs_g numeric(7,2) check (carbs_g is null or carbs_g >= 0),
  fat_g numeric(7,2) check (fat_g is null or fat_g >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);
create index nutrition_logs_user_date_idx on public.nutrition_logs(user_id, log_date desc);

create table public.metric_definitions (
  id bigint generated always as identity primary key,
  code text not null,
  version smallint not null check (version > 0),
  name text not null,
  description text not null,
  formula text,
  parameters jsonb not null default '{}'::jsonb,
  active_from date not null default current_date,
  retired_at date,
  created_at timestamptz not null default now(),
  unique (code, version)
);

create or replace function private.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    email = coalesce(excluded.email, public.profiles.email),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger exercises_set_updated_at before update on public.exercises for each row execute function private.set_updated_at();
create trigger programs_set_updated_at before update on public.training_programs for each row execute function private.set_updated_at();
create trigger templates_set_updated_at before update on public.workout_templates for each row execute function private.set_updated_at();
create trigger cycles_set_updated_at before update on public.training_cycles for each row execute function private.set_updated_at();
create trigger sessions_set_updated_at before update on public.workout_sessions for each row execute function private.set_updated_at();
create trigger sets_set_updated_at before update on public.performed_sets for each row execute function private.set_updated_at();
create trigger recovery_set_updated_at before update on public.recovery_logs for each row execute function private.set_updated_at();
create trigger nutrition_set_updated_at before update on public.nutrition_logs for each row execute function private.set_updated_at();

create trigger on_auth_user_created after insert or update of raw_user_meta_data, email on auth.users
for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.muscles enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_muscles enable row level security;
alter table public.training_programs enable row level security;
alter table public.workout_templates enable row level security;
alter table public.template_exercises enable row level security;
alter table public.training_cycles enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.session_exercises enable row level security;
alter table public.performed_sets enable row level security;
alter table public.body_weight_measurements enable row level security;
alter table public.body_measurements enable row level security;
alter table public.recovery_logs enable row level security;
alter table public.nutrition_logs enable row level security;
alter table public.metric_definitions enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy muscles_read_all on public.muscles for select to anon, authenticated using (true);
create policy metric_definitions_read_all on public.metric_definitions for select to anon, authenticated using (true);

create policy exercises_read_system_anon on public.exercises for select to anon using (is_system and archived_at is null);
create policy exercises_read_visible on public.exercises for select to authenticated using (is_system or owner_user_id = (select auth.uid()));
create policy exercises_insert_own on public.exercises for insert to authenticated with check (not is_system and owner_user_id = (select auth.uid()));
create policy exercises_update_own on public.exercises for update to authenticated using (not is_system and owner_user_id = (select auth.uid())) with check (not is_system and owner_user_id = (select auth.uid()));
create policy exercises_delete_own_unused on public.exercises for delete to authenticated using (not is_system and owner_user_id = (select auth.uid()));

create policy exercise_muscles_read_system_anon on public.exercise_muscles for select to anon using (exists (select 1 from public.exercises e where e.id = exercise_id and e.is_system and e.archived_at is null));
create policy exercise_muscles_read_visible on public.exercise_muscles for select to authenticated using (exists (select 1 from public.exercises e where e.id = exercise_id and (e.is_system or e.owner_user_id = (select auth.uid()))));
create policy exercise_muscles_insert_own on public.exercise_muscles for insert to authenticated with check (exists (select 1 from public.exercises e where e.id = exercise_id and not e.is_system and e.owner_user_id = (select auth.uid())));
create policy exercise_muscles_update_own on public.exercise_muscles for update to authenticated using (exists (select 1 from public.exercises e where e.id = exercise_id and not e.is_system and e.owner_user_id = (select auth.uid()))) with check (exists (select 1 from public.exercises e where e.id = exercise_id and not e.is_system and e.owner_user_id = (select auth.uid())));
create policy exercise_muscles_delete_own on public.exercise_muscles for delete to authenticated using (exists (select 1 from public.exercises e where e.id = exercise_id and not e.is_system and e.owner_user_id = (select auth.uid())));

create policy programs_read_system_anon on public.training_programs for select to anon using (is_system and archived_at is null);
create policy programs_read_visible on public.training_programs for select to authenticated using (is_system or owner_user_id = (select auth.uid()));
create policy programs_insert_own on public.training_programs for insert to authenticated with check (not is_system and owner_user_id = (select auth.uid()));
create policy programs_update_own on public.training_programs for update to authenticated using (not is_system and owner_user_id = (select auth.uid())) with check (not is_system and owner_user_id = (select auth.uid()));
create policy programs_delete_own on public.training_programs for delete to authenticated using (not is_system and owner_user_id = (select auth.uid()));

create policy templates_read_system_anon on public.workout_templates for select to anon using (is_system and archived_at is null);
create policy templates_read_visible on public.workout_templates for select to authenticated using (is_system or owner_user_id = (select auth.uid()));
create policy templates_insert_own on public.workout_templates for insert to authenticated with check (not is_system and owner_user_id = (select auth.uid()));
create policy templates_update_own on public.workout_templates for update to authenticated using (not is_system and owner_user_id = (select auth.uid())) with check (not is_system and owner_user_id = (select auth.uid()));
create policy templates_delete_own on public.workout_templates for delete to authenticated using (not is_system and owner_user_id = (select auth.uid()));

create policy template_exercises_read_system_anon on public.template_exercises for select to anon using (exists (select 1 from public.workout_templates t where t.id = template_id and t.is_system and t.archived_at is null));
create policy template_exercises_read_visible on public.template_exercises for select to authenticated using (exists (select 1 from public.workout_templates t where t.id = template_id and (t.is_system or t.owner_user_id = (select auth.uid()))));
create policy template_exercises_insert_own on public.template_exercises for insert to authenticated with check (exists (select 1 from public.workout_templates t where t.id = template_id and not t.is_system and t.owner_user_id = (select auth.uid())));
create policy template_exercises_update_own on public.template_exercises for update to authenticated using (exists (select 1 from public.workout_templates t where t.id = template_id and not t.is_system and t.owner_user_id = (select auth.uid()))) with check (exists (select 1 from public.workout_templates t where t.id = template_id and not t.is_system and t.owner_user_id = (select auth.uid())));
create policy template_exercises_delete_own on public.template_exercises for delete to authenticated using (exists (select 1 from public.workout_templates t where t.id = template_id and not t.is_system and t.owner_user_id = (select auth.uid())));

create policy cycles_own_all on public.training_cycles for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy sessions_own_all on public.workout_sessions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy session_exercises_own_all on public.session_exercises for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy sets_own_all on public.performed_sets for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy weight_own_all on public.body_weight_measurements for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy measurements_own_all on public.body_measurements for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy recovery_own_all on public.recovery_logs for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy nutrition_own_all on public.nutrition_logs for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.muscles, public.exercises, public.exercise_muscles, public.training_programs, public.workout_templates, public.template_exercises, public.metric_definitions to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant insert, update, delete on public.exercises, public.exercise_muscles, public.training_programs, public.workout_templates, public.template_exercises to authenticated;
grant select, insert, update, delete on public.training_cycles, public.workout_sessions, public.session_exercises, public.performed_sets, public.body_weight_measurements, public.body_measurements, public.recovery_logs, public.nutrition_logs to authenticated;
grant usage, select on all sequences in schema public to authenticated;

insert into public.muscles (slug, name, name_he, region) values
('chest','Chest','חזה','upper'),('upper-chest','Upper Chest','חזה עליון','upper'),('lats','Latissimus Dorsi','רחב גבי','upper'),('upper-back','Upper Back','גב עליון','upper'),
('front-delts','Front Delts','כתף קדמית','upper'),('side-delts','Side Delts','כתף צדית','upper'),('rear-delts','Rear Delts','כתף אחורית','upper'),
('biceps','Biceps','יד קדמית','upper'),('triceps','Triceps','יד אחורית','upper'),('forearms','Forearms','אמות','upper'),
('quads','Quadriceps','ארבע ראשי','lower'),('hamstrings','Hamstrings','המסטרינג','lower'),('glutes','Glutes','ישבן','lower'),('calves','Calves','תאומים','lower'),('core','Core','ליבה','core')
on conflict (slug) do update set name=excluded.name, name_he=excluded.name_he, region=excluded.region;

insert into public.exercises (slug,name,equipment,tracking_type,is_system) values
('incline-smith','Incline Smith Press','smith_machine','weight_reps',true),('chest-press-machine','Chest Press Machine','machine','weight_reps',true),
('pec-deck','Pec Deck','machine','weight_reps',true),('cable-fly','Cable Fly','cable','weight_reps',true),('ez-curl','EZ Bar Curl','barbell','weight_reps',true),
('incline-db-curl','Incline Dumbbell Curl','dumbbell','weight_reps',true),('hammer-curl','Hammer Curl','dumbbell','weight_reps',true),
('hack-squat','Hack Squat','machine','weight_reps',true),('romanian-deadlift','Romanian Deadlift','barbell','weight_reps',true),('leg-press','Leg Press','machine','weight_reps',true),
('bulgarian-split-squat','Bulgarian Split Squat','dumbbell','weight_reps',true),('lying-leg-curl','Lying Leg Curl','machine','weight_reps',true),
('standing-calf-raise','Standing Calf Raise','machine','weight_reps',true),('hanging-leg-raise','Hanging Leg Raise','bodyweight','reps',true),('cable-crunch','Cable Crunch','cable','weight_reps',true),
('pull-up','Pull-up','bodyweight','reps',true),('chest-supported-row','Chest Supported Row','machine','weight_reps',true),('lat-pulldown','Lat Pulldown','cable','weight_reps',true),
('seated-cable-row','Seated Cable Row','cable','weight_reps',true),('face-pull','Face Pull','cable','weight_reps',true),('rope-pushdown','Rope Pushdown','cable','weight_reps',true),
('overhead-cable-extension','Overhead Cable Extension','cable','weight_reps',true),('machine-dip','Machine Dip','machine','weight_reps',true),
('shoulder-press-machine','Shoulder Press Machine','machine','weight_reps',true),('cable-lateral-raise','Cable Lateral Raise','cable','weight_reps',true),
('rear-delt-fly-machine','Rear Delt Fly Machine','machine','weight_reps',true),('incline-chest-press-machine','Incline Chest Press Machine','machine','weight_reps',true),
('leg-extension','Leg Extension','machine','weight_reps',true),('seated-leg-curl','Seated Leg Curl','machine','weight_reps',true),('walking-lunge','Walking Lunge','dumbbell','reps',true),
('seated-calf-raise','Seated Calf Raise','machine','weight_reps',true),('ab-wheel','Ab Wheel','bodyweight','reps',true),('plank','Plank','bodyweight','duration',true),
('barbell-curl','Barbell Curl','barbell','weight_reps',true),('preacher-curl','Preacher Curl','machine','weight_reps',true),('cable-curl','Cable Curl','cable','weight_reps',true),
('ez-skull-crusher','EZ Bar Skull Crusher','barbell','weight_reps',true),('dumbbell-lateral-raise','Dumbbell Lateral Raise','dumbbell','weight_reps',true)
on conflict (slug) where is_system do update set name=excluded.name,equipment=excluded.equipment,tracking_type=excluded.tracking_type,updated_at=now();

insert into public.exercise_muscles (exercise_id,muscle_id,role,volume_credit)
select e.id,m.id,v.role::public.exercise_muscle_role,v.credit
from (values
('incline-smith','upper-chest','primary',1.0),('incline-smith','triceps','secondary',0.5),('incline-smith','front-delts','secondary',0.5),
('chest-press-machine','chest','primary',1.0),('chest-press-machine','triceps','secondary',0.5),('pec-deck','chest','primary',1.0),('cable-fly','chest','primary',1.0),
('ez-curl','biceps','primary',1.0),('incline-db-curl','biceps','primary',1.0),('hammer-curl','biceps','primary',1.0),('hammer-curl','forearms','secondary',0.5),
('hack-squat','quads','primary',1.0),('hack-squat','glutes','secondary',0.5),('romanian-deadlift','hamstrings','primary',1.0),('romanian-deadlift','glutes','secondary',0.5),
('leg-press','quads','primary',1.0),('leg-press','glutes','secondary',0.5),('bulgarian-split-squat','quads','primary',1.0),('bulgarian-split-squat','glutes','secondary',0.5),
('lying-leg-curl','hamstrings','primary',1.0),('standing-calf-raise','calves','primary',1.0),('hanging-leg-raise','core','primary',1.0),('cable-crunch','core','primary',1.0),
('pull-up','lats','primary',1.0),('pull-up','biceps','secondary',0.5),('chest-supported-row','upper-back','primary',1.0),('chest-supported-row','biceps','secondary',0.5),
('lat-pulldown','lats','primary',1.0),('lat-pulldown','biceps','secondary',0.5),('seated-cable-row','upper-back','primary',1.0),('seated-cable-row','biceps','secondary',0.5),
('face-pull','rear-delts','primary',1.0),('face-pull','upper-back','secondary',0.5),('rope-pushdown','triceps','primary',1.0),('overhead-cable-extension','triceps','primary',1.0),
('machine-dip','triceps','primary',1.0),('machine-dip','chest','secondary',0.5),('shoulder-press-machine','front-delts','primary',1.0),('shoulder-press-machine','triceps','secondary',0.5),
('cable-lateral-raise','side-delts','primary',1.0),('rear-delt-fly-machine','rear-delts','primary',1.0),('incline-chest-press-machine','upper-chest','primary',1.0),
('incline-chest-press-machine','triceps','secondary',0.5),('leg-extension','quads','primary',1.0),('seated-leg-curl','hamstrings','primary',1.0),
('walking-lunge','quads','primary',1.0),('walking-lunge','glutes','secondary',0.5),('seated-calf-raise','calves','primary',1.0),('ab-wheel','core','primary',1.0),('plank','core','primary',1.0),
('barbell-curl','biceps','primary',1.0),('preacher-curl','biceps','primary',1.0),('cable-curl','biceps','primary',1.0),('ez-skull-crusher','triceps','primary',1.0),('dumbbell-lateral-raise','side-delts','primary',1.0)
) as v(exercise_slug,muscle_slug,role,credit)
join public.exercises e on e.slug=v.exercise_slug and e.is_system
join public.muscles m on m.slug=v.muscle_slug
on conflict (exercise_id,muscle_id) do update set role=excluded.role,volume_credit=excluded.volume_credit;

insert into public.training_programs (slug,name,description,planned_weeks,version,is_system)
values ('ironlog-6-day-hypertrophy-v1','IronLog 6-Day Hypertrophy','Research-informed starter program. The database remains generic; this is only the first preset.',12,1,true)
on conflict (slug) where is_system do update set name=excluded.name,description=excluded.description,planned_weeks=excluded.planned_weeks,version=excluded.version,updated_at=now();

insert into public.workout_templates (program_id,slug,code,name,description,weekday,position,is_system)
select p.id,v.slug,v.code,v.name,v.description,v.weekday,v.position,true
from public.training_programs p cross join (values
('push-a','PUSH A','Chest + Biceps','חזה + יד קדמית',1,1),('legs-a','LEGS A','Legs Heavy + Abs','רגליים כבד + בטן',2,2),
('pull-a','PULL A','Back + Triceps','גב + יד אחורית',3,3),('push-b','PUSH B','Shoulders + Chest','כתפיים + חזה',4,4),
('legs-b','LEGS B','Legs Hypertrophy + Abs','רגליים נפח + בטן',5,5),('arms','ARMS','Arms + Shoulders','ידיים + כתפיים',6,6)
) as v(slug,code,name,description,weekday,position)
where p.slug='ironlog-6-day-hypertrophy-v1' and p.is_system
on conflict (slug) where is_system do update set program_id=excluded.program_id,code=excluded.code,name=excluded.name,description=excluded.description,weekday=excluded.weekday,position=excluded.position,updated_at=now();

insert into public.template_exercises (template_id,exercise_id,position,planned_sets,target_reps,rep_min,rep_max,target_rir_min,target_rir_max,rest_min_seconds,rest_max_seconds)
select t.id,e.id,v.position,v.sets,v.reps,v.rep_min,v.rep_max,1,2,v.rest,v.rest
from (values
('push-a','incline-smith',1,4,'8–10',8,10,150),('push-a','chest-press-machine',2,4,'8–12',8,12,135),('push-a','pec-deck',3,3,'12–15',12,15,90),('push-a','cable-fly',4,3,'15–20',15,20,75),('push-a','ez-curl',5,4,'8–10',8,10,120),('push-a','incline-db-curl',6,3,'10–12',10,12,90),('push-a','hammer-curl',7,3,'12',12,12,90),
('legs-a','hack-squat',1,4,'6–8',6,8,180),('legs-a','romanian-deadlift',2,4,'8',8,8,180),('legs-a','leg-press',3,4,'10',10,10,165),('legs-a','bulgarian-split-squat',4,3,'10 / leg',10,10,150),('legs-a','lying-leg-curl',5,3,'12',12,12,90),('legs-a','standing-calf-raise',6,5,'12',12,12,75),('legs-a','hanging-leg-raise',7,3,'15',15,15,60),('legs-a','cable-crunch',8,3,'15',15,15,60),
('pull-a','pull-up',1,4,'AMRAP',null,null,150),('pull-a','chest-supported-row',2,4,'8–10',8,10,150),('pull-a','lat-pulldown',3,3,'10–12',10,12,120),('pull-a','seated-cable-row',4,3,'12',12,12,120),('pull-a','face-pull',5,3,'15',15,15,75),('pull-a','rope-pushdown',6,4,'10–12',10,12,90),('pull-a','overhead-cable-extension',7,3,'12',12,12,90),('pull-a','machine-dip',8,3,'10–12',10,12,120),
('push-b','shoulder-press-machine',1,4,'8–10',8,10,150),('push-b','cable-lateral-raise',2,5,'15',15,15,60),('push-b','rear-delt-fly-machine',3,4,'15',15,15,75),('push-b','incline-chest-press-machine',4,4,'10',10,10,135),('push-b','cable-fly',5,3,'15',15,15,75),
('legs-b','hack-squat',1,4,'10',10,10,150),('legs-b','leg-press',2,4,'15',15,15,135),('legs-b','leg-extension',3,4,'15',15,15,75),('legs-b','seated-leg-curl',4,4,'15',15,15,75),('legs-b','walking-lunge',5,3,'20 steps',20,20,120),('legs-b','seated-calf-raise',6,5,'20',20,20,60),('legs-b','ab-wheel',7,3,'12',12,12,60),('legs-b','plank',8,3,'duration',null,null,60),
('arms','barbell-curl',1,4,'8',8,8,120),('arms','preacher-curl',2,3,'12',12,12,90),('arms','cable-curl',3,3,'15',15,15,75),('arms','ez-skull-crusher',4,4,'8',8,8,120),('arms','rope-pushdown',5,3,'15',15,15,75),('arms','overhead-cable-extension',6,3,'12',12,12,90),('arms','dumbbell-lateral-raise',7,4,'15',15,15,60),('arms','rear-delt-fly-machine',8,3,'15',15,15,75)
) as v(template_slug,exercise_slug,position,sets,reps,rep_min,rep_max,rest)
join public.workout_templates t on t.slug=v.template_slug and t.is_system
join public.exercises e on e.slug=v.exercise_slug and e.is_system
on conflict (template_id,position) do update set exercise_id=excluded.exercise_id,planned_sets=excluded.planned_sets,target_reps=excluded.target_reps,rep_min=excluded.rep_min,rep_max=excluded.rep_max,target_rir_min=excluded.target_rir_min,target_rir_max=excluded.target_rir_max,rest_min_seconds=excluded.rest_min_seconds,rest_max_seconds=excluded.rest_max_seconds;

insert into public.metric_definitions (code,version,name,description,formula,parameters,active_from) values
('effective_volume',1,'Effective muscle volume','Completed working sets weighted by the versioned exercise-to-muscle contribution model.','sum(completed_set * exercise_muscles.volume_credit)','{"primary":1.0,"secondary":0.5}'::jsonb,'2026-08-15'),
('estimated_1rm_epley',1,'Estimated one-repetition maximum','Epley estimate retained alongside raw load, reps, and RIR.','load_kg * (1 + reps / 30)','{}'::jsonb,'2026-08-15'),
('rir_adherence',1,'RIR adherence','Share of completed sets whose reported RIR is inside the snapshotted target interval.','sets_within_target / sets_with_rir','{}'::jsonb,'2026-08-15')
on conflict (code,version) do update set name=excluded.name,description=excluded.description,formula=excluded.formula,parameters=excluded.parameters;

create view public.weekly_muscle_volume with (security_invoker=true) as
select ps.user_id,date_trunc('week',ps.completed_at)::date as week_start,m.slug as muscle_slug,m.name,m.name_he,
       round(sum(em.volume_credit),2) as effective_sets,
       count(*) filter (where em.role='primary') as direct_sets
from public.performed_sets ps
join public.exercise_muscles em on em.exercise_id=ps.exercise_id
join public.muscles m on m.id=em.muscle_id
where ps.completed and ps.completed_at is not null and ps.set_type <> 'warmup'
group by ps.user_id,date_trunc('week',ps.completed_at)::date,m.id,m.slug,m.name,m.name_he;

create view public.exercise_performance_points with (security_invoker=true) as
select ps.user_id,ps.exercise_id,e.name,ps.completed_at,ps.load_kg,ps.reps,ps.rir,
       case when ps.load_kg is not null and ps.reps is not null then round(ps.load_kg * (1 + ps.reps::numeric / 30),2) end as estimated_1rm_kg
from public.performed_sets ps join public.exercises e on e.id=ps.exercise_id
where ps.completed and ps.completed_at is not null and ps.set_type <> 'warmup';

grant select on public.weekly_muscle_volume, public.exercise_performance_points to authenticated;

commit;
