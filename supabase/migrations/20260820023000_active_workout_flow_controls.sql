begin;

alter table public.session_exercises
  add column if not exists is_skipped boolean not null default false,
  add column if not exists original_planned_sets smallint;

update public.session_exercises
set original_planned_sets = planned_sets
where original_planned_sets is null
  and planned_sets is not null
  and planned_sets > 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'session_exercises_original_planned_sets_check'
      and conrelid = 'public.session_exercises'::regclass
  ) then
    alter table public.session_exercises
      add constraint session_exercises_original_planned_sets_check
      check (original_planned_sets is null or original_planned_sets between 1 and 20);
  end if;
end;
$$;

create or replace function public.reorder_active_workout_exercises(
  p_session_id uuid,
  p_order uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_count integer;
  v_shift integer;
  v_index integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not exists (
    select 1
    from public.workout_sessions ws
    where ws.id = p_session_id
      and ws.user_id = v_user_id
      and ws.status = 'active'
  ) then
    raise exception 'Active workout is unavailable' using errcode = 'P0002';
  end if;

  select count(*)::integer, coalesce(max(position), 0)::integer + 100
  into v_count, v_shift
  from public.session_exercises
  where session_id = p_session_id
    and user_id = v_user_id;

  if coalesce(array_length(p_order, 1), 0) <> v_count then
    raise exception 'Exercise order must include every workout exercise exactly once' using errcode = '22023';
  end if;

  if (select count(distinct item) from unnest(p_order) as item) <> v_count then
    raise exception 'Exercise order contains duplicates' using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(p_order) as item
    left join public.session_exercises se
      on se.id = item
      and se.session_id = p_session_id
      and se.user_id = v_user_id
    where se.id is null
  ) then
    raise exception 'Exercise order contains an unavailable exercise' using errcode = '22023';
  end if;

  update public.session_exercises
  set position = position + v_shift
  where session_id = p_session_id
    and user_id = v_user_id;

  for v_index in 1..v_count loop
    update public.session_exercises
    set position = v_index
    where id = p_order[v_index]
      and session_id = p_session_id
      and user_id = v_user_id;
  end loop;

  update public.workout_sessions
  set updated_at = now()
  where id = p_session_id
    and user_id = v_user_id;
end;
$$;

create or replace function public.set_active_workout_exercise_skipped(
  p_session_exercise_id uuid,
  p_skipped boolean
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_session_id uuid;
  v_planned smallint;
  v_original smallint;
  v_completed smallint;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select se.session_id,
         se.planned_sets,
         se.original_planned_sets,
         coalesce((
           select count(*)
           from public.performed_sets ps
           where ps.session_exercise_id = se.id
             and ps.completed
         ), 0)::smallint
  into v_session_id, v_planned, v_original, v_completed
  from public.session_exercises se
  join public.workout_sessions ws on ws.id = se.session_id
  where se.id = p_session_exercise_id
    and se.user_id = v_user_id
    and ws.user_id = v_user_id
    and ws.status = 'active'
  for update of se;

  if not found then
    raise exception 'Active workout exercise is unavailable' using errcode = 'P0002';
  end if;

  if coalesce(p_skipped, false) then
    update public.session_exercises
    set original_planned_sets = coalesce(original_planned_sets, nullif(planned_sets, 0), greatest(v_completed, 1)),
        planned_sets = v_completed,
        is_skipped = true
    where id = p_session_exercise_id;
  else
    update public.session_exercises
    set planned_sets = greatest(coalesce(original_planned_sets, nullif(v_planned, 0), 3), greatest(v_completed, 1)),
        is_skipped = false
    where id = p_session_exercise_id;
  end if;

  update public.workout_sessions
  set updated_at = now()
  where id = v_session_id
    and user_id = v_user_id;
end;
$$;

create or replace function public.add_active_workout_exercise(
  p_session_id uuid,
  p_exercise_id bigint
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_exercise_name text;
  v_position smallint;
  v_session_exercise_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not exists (
    select 1
    from public.workout_sessions ws
    where ws.id = p_session_id
      and ws.user_id = v_user_id
      and ws.status = 'active'
  ) then
    raise exception 'Active workout is unavailable' using errcode = 'P0002';
  end if;

  select coalesce(nullif(trim(e.name_he), ''), e.name)
  into v_exercise_name
  from public.exercises e
  where e.id = p_exercise_id
    and e.archived_at is null
    and (e.is_system or e.owner_user_id = v_user_id);

  if not found then
    raise exception 'Exercise is unavailable' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from public.session_exercises se
    where se.session_id = p_session_id
      and se.user_id = v_user_id
      and se.exercise_id = p_exercise_id
  ) then
    raise exception 'Exercise is already in this workout' using errcode = '23505';
  end if;

  select (coalesce(max(position), 0) + 1)::smallint
  into v_position
  from public.session_exercises
  where session_id = p_session_id
    and user_id = v_user_id;

  insert into public.session_exercises (
    user_id,
    session_id,
    exercise_id,
    position,
    exercise_name,
    planned_sets,
    original_planned_sets,
    is_skipped,
    target_reps,
    target_rir_min,
    target_rir_max,
    rest_min_seconds,
    rest_max_seconds
  ) values (
    v_user_id,
    p_session_id,
    p_exercise_id,
    v_position,
    v_exercise_name,
    3,
    3,
    false,
    '8–12',
    2,
    2,
    90,
    90
  )
  returning id into v_session_exercise_id;

  update public.workout_sessions
  set updated_at = now()
  where id = p_session_id
    and user_id = v_user_id;

  return v_session_exercise_id;
end;
$$;

revoke all on function public.reorder_active_workout_exercises(uuid, uuid[]) from public, anon;
revoke all on function public.set_active_workout_exercise_skipped(uuid, boolean) from public, anon;
revoke all on function public.add_active_workout_exercise(uuid, bigint) from public, anon;

grant execute on function public.reorder_active_workout_exercises(uuid, uuid[]) to authenticated;
grant execute on function public.set_active_workout_exercise_skipped(uuid, boolean) to authenticated;
grant execute on function public.add_active_workout_exercise(uuid, bigint) to authenticated;

commit;
