begin;

with ranked_active_sessions as (
  select id,
         row_number() over (partition by user_id order by started_at desc, id desc) as active_rank
  from public.workout_sessions
  where status = 'active'
)
update public.workout_sessions ws
set status = 'cancelled', completed_at = coalesce(ws.completed_at, now())
from ranked_active_sessions ranked
where ws.id = ranked.id and ranked.active_rank > 1;

create unique index if not exists workout_sessions_one_active_user_uidx
on public.workout_sessions(user_id)
where status = 'active';

create or replace function public.save_workout_template(
  p_template_id bigint,
  p_name text,
  p_code text,
  p_weekday smallint,
  p_description text,
  p_exercises jsonb
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_template_id bigint;
  v_is_system boolean;
  v_owner_user_id uuid;
  v_exercise_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  p_name := trim(coalesce(p_name, ''));
  p_code := nullif(upper(trim(coalesce(p_code, ''))), '');
  p_description := nullif(trim(coalesce(p_description, '')), '');

  if length(p_name) < 2 or length(p_name) > 120 then
    raise exception 'Workout name must contain 2 to 120 characters' using errcode = '22023';
  end if;

  if p_code is not null and length(p_code) > 20 then
    raise exception 'Workout code must contain at most 20 characters' using errcode = '22023';
  end if;

  if p_weekday is not null and (p_weekday < 0 or p_weekday > 6) then
    raise exception 'Weekday must be between 0 and 6' using errcode = '22023';
  end if;

  if jsonb_typeof(p_exercises) <> 'array' then
    raise exception 'Exercises must be an array' using errcode = '22023';
  end if;

  v_exercise_count := jsonb_array_length(p_exercises);
  if v_exercise_count < 1 or v_exercise_count > 30 then
    raise exception 'A workout must contain 1 to 30 exercises' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_exercises) as item(
      exercise_id bigint,
      planned_sets smallint,
      target_reps text,
      target_rir_min numeric,
      target_rir_max numeric,
      rest_min_seconds smallint,
      rest_max_seconds smallint,
      notes text
    )
    left join public.exercises e
      on e.id = item.exercise_id
      and e.archived_at is null
    where e.id is null
      or item.planned_sets is null or item.planned_sets not between 1 and 20
      or length(trim(coalesce(item.target_reps, ''))) not between 1 and 40
      or coalesce(item.target_rir_min, 0) not between 0 and 10
      or coalesce(item.target_rir_max, coalesce(item.target_rir_min, 0)) not between coalesce(item.target_rir_min, 0) and 10
      or coalesce(item.rest_min_seconds, 90) <= 0
      or coalesce(item.rest_max_seconds, coalesce(item.rest_min_seconds, 90)) < coalesce(item.rest_min_seconds, 90)
  ) then
    raise exception 'One or more workout exercises are invalid or unavailable' using errcode = '22023';
  end if;

  if p_template_id is null then
    insert into public.workout_templates (
      owner_user_id, name, code, description, weekday, position, is_system
    )
    values (
      v_user_id,
      p_name,
      p_code,
      p_description,
      p_weekday,
      coalesce((select max(position) + 1 from public.workout_templates where archived_at is null), 0),
      false
    )
    returning id into v_template_id;
  else
    select is_system, owner_user_id
    into v_is_system, v_owner_user_id
    from public.workout_templates
    where id = p_template_id and archived_at is null;

    if not found then
      raise exception 'Workout template is unavailable' using errcode = 'P0002';
    end if;

    if v_is_system or v_owner_user_id <> v_user_id then
      raise exception 'Preset workouts cannot be edited' using errcode = '42501';
    end if;

    update public.workout_templates
    set name = p_name,
        code = p_code,
        description = p_description,
        weekday = p_weekday
    where id = p_template_id;

    delete from public.template_exercises where template_id = p_template_id;
    v_template_id := p_template_id;
  end if;

  insert into public.template_exercises (
    template_id,
    exercise_id,
    position,
    planned_sets,
    target_reps,
    target_rir_min,
    target_rir_max,
    rest_min_seconds,
    rest_max_seconds,
    notes
  )
  select
    v_template_id,
    (raw.item ->> 'exercise_id')::bigint,
    raw.ordinality::smallint,
    (raw.item ->> 'planned_sets')::smallint,
    trim(raw.item ->> 'target_reps'),
    coalesce((raw.item ->> 'target_rir_min')::numeric, 0),
    coalesce((raw.item ->> 'target_rir_max')::numeric, coalesce((raw.item ->> 'target_rir_min')::numeric, 0)),
    coalesce((raw.item ->> 'rest_min_seconds')::smallint, 90),
    coalesce((raw.item ->> 'rest_max_seconds')::smallint, coalesce((raw.item ->> 'rest_min_seconds')::smallint, 90)),
    nullif(trim(coalesce(raw.item ->> 'notes', '')), '')
  from jsonb_array_elements(p_exercises) with ordinality as raw(item, ordinality);

  return v_template_id;
end;
$$;

create or replace function public.archive_workout_template(p_template_id bigint)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  update public.workout_templates
  set archived_at = now()
  where id = p_template_id
    and owner_user_id = v_user_id
    and not is_system
    and archived_at is null;

  if not found then
    raise exception 'Only your custom workouts can be archived' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.save_custom_exercise(
  p_exercise_id bigint,
  p_name text,
  p_name_he text,
  p_equipment text,
  p_tracking_type public.exercise_tracking_type,
  p_muscle_id bigint,
  p_instructions text
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_exercise_id bigint;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  p_name := trim(coalesce(p_name, ''));
  if length(p_name) < 2 or length(p_name) > 120 then
    raise exception 'Exercise name must contain 2 to 120 characters' using errcode = '22023';
  end if;

  if p_muscle_id is not null and not exists (select 1 from public.muscles where id = p_muscle_id) then
    raise exception 'Selected muscle is unavailable' using errcode = '22023';
  end if;

  if p_exercise_id is null then
    insert into public.exercises (
      owner_user_id, name, name_he, equipment, tracking_type, is_system, instructions
    )
    values (
      v_user_id,
      p_name,
      nullif(trim(coalesce(p_name_he, '')), ''),
      nullif(trim(coalesce(p_equipment, '')), ''),
      coalesce(p_tracking_type, 'weight_reps'::public.exercise_tracking_type),
      false,
      nullif(trim(coalesce(p_instructions, '')), '')
    )
    returning id into v_exercise_id;
  else
    update public.exercises
    set name = p_name,
        name_he = nullif(trim(coalesce(p_name_he, '')), ''),
        equipment = nullif(trim(coalesce(p_equipment, '')), ''),
        tracking_type = coalesce(p_tracking_type, tracking_type),
        instructions = nullif(trim(coalesce(p_instructions, '')), '')
    where id = p_exercise_id
      and owner_user_id = v_user_id
      and not is_system
      and archived_at is null
    returning id into v_exercise_id;

    if v_exercise_id is null then
      raise exception 'Only your custom exercises can be edited' using errcode = '42501';
    end if;

    delete from public.exercise_muscles where exercise_id = v_exercise_id;
  end if;

  if p_muscle_id is not null then
    insert into public.exercise_muscles (exercise_id, muscle_id, role, volume_credit)
    values (v_exercise_id, p_muscle_id, 'primary', 1);
  end if;

  return v_exercise_id;
end;
$$;

create or replace function public.archive_custom_exercise(p_exercise_id bigint)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  update public.exercises
  set archived_at = now()
  where id = p_exercise_id
    and owner_user_id = v_user_id
    and not is_system
    and archived_at is null;

  if not found then
    raise exception 'Only your custom exercises can be archived' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.record_workout_set(
  p_session_exercise_id uuid,
  p_set_number smallint,
  p_set_type public.set_type,
  p_load_kg numeric,
  p_reps smallint,
  p_rir numeric,
  p_duration_seconds integer,
  p_distance_meters numeric,
  p_rest_seconds integer,
  p_notes text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_session_id uuid;
  v_exercise_id bigint;
  v_tracking_type public.exercise_tracking_type;
  v_set_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_set_number is null or p_set_number not between 1 and 100 then
    raise exception 'Set number must be between 1 and 100' using errcode = '22023';
  end if;

  select se.session_id, se.exercise_id, e.tracking_type
  into v_session_id, v_exercise_id, v_tracking_type
  from public.session_exercises se
  join public.workout_sessions ws on ws.id = se.session_id
  join public.exercises e on e.id = se.exercise_id
  where se.id = p_session_exercise_id
    and se.user_id = v_user_id
    and ws.user_id = v_user_id
    and ws.status = 'active';

  if not found then
    raise exception 'Active workout exercise is unavailable' using errcode = 'P0002';
  end if;

  if p_load_kg is not null and p_load_kg < 0
    or p_reps is not null and p_reps < 0
    or p_rir is not null and p_rir not between 0 and 10
    or p_duration_seconds is not null and p_duration_seconds < 0
    or p_distance_meters is not null and p_distance_meters < 0
    or p_rest_seconds is not null and p_rest_seconds < 0 then
    raise exception 'Set values cannot be negative' using errcode = '22023';
  end if;

  if v_tracking_type in ('weight_reps', 'reps') and p_reps is null then
    raise exception 'Repetitions are required for this exercise' using errcode = '22023';
  elsif v_tracking_type = 'duration' and p_duration_seconds is null then
    raise exception 'Duration is required for this exercise' using errcode = '22023';
  elsif v_tracking_type = 'distance' and p_distance_meters is null then
    raise exception 'Distance is required for this exercise' using errcode = '22023';
  end if;

  insert into public.performed_sets (
    user_id, session_id, session_exercise_id, exercise_id, set_number, set_type,
    load_kg, reps, rir, duration_seconds, distance_meters, rest_seconds,
    started_at, completed_at, completed, notes
  )
  values (
    v_user_id, v_session_id, p_session_exercise_id, v_exercise_id, p_set_number,
    coalesce(p_set_type, 'working'::public.set_type),
    p_load_kg, p_reps, p_rir, p_duration_seconds, p_distance_meters, p_rest_seconds,
    now(), now(), true, nullif(trim(coalesce(p_notes, '')), '')
  )
  on conflict (session_exercise_id, set_number) do update set
    set_type = excluded.set_type,
    load_kg = excluded.load_kg,
    reps = excluded.reps,
    rir = excluded.rir,
    duration_seconds = excluded.duration_seconds,
    distance_meters = excluded.distance_meters,
    rest_seconds = excluded.rest_seconds,
    completed_at = now(),
    completed = true,
    notes = excluded.notes
  returning id into v_set_id;

  return v_set_id;
end;
$$;

create or replace function public.finish_workout(p_session_id uuid, p_cancel boolean default false)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  update public.workout_sessions
  set status = case when p_cancel then 'cancelled'::public.workout_status else 'completed'::public.workout_status end,
      completed_at = now()
  where id = p_session_id
    and user_id = v_user_id
    and status = 'active';

  if not found then
    raise exception 'Active workout is unavailable' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.start_workout(p_template_id bigint default null)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_session_id uuid;
  v_template_name text;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select id into v_session_id
  from public.workout_sessions
  where user_id = v_user_id and status = 'active'
  order by started_at desc
  limit 1;

  if found then
    return v_session_id;
  end if;

  if p_template_id is not null then
    select name into v_template_name
    from public.workout_templates
    where id = p_template_id and archived_at is null;

    if not found then
      raise exception 'Workout template is unavailable' using errcode = 'P0002';
    end if;
  end if;

  insert into public.workout_sessions (user_id, template_id, template_name, status)
  values (v_user_id, p_template_id, coalesce(v_template_name, 'Empty Workout'), 'active')
  returning id into v_session_id;

  if p_template_id is not null then
    insert into public.session_exercises (
      user_id, session_id, exercise_id, template_exercise_id, position,
      exercise_name, planned_sets, target_reps, target_rir_min,
      target_rir_max, rest_min_seconds, rest_max_seconds
    )
    select
      v_user_id, v_session_id, te.exercise_id, te.id, te.position,
      coalesce(e.name_he, e.name), te.planned_sets, te.target_reps, te.target_rir_min,
      te.target_rir_max, te.rest_min_seconds, te.rest_max_seconds
    from public.template_exercises te
    join public.exercises e on e.id = te.exercise_id
    where te.template_id = p_template_id
    order by te.position;
  end if;

  return v_session_id;
end;
$$;

revoke all on function public.save_workout_template(bigint, text, text, smallint, text, jsonb) from public, anon;
revoke all on function public.archive_workout_template(bigint) from public, anon;
revoke all on function public.save_custom_exercise(bigint, text, text, text, public.exercise_tracking_type, bigint, text) from public, anon;
revoke all on function public.archive_custom_exercise(bigint) from public, anon;
revoke all on function public.record_workout_set(uuid, smallint, public.set_type, numeric, smallint, numeric, integer, numeric, integer, text) from public, anon;
revoke all on function public.finish_workout(uuid, boolean) from public, anon;
revoke all on function public.start_workout(bigint) from public, anon;

grant execute on function public.save_workout_template(bigint, text, text, smallint, text, jsonb) to authenticated;
grant execute on function public.archive_workout_template(bigint) to authenticated;
grant execute on function public.save_custom_exercise(bigint, text, text, text, public.exercise_tracking_type, bigint, text) to authenticated;
grant execute on function public.archive_custom_exercise(bigint) to authenticated;
grant execute on function public.record_workout_set(uuid, smallint, public.set_type, numeric, smallint, numeric, integer, numeric, integer, text) to authenticated;
grant execute on function public.finish_workout(uuid, boolean) to authenticated;
grant execute on function public.start_workout(bigint) to authenticated;

commit;
