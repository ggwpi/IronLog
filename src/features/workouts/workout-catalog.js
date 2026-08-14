const MUSCLE_IMAGES = Object.freeze({
  abs: '/assets/workout-images/muscle-groups/abs-core.png',
  back: '/assets/workout-images/muscle-groups/back.png',
  biceps: '/assets/workout-images/muscle-groups/biceps.png',
  calves: '/assets/workout-images/muscle-groups/calves.png',
  chest: '/assets/workout-images/muscle-groups/chest.png',
  glutes: '/assets/workout-images/muscle-groups/glutes.png',
  hamstrings: '/assets/workout-images/muscle-groups/hamstrings.png',
  quads: '/assets/workout-images/muscle-groups/quadriceps.png',
  shoulders: '/assets/workout-images/muscle-groups/shoulders.png',
  triceps: '/assets/workout-images/muscle-groups/triceps.png',
});

export const WORKOUTS = Object.freeze([
  Object.freeze({ id: 'push-a', day: 1, short: 'PUSH A', title: 'Chest + Biceps', targets: Object.freeze(['Chest', 'Biceps']), exercises: 7, sets: 24, minutes: 72, images: Object.freeze([MUSCLE_IMAGES.chest, MUSCLE_IMAGES.biceps]) }),
  Object.freeze({ id: 'legs-a', day: 2, short: 'LEGS A', title: 'Legs Heavy + Abs', targets: Object.freeze(['Quads', 'Hamstrings', 'Glutes', 'Core']), exercises: 8, sets: 29, minutes: 88, images: Object.freeze([MUSCLE_IMAGES.quads, MUSCLE_IMAGES.hamstrings, MUSCLE_IMAGES.glutes, MUSCLE_IMAGES.abs]) }),
  Object.freeze({ id: 'pull-a', day: 3, short: 'PULL A', title: 'Back + Triceps', targets: Object.freeze(['Back', 'Triceps', 'Rear Delts']), exercises: 8, sets: 27, minutes: 82, images: Object.freeze([MUSCLE_IMAGES.back, MUSCLE_IMAGES.triceps, MUSCLE_IMAGES.shoulders]) }),
  Object.freeze({ id: 'push-b', day: 4, short: 'PUSH B', title: 'Shoulders + Chest', targets: Object.freeze(['Shoulders', 'Chest']), exercises: 5, sets: 20, minutes: 64, images: Object.freeze([MUSCLE_IMAGES.shoulders, MUSCLE_IMAGES.chest]) }),
  Object.freeze({ id: 'legs-b', day: 5, short: 'LEGS B', title: 'Legs Hypertrophy + Abs', targets: Object.freeze(['Quads', 'Hamstrings', 'Calves', 'Core']), exercises: 8, sets: 30, minutes: 86, images: Object.freeze([MUSCLE_IMAGES.quads, MUSCLE_IMAGES.hamstrings, MUSCLE_IMAGES.calves, MUSCLE_IMAGES.abs]) }),
  Object.freeze({ id: 'arms', day: 6, short: 'ARMS', title: 'Arms + Shoulders', targets: Object.freeze(['Biceps', 'Triceps', 'Delts']), exercises: 8, sets: 27, minutes: 76, images: Object.freeze([MUSCLE_IMAGES.biceps, MUSCLE_IMAGES.triceps, MUSCLE_IMAGES.shoulders]) }),
]);

const WORKOUT_BY_DAY = new Map(WORKOUTS.map((workout) => [workout.day, workout]));
const WORKOUT_BY_ID = new Map(WORKOUTS.map((workout) => [workout.id, workout]));

export function workoutForDay(day) {
  return WORKOUT_BY_DAY.get(day) || null;
}

export function workoutById(id) {
  return WORKOUT_BY_ID.get(id) || null;
}

export function nextWorkoutFromDay(day) {
  return WORKOUTS.find((workout) => workout.day > day) || WORKOUTS[0];
}
