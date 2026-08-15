import { supabase } from '../lib/supabase.js';

const PLAN_IMAGES = Object.freeze({
  'push-a': ['/assets/workout-images/plans/push-a-front.png', '/assets/workout-images/plans/push-a-back.png'],
  'legs-a': ['/assets/workout-images/plans/legs-a-front.png', '/assets/workout-images/plans/legs-a-back.png'],
  'pull-a': ['/assets/workout-images/plans/pull-a-front.png', '/assets/workout-images/plans/pull-a-back.png'],
  'push-b': ['/assets/workout-images/plans/push-b-front.png', '/assets/workout-images/plans/push-b-back.png'],
  'legs-b': ['/assets/workout-images/plans/legs-b-front.png', '/assets/workout-images/plans/legs-b-back.png'],
  arms: ['/assets/workout-images/plans/arms-front.png', '/assets/workout-images/plans/arms-back.png'],
});

const TARGETS = Object.freeze({
  'push-a': ['Chest', 'Biceps'], 'legs-a': ['Quads', 'Hamstrings', 'Glutes', 'Core'],
  'pull-a': ['Back', 'Triceps', 'Rear Delts'], 'push-b': ['Shoulders', 'Chest'],
  'legs-b': ['Quads', 'Hamstrings', 'Calves', 'Core'], arms: ['Biceps', 'Triceps', 'Delts'],
});

function assertResult(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
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

function toWorkout(template) {
  const exercises = template.template_exercises || [];
  const minutes = Math.round(exercises.reduce((total, item) => {
    const rest = Number(item.rest_max_seconds || item.rest_min_seconds || 90);
    return total + Number(item.planned_sets || 0) * (rest + 45) / 60;
  }, 0));
  return Object.freeze({
    databaseId: template.id,
    id: template.slug || `template-${template.id}`,
    day: template.weekday,
    short: template.code || template.name,
    title: template.name,
    targets: Object.freeze(TARGETS[template.slug] || []),
    exercises: exercises.length,
    sets: exercises.reduce((sum, item) => sum + Number(item.planned_sets || 0), 0),
    minutes,
    images: Object.freeze(PLAN_IMAGES[template.slug] || []),
  });
}

export async function loadAppData(userId) {
  const since = new Date();
  since.setDate(since.getDate() - 120);
  const sinceDate = since.toISOString().slice(0, 10);

  const [profile, templates, weights, volume, performance, recovery, cycles, sessions] = await Promise.all([
    supabase.from('profiles').select('display_name,email,avatar_url,timezone,weight_unit').eq('id', userId).maybeSingle(),
    supabase.from('workout_templates').select('id,slug,code,name,description,weekday,position,template_exercises(id,position,planned_sets,target_reps,target_rir_min,target_rir_max,rest_min_seconds,rest_max_seconds,exercise_id)').is('archived_at', null).order('position'),
    supabase.from('body_weight_measurements').select('measured_at,weight_kg').gte('measured_at', since.toISOString()).order('measured_at'),
    supabase.from('weekly_muscle_volume').select('week_start,muscle_slug,name,name_he,effective_sets,direct_sets').gte('week_start', sinceDate).order('week_start'),
    supabase.from('exercise_performance_points').select('exercise_id,name,completed_at,load_kg,reps,rir,estimated_1rm_kg').gte('completed_at', since.toISOString()).order('completed_at'),
    supabase.from('recovery_logs').select('log_date,sleep_minutes,readiness,fatigue,soreness,stress').gte('log_date', sinceDate).order('log_date'),
    supabase.from('training_cycles').select('id,name,starts_on,planned_weeks,status').eq('status', 'active').order('starts_on', { ascending: false }).limit(1),
    supabase.from('workout_sessions').select('id,template_id,template_name,status,started_at,completed_at').gte('started_at', since.toISOString()).order('started_at', { ascending: false }),
  ]);

  return {
    profile: assertResult(profile, 'profile'),
    workouts: assertResult(templates, 'workout templates').map(toWorkout),
    statisticsSource: {
      weights: assertResult(weights, 'body weight'),
      muscleVolume: assertResult(volume, 'muscle volume'),
      performance: assertResult(performance, 'exercise performance'),
      recovery: assertResult(recovery, 'recovery'),
      cycle: assertResult(cycles, 'training cycle')[0] || null,
      sessions: assertResult(sessions, 'workout sessions'),
    },
  };
}

export async function startWorkout(templateId) {
  const { data, error } = await supabase.rpc('start_workout', { p_template_id: templateId || null });
  if (error) throw error;
  return data;
}

export function subscribeToTraining(userId, callback) {
  const channel = supabase.channel(`ironlog-training-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'workout_sessions', filter: `user_id=eq.${userId}` }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'performed_sets', filter: `user_id=eq.${userId}` }, callback)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

