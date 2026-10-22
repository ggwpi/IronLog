const PLAN_IMAGES = Object.freeze({
  pushA: Object.freeze([
    '/assets/workout-images/plans/push-a-front.png',
    '/assets/workout-images/plans/push-a-back.png',
  ]),
  pullA: Object.freeze([
    '/assets/workout-images/plans/pull-a-front.png',
    '/assets/workout-images/plans/pull-a-back.png',
  ]),
  legsA: Object.freeze([
    '/assets/workout-images/plans/legs-a-front.png',
    '/assets/workout-images/plans/legs-a-back.png',
  ]),
  pushB: Object.freeze([
    '/assets/workout-images/plans/push-b-front.png',
    '/assets/workout-images/plans/push-b-back.png',
  ]),
  pullB: Object.freeze([
    '/assets/workout-images/plans/pull-a-front.png',
    '/assets/workout-images/plans/pull-a-back.png',
  ]),
  legsB: Object.freeze([
    '/assets/workout-images/plans/legs-b-front.png',
    '/assets/workout-images/plans/legs-b-back.png',
  ]),
});

// Keep this fallback in lock-step with the active Supabase system program.
// Sunday (0) is rest; training runs Monday (1) through Saturday (6).
export const WORKOUTS = Object.freeze([
  Object.freeze({ id: 'push-a', day: 1, short: 'PUSH A', title: 'Chest + Shoulders + Triceps', targets: Object.freeze(['Chest', 'Shoulders', 'Triceps']), exercises: 6, sets: 17, minutes: 56, images: PLAN_IMAGES.pushA }),
  Object.freeze({ id: 'pull-a', day: 2, short: 'PULL A', title: 'Back + Rear Delts + Biceps', targets: Object.freeze(['Back', 'Rear Delts', 'Biceps']), exercises: 6, sets: 16, minutes: 50, images: PLAN_IMAGES.pullA }),
  Object.freeze({ id: 'legs-a', day: 3, short: 'LEGS A', title: 'Quads + Hamstrings + Calves + Abs', targets: Object.freeze(['Quads', 'Hamstrings', 'Calves', 'Core']), exercises: 6, sets: 18, minutes: 54, images: PLAN_IMAGES.legsA }),
  Object.freeze({ id: 'push-b', day: 4, short: 'PUSH B', title: 'Chest + Shoulders + Triceps', targets: Object.freeze(['Chest', 'Shoulders', 'Triceps']), exercises: 7, sets: 19, minutes: 58, images: PLAN_IMAGES.pushB }),
  Object.freeze({ id: 'pull-b', day: 5, short: 'PULL B', title: 'Back + Rear Delts + Biceps', targets: Object.freeze(['Back', 'Rear Delts', 'Biceps']), exercises: 6, sets: 16, minutes: 50, images: PLAN_IMAGES.pullB }),
  Object.freeze({ id: 'legs-b', day: 6, short: 'LEGS B', title: 'Posterior Chain + Quads + Calves + Abs', targets: Object.freeze(['Hamstrings', 'Glutes', 'Quads', 'Calves', 'Core']), exercises: 7, sets: 21, minutes: 65, images: PLAN_IMAGES.legsB }),
]);

export function workoutForDay(day, workouts = WORKOUTS) {
  return workouts.find((workout) => workout.day === day) || null;
}

export function workoutById(id, workouts = WORKOUTS) {
  return workouts.find((workout) => workout.id === id) || null;
}

export function nextWorkoutFromDay(day, workouts = WORKOUTS) {
  return workouts.find((workout) => workout.day > day) || workouts[0] || null;
}
