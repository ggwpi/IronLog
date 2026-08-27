import { supabase } from '../../lib/supabase.js';

function assertResult(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

function nullableNumber(value) {
  if (value === '' || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function mapHistory(sessions = [], exercises = [], sets = []) {
  const setsByExercise = new Map();
  sets.forEach((set) => {
    const bucket = setsByExercise.get(set.session_exercise_id) || [];
    bucket.push({
      id: set.id,
      setNumber: Number(set.set_number),
      setType: set.set_type,
      loadKg: nullableNumber(set.load_kg),
      reps: nullableNumber(set.reps),
      rir: nullableNumber(set.rir),
      durationSeconds: nullableNumber(set.duration_seconds),
      distanceMeters: nullableNumber(set.distance_meters),
      restSeconds: nullableNumber(set.rest_seconds),
      notes: set.notes || '',
      completed: Boolean(set.completed),
      completedAt: set.completed_at || null,
    });
    setsByExercise.set(set.session_exercise_id, bucket);
  });

  const exercisesBySession = new Map();
  exercises.forEach((exercise) => {
    const bucket = exercisesBySession.get(exercise.session_id) || [];
    bucket.push({
      id: exercise.id,
      exerciseId: Number(exercise.exercise_id),
      name: exercise.exercise_name,
      position: Number(exercise.position),
      plannedSets: Number(exercise.planned_sets || 0),
      isSkipped: Boolean(exercise.is_skipped),
      sets: (setsByExercise.get(exercise.id) || []).sort((a, b) => a.setNumber - b.setNumber),
    });
    exercisesBySession.set(exercise.session_id, bucket);
  });

  return sessions.map((session) => {
    const sessionExercises = (exercisesBySession.get(session.id) || [])
      .sort((a, b) => a.position - b.position);
    const completedSets = sessionExercises.flatMap((exercise) => exercise.sets).filter((set) => set.completed);
    const volumeKg = completedSets.reduce((sum, set) => {
      return sum + (Number(set.loadKg) || 0) * (Number(set.reps) || 0);
    }, 0);
    return {
      id: session.id,
      templateId: session.template_id == null ? null : Number(session.template_id),
      name: session.template_name || 'אימון',
      status: session.status,
      startedAt: session.started_at,
      completedAt: session.completed_at,
      notes: session.notes || '',
      exercises: sessionExercises,
      completedSets: completedSets.length,
      volumeKg,
    };
  });
}

export async function loadWorkoutHistory() {
  const sessions = assertResult(await supabase
    .from('workout_sessions')
    .select('id,template_id,template_name,status,started_at,completed_at,notes')
    .neq('status', 'active')
    .order('started_at', { ascending: false }), 'workout history');

  if (!sessions.length) return [];
  const ids = sessions.map((session) => session.id);

  const [exerciseResult, setResult] = await Promise.all([
    supabase
      .from('session_exercises')
      .select('id,session_id,exercise_id,exercise_name,position,planned_sets,is_skipped')
      .in('session_id', ids)
      .order('position'),
    supabase
      .from('performed_sets')
      .select('id,session_id,session_exercise_id,set_number,set_type,load_kg,reps,rir,duration_seconds,distance_meters,rest_seconds,notes,completed,completed_at')
      .in('session_id', ids)
      .order('set_number'),
  ]);

  return mapHistory(
    sessions,
    assertResult(exerciseResult, 'history exercises'),
    assertResult(setResult, 'history sets'),
  );
}

export async function updateHistorySet(setId, payload = {}) {
  const update = {
    load_kg: nullableNumber(payload.loadKg),
    reps: nullableNumber(payload.reps),
    rir: nullableNumber(payload.rir),
    notes: String(payload.notes || '').trim() || null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('performed_sets')
    .update(update)
    .eq('id', setId)
    .select('id')
    .single();
  if (error) throw new Error(`עדכון סט: ${error.message}`);
  return data;
}

export async function deleteHistorySet(setId) {
  const { error } = await supabase.from('performed_sets').delete().eq('id', setId);
  if (error) throw new Error(`מחיקת סט: ${error.message}`);
}

export async function updateHistorySession(sessionId, payload = {}) {
  const update = {
    notes: String(payload.notes || '').trim() || null,
    updated_at: new Date().toISOString(),
  };
  if (payload.startedAt) update.started_at = payload.startedAt;
  if (payload.completedAt) update.completed_at = payload.completedAt;

  const { data, error } = await supabase
    .from('workout_sessions')
    .update(update)
    .eq('id', sessionId)
    .select('id')
    .single();
  if (error) throw new Error(`עדכון אימון: ${error.message}`);
  return data;
}

export async function deleteHistorySession(sessionId) {
  // session_exercises and performed_sets are ON DELETE CASCADE from workout_sessions.
  const { error } = await supabase.from('workout_sessions').delete().eq('id', sessionId);
  if (error) throw new Error(`מחיקת אימון: ${error.message}`);
}
