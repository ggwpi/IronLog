begin;

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
      e.name, te.planned_sets, te.target_reps, te.target_rir_min,
      te.target_rir_max, te.rest_min_seconds, te.rest_max_seconds
    from public.template_exercises te
    join public.exercises e on e.id = te.exercise_id
    where te.template_id = p_template_id
    order by te.position;
  end if;

  return v_session_id;
end;
$$;

revoke all on function public.start_workout(bigint) from public, anon;
grant execute on function public.start_workout(bigint) to authenticated;

alter publication supabase_realtime add table public.workout_sessions;
alter publication supabase_realtime add table public.performed_sets;

commit;
