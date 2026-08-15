const PLAN_IMAGES = Object.freeze({
  pushA: Object.freeze([
    '/assets/workout-images/plans/push-a-front.png',
    '/assets/workout-images/plans/push-a-back.png',
  ]),
  legsA: Object.freeze([
    '/assets/workout-images/plans/legs-a-front.png',
    '/assets/workout-images/plans/legs-a-back.png',
  ]),
  pullA: Object.freeze([
    '/assets/workout-images/plans/pull-a-front.png',
    '/assets/workout-images/plans/pull-a-back.png',
  ]),
  pushB: Object.freeze([
    '/assets/workout-images/plans/push-b-front.png',
    '/assets/workout-images/plans/push-b-back.png',
  ]),
  legsB: Object.freeze([
    '/assets/workout-images/plans/legs-b-front.png',
    '/assets/workout-images/plans/legs-b-back.png',
  ]),
  arms: Object.freeze([
    '/assets/workout-images/plans/arms-front.png',
    '/assets/workout-images/plans/arms-back.png',
  ]),
});

export const WORKOUTS = Object.freeze([
  Object.freeze({ id: 'push-a', day: 1, short: 'PUSH A', title: 'Chest + Biceps', targets: Object.freeze(['Chest', 'Biceps']), exercises: 7, sets: 24, minutes: 72, images: PLAN_IMAGES.pushA }),
  Object.freeze({ id: 'legs-a', day: 2, short: 'LEGS A', title: 'Legs Heavy + Abs', targets: Object.freeze(['Quads', 'Hamstrings', 'Glutes', 'Core']), exercises: 8, sets: 29, minutes: 88, images: PLAN_IMAGES.legsA }),
  Object.freeze({ id: 'pull-a', day: 3, short: 'PULL A', title: 'Back + Triceps', targets: Object.freeze(['Back', 'Triceps', 'Rear Delts']), exercises: 8, sets: 27, minutes: 82, images: PLAN_IMAGES.pullA }),
  Object.freeze({ id: 'push-b', day: 4, short: 'PUSH B', title: 'Shoulders + Chest', targets: Object.freeze(['Shoulders', 'Chest']), exercises: 5, sets: 20, minutes: 64, images: PLAN_IMAGES.pushB }),
  Object.freeze({ id: 'legs-b', day: 5, short: 'LEGS B', title: 'Legs Hypertrophy + Abs', targets: Object.freeze(['Quads', 'Hamstrings', 'Calves', 'Core']), exercises: 8, sets: 30, minutes: 86, images: PLAN_IMAGES.legsB }),
  Object.freeze({ id: 'arms', day: 6, short: 'ARMS', title: 'Arms + Shoulders', targets: Object.freeze(['Biceps', 'Triceps', 'Delts']), exercises: 8, sets: 27, minutes: 76, images: PLAN_IMAGES.arms }),
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

