import { supabase } from '../lib/supabase.js';

const PLAN_IMAGES = Object.freeze({
  'push-a': ['/assets/workout-images/plans/push-a-front.png', '/assets/workout-images/plans/push-a-back.png'],
  'legs-a': ['/assets/workout-images/plans/legs-a-front.png', '/assets/workout-images/plans/legs-a-back.png'],
  'pull-a': ['/assets/workout-images/plans/pull-a-front.png', '/assets/workout-images/plans/pull-a-back.png'],
  'push-b': ['/assets/workout-images/plans/push-b-front.png', '/assets/workout-images/plans/push-b-back.png'],
  'legs-b': ['/assets/workout-images/plans/legs-b-front.png', '/assets/workout-images/plans/legs-b-back.png'],
  arms: ['/assets/workout-images/plans/arms-front.png', '/assets/workout-images/plans/arms-back.png'],
});

function assertResult(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

function optionalResult(result, fallback) {
  return result?.error ? fallback : (result?.data ?? fallback);
}

function sortByPosition(items = []) {
  return [...items].sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
}

function weekStart(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

export function userFromSession(session) {
  const user = session?.user;
  if (!user) return null;
  const metadata = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email || '',
    name: metadata.full_name || metadata.name || user.email?.split('@')[0] || 'מתאמן',
    avatarUrl: metadata.avatar_url || metadata.picture || '',
  };
}

export async function currentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => callback(session)).data.subscription;
}

export async function signInWithGoogle() {
  const redirectTo = `${window.location.origin}${window.location.pathname}#/home`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, scopes: 'openid email profile' },
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

function buildExerciseLibrary(exercises, muscleLinks, muscles) {
  const muscleById = new Map(muscles.map((muscle) => [Number(muscle.id), muscle]));
  const linksByExercise = new Map();

  muscleLinks.forEach((link) => {
    const exerciseId = Number(link.exercise_id);
    const links = linksByExercise.get(exerciseId) || [];
    const muscle = muscleById.get(Number(link.muscle_id));
    if (muscle) links.push({ ...muscle, role: link.role, volumeCredit: Number(link.volume_credit) });
    linksByExercise.set(exerciseId, links);
  });

  return exercises.map((exercise) => ({
    id: Number(exercise.id),
    name: exercise.name,
    nameHe: exercise.name_he || '',
    displayName: exercise.name_he || exercise.name,
    equipment: exercise.equipment || '',
    trackingType: exercise.tracking_type,
    instructions: exercise.instructions || '',
    isSystem: exercise.is_system,
    isCustom: !exercise.is_system,
    muscles: linksByExercise.get(Number(exercise.id)) || [],
  }));
}

function toWorkout(template, exerciseById) {
  const templateExercises = sortByPosition(template.template_exercises).map((item) => {
    const exercise = exerciseById.get(Number(item.exercise_id));
    return {
      id: Number(item.id),
      exerciseId: Number(item.exercise_id),
      position: Number(item.position),
      plannedSets: Number(item.planned_sets),
      targetReps: item.target_reps,
      targetRirMin: item.target_rir_min == null ? null : Number(item.target_rir_min),
      targetRirMax: item.target_rir_max == null ? null : Number(item.target_rir_max),
      restMinSeconds: Number(item.rest_min_seconds || 90),
      restMaxSeconds: Number(item.rest_max_seconds || item.rest_min_seconds || 90),
      notes: item.notes || '',
      exercise,
    };
  }).filter((item) => item.exercise);

  const minutes = Math.max(1, Math.round(templateExercises.reduce((total, item) => {
    return total + item.plannedSets * (item.restMaxSeconds + 45) / 60;
  }, 0)));
  const targets = [...new Set(templateExercises.flatMap((item) => item.exercise.muscles
    .filter((muscle) => muscle.role === 'primary')
    .map((muscle) => muscle.name || muscle.slug)))];

  return {
    databaseId: Number(template.id),
    id: template.slug || `template-${template.id}`,
    slug: template.slug || '',
    day: template.weekday == null ? null : Number(template.weekday),
    short: template.code || template.name,
    title: template.name,
    description: template.description || '',
    targets,
    exercises: templateExercises.length,
    sets: templateExercises.reduce((sum, item) => sum + item.plannedSets, 0),
    minutes,
    images: PLAN_IMAGES[template.slug] || [],
    isSystem: template.is_system,
    isCustom: !template.is_system,
    templateExercises,
  };
}

function toActiveSession(session, sessionExercises, performedSets, exerciseById) {
  if (!session) return null;
  const setsByExercise = new Map();
  performedSets.forEach((set) => {
    const key = set.session_exercise_id;
    const sets = setsByExercise.get(key) || [];
    sets.push({
      id: set.id,
      setNumber: Number(set.set_number),
      setType: set.set_type,
      loadKg: set.load_kg == null ? null : Number(set.load_kg),
      reps: set.reps == null ? null : Number(set.reps),
      rir: set.rir == null ? null : Number(set.rir),
      durationSeconds: set.duration_seconds == null ? null : Number(set.duration_seconds),
      distanceMeters: set.distance_meters == null ? null : Number(set.distance_meters),
      restSeconds: set.rest_seconds == null ? null : Number(set.rest_seconds),
      notes: set.notes || '',
      completed: set.completed,
    });
    setsByExercise.set(key, sets);
  });

  return {
    id: session.id,
    templateId: session.template_id == null ? null : Number(session.template_id),
    name: session.template_name || 'אימון',
    status: session.status,
    startedAt: session.started_at,
    exercises: sortByPosition(sessionExercises).map((item) => ({
      id: item.id,
      exerciseId: Number(item.exercise_id),
      name: item.exercise_name,
      position: Number(item.position),
      plannedSets: Number(item.planned_sets ?? 0),
      originalPlannedSets: Number(item.original_planned_sets ?? item.planned_sets ?? 0),
      isSkipped: Boolean(item.is_skipped),
      targetReps: item.target_reps || '',
      targetRirMin: item.target_rir_min == null ? null : Number(item.target_rir_min),
      targetRirMax: item.target_rir_max == null ? null : Number(item.target_rir_max),
      restMinSeconds: Number(item.rest_min_seconds || 90),
      restMaxSeconds: Number(item.rest_max_seconds || item.rest_min_seconds || 90),
      exercise: exerciseById.get(Number(item.exercise_id)) || null,
      sets: (setsByExercise.get(item.id) || []).sort((a, b) => a.setNumber - b.setNumber),
    })),
  };
}

export async function loadAppData(userId) {
  const since = new Date();
  since.setDate(since.getDate() - 120);
  const sinceDate = since.toISOString().slice(0, 10);

  const [profile, templates, exercises, muscleLinks, muscles, weights, volume, performance, recovery, cycles, sessions, activeSessionRows] = await Promise.all([
    supabase.from('profiles').select('display_name,email,avatar_url,timezone,weight_unit').eq('id', userId).maybeSingle(),
    supabase.from('workout_templates').select('id,slug,code,name,description,weekday,position,is_system,template_exercises(id,exercise_id,position,planned_sets,target_reps,target_rir_min,target_rir_max,rest_min_seconds,rest_max_seconds,notes)').is('archived_at', null).order('position'),
    supabase.from('exercises').select('id,name,name_he,equipment,tracking_type,is_system,instructions').is('archived_at', null).order('name'),
    supabase.from('exercise_muscles').select('exercise_id,muscle_id,role,volume_credit'),
    supabase.from('muscles').select('id,slug,name,name_he,region').order('name'),
    supabase.from('body_weight_measurements').select('measured_at,weight_kg').gte('measured_at', since.toISOString()).order('measured_at'),
    supabase.from('weekly_muscle_volume').select('week_start,muscle_slug,name,name_he,effective_sets,direct_sets').gte('week_start', sinceDate).order('week_start'),
    supabase.from('exercise_performance_points').select('exercise_id,name,completed_at,load_kg,reps,rir,estimated_1rm_kg').gte('completed_at', since.toISOString()).order('completed_at', { ascending: true }),
    supabase.from('recovery_logs').select('log_date,sleep_minutes,readiness,fatigue,soreness,stress').gte('log_date', sinceDate).order('log_date'),
    supabase.from('training_cycles').select('id,name,starts_on,planned_weeks,status').eq('status', 'active').order('starts_on', { ascending: false }).limit(1),
    supabase.from('workout_sessions').select('id,template_id,template_name,status,started_at,completed_at').gte('started_at', since.toISOString()).order('started_at', { ascending: false }),
    supabase.from('workout_sessions').select('id,template_id,template_name,status,started_at,completed_at').eq('status', 'active').order('started_at', { ascending: false }).limit(1),
  ]);

  // Workout/session data is core app state and should fail loudly if unavailable.
  // Statistics/profile queries are supplementary: one transient analytics error
  // must not blank the entire application.
  const resolvedProfile = optionalResult(profile, null);
  const resolvedTemplates = assertResult(templates, 'workout templates');
  const resolvedExercises = assertResult(exercises, 'exercise library');
  const resolvedLinks = assertResult(muscleLinks, 'exercise muscles');
  const resolvedMuscles = assertResult(muscles, 'muscles');
  const resolvedPerformance = optionalResult(performance, []);
  const resolvedWeights = optionalResult(weights, []);
  const resolvedVolume = optionalResult(volume, []);
  const resolvedRecovery = optionalResult(recovery, []);
  const resolvedCycles = optionalResult(cycles, []);
  const resolvedSessions = assertResult(sessions, 'workout sessions');
  const activeSession = assertResult(activeSessionRows, 'active workout')[0] || null;
  const exerciseLibrary = buildExerciseLibrary(resolvedExercises, resolvedLinks, resolvedMuscles);
  const exerciseById = new Map(exerciseLibrary.map((exercise) => [exercise.id, exercise]));

  let activeSessionExercises = [];
  let activePerformedSets = [];
  if (activeSession) {
    const [sessionExercisesResult, performedSetsResult] = await Promise.all([
      supabase.from('session_exercises').select('id,session_id,exercise_id,position,exercise_name,planned_sets,original_planned_sets,is_skipped,target_reps,target_rir_min,target_rir_max,rest_min_seconds,rest_max_seconds').eq('session_id', activeSession.id).order('position'),
      supabase.from('performed_sets').select('id,session_exercise_id,set_number,set_type,load_kg,reps,rir,duration_seconds,distance_meters,rest_seconds,notes,completed').eq('session_id', activeSession.id).order('set_number'),
    ]);
    activeSessionExercises = assertResult(sessionExercisesResult, 'session exercises');
    activePerformedSets = assertResult(performedSetsResult, 'performed sets');
  }

  const workouts = resolvedTemplates.map((template) => toWorkout(template, exerciseById));
  const startOfWeek = weekStart();
  const completedThisWeek = resolvedSessions.filter((session) => session.status === 'completed' && new Date(session.completed_at || session.started_at) >= startOfWeek).length;
  const weeklyLoadKg = resolvedPerformance
    .filter((point) => new Date(point.completed_at) >= startOfWeek)
    .reduce((sum, point) => sum + Number(point.load_kg || 0) * Number(point.reps || 0), 0);

  return {
    profile: resolvedProfile,
    workouts,
    workoutData: {
      exerciseLibrary,
      muscles: resolvedMuscles.map((muscle) => ({ ...muscle, id: Number(muscle.id) })),
      sessions: resolvedSessions,
      activeSession: toActiveSession(activeSession, activeSessionExercises, activePerformedSets, exerciseById),
      performanceHistory: resolvedPerformance,
      summary: {
        completedThisWeek,
        plannedWorkouts: workouts.length,
        weeklyLoadKg,
        customWorkouts: workouts.filter((workout) => workout.isCustom).length,
      },
    },
    statisticsSource: {
      weights: resolvedWeights,
      muscleVolume: resolvedVolume,
      performance: resolvedPerformance,
      recovery: resolvedRecovery,
      cycle: resolvedCycles[0] || null,
      sessions: resolvedSessions,
    },
  };
}

export async function startWorkout(templateId) {
  const { data, error } = await supabase.rpc('start_workout', { p_template_id: templateId || null });
  if (error) throw error;
  return data;
}

export async function saveWorkoutTemplate(payload) {
  const { data, error } = await supabase.rpc('save_workout_template', {
    p_template_id: payload.templateId || null,
    p_name: payload.name,
    p_code: payload.code || null,
    p_weekday: payload.weekday == null ? null : Number(payload.weekday),
    p_description: payload.description || null,
    p_exercises: payload.exercises,
  });
  if (error) throw error;
  return Number(data);
}

export async function archiveWorkoutTemplate(templateId) {
  const { error } = await supabase.rpc('archive_workout_template', { p_template_id: templateId });
  if (error) throw error;
}

export async function saveCustomExercise(payload) {
  const { data, error } = await supabase.rpc('save_custom_exercise', {
    p_exercise_id: payload.exerciseId || null,
    p_name: payload.name,
    p_name_he: payload.nameHe || null,
    p_equipment: payload.equipment || null,
    p_tracking_type: payload.trackingType || 'weight_reps',
    p_muscle_id: payload.muscleId || null,
    p_instructions: payload.instructions || null,
  });
  if (error) throw error;
  return Number(data);
}

export async function archiveCustomExercise(exerciseId) {
  const { error } = await supabase.rpc('archive_custom_exercise', { p_exercise_id: exerciseId });
  if (error) throw error;
}

export async function recordWorkoutSet(payload) {
  const { data, error } = await supabase.rpc('record_workout_set', {
    p_session_exercise_id: payload.sessionExerciseId,
    p_set_number: Number(payload.setNumber),
    p_set_type: payload.setType || 'working',
    p_load_kg: payload.loadKg,
    p_reps: payload.reps,
    p_rir: payload.rir,
    p_duration_seconds: payload.durationSeconds,
    p_distance_meters: payload.distanceMeters,
    p_rest_seconds: payload.restSeconds,
    p_notes: payload.notes || null,
  });
  if (error) throw error;
  return data;
}

export async function finishWorkout(sessionId, cancel = false) {
  const { error } = await supabase.rpc('finish_workout', { p_session_id: sessionId, p_cancel: cancel });
  if (error) throw error;
}

export function subscribeToTraining(userId, callback) {
  const channel = supabase.channel(`ironlog-training-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'workout_sessions', filter: `user_id=eq.${userId}` }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'session_exercises', filter: `user_id=eq.${userId}` }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'performed_sets', filter: `user_id=eq.${userId}` }, callback)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
