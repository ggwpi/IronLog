begin;

-- Supabase created this automatic-RLS helper when the project was initialized.
-- It is an internal event-trigger helper, not a client RPC endpoint.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

create index session_exercises_template_exercise_id_idx
  on public.session_exercises(template_exercise_id)
  where template_exercise_id is not null;

commit;
