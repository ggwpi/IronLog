export const WORKOUTS = Object.freeze([
  Object.freeze({ id: 'push-a', day: 1, short: 'PUSH A', title: 'Chest + Biceps', targets: Object.freeze(['Chest', 'Biceps']), exercises: 7, sets: 24, minutes: 72 }),
  Object.freeze({ id: 'legs-a', day: 2, short: 'LEGS A', title: 'Legs Heavy + Abs', targets: Object.freeze(['Quads', 'Hamstrings', 'Glutes', 'Core']), exercises: 8, sets: 29, minutes: 88 }),
  Object.freeze({ id: 'pull-a', day: 3, short: 'PULL A', title: 'Back + Triceps', targets: Object.freeze(['Back', 'Triceps', 'Rear Delts']), exercises: 8, sets: 27, minutes: 82 }),
  Object.freeze({ id: 'push-b', day: 4, short: 'PUSH B', title: 'Shoulders + Chest', targets: Object.freeze(['Shoulders', 'Chest']), exercises: 5, sets: 20, minutes: 64 }),
  Object.freeze({ id: 'legs-b', day: 5, short: 'LEGS B', title: 'Legs Hypertrophy + Abs', targets: Object.freeze(['Quads', 'Hamstrings', 'Calves', 'Core']), exercises: 8, sets: 30, minutes: 86, image: '/assets/workout-images/legs-b.jpg' }),
  Object.freeze({ id: 'arms', day: 6, short: 'ARMS', title: 'Arms + Shoulders', targets: Object.freeze(['Biceps', 'Triceps', 'Delts']), exercises: 8, sets: 27, minutes: 76 }),
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
