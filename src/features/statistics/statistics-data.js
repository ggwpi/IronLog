// Statistics domain model.
//
// The screen consumes this shape only. When real persistence/API data is ready,
// replace the adapter that produces this object rather than rewriting the UI.

export const STATISTICS_DEMO = Object.freeze({
  schemaVersion: 1,
  generatedAt: '2026-08-15T00:00:00.000Z',
  source: 'demo',

  bodyWeight: {
    unit: 'ק״ג',
    current: 78.6,
    weeklyDelta: -0.6,
    averageWindowDays: 7,
    status: 'within',
    statusLabel: 'בתוך הטווח',
    targetToday: { min: 77.0, max: 79.5 },
    yDomain: { min: 74, max: 82 },
    series: [
      { label: '20 אפר׳', value: 79.7, targetMin: 78.0, targetMax: 80.8 },
      { label: '27 אפר׳', value: 79.8, targetMin: 77.8, targetMax: 80.6 },
      { label: '6 מאי', value: 79.3, targetMin: 77.7, targetMax: 80.4 },
      { label: '12 מאי', value: 79.1, targetMin: 77.5, targetMax: 80.2 },
      { label: '18 מאי', value: 78.9, targetMin: 77.3, targetMax: 80.0 },
      { label: '24 מאי', value: 78.7, targetMin: 77.1, targetMax: 79.7 },
      { label: 'היום', value: 78.6, targetMin: 77.0, targetMax: 79.5 },
    ],
  },

  muscleVolume: {
    unit: 'סטים',
    maxScale: 24,
    muscles: [
      { id: 'chest', label: 'חזה', actual: 16, target: [12, 20], icon: '◫' },
      { id: 'back', label: 'גב', actual: 18, target: [14, 22], icon: '⌁' },
      { id: 'shoulders', label: 'כתפיים', actual: 14, target: [10, 18], icon: '◇' },
      { id: 'biceps', label: 'בייספס', actual: 10, target: [8, 16], icon: '◜' },
      { id: 'triceps', label: 'טרייספס', actual: 12, target: [8, 16], icon: '◝' },
      { id: 'quads', label: 'ארבע ראשי', actual: 16, target: [12, 20], icon: '⋔' },
      { id: 'hamstrings', label: 'המסטרינג', actual: 10, target: [8, 16], icon: '⋏' },
      { id: 'calves', label: 'שוקיים', actual: 8, target: [6, 12], icon: '⌇' },
    ],
  },

  exercisePerformance: {
    periodLabel: '20 אפר׳ — היום',
    exercises: [
      {
        id: 'squat', label: 'סקוואט', metric: '1RM משוער', unit: 'ק״ג',
        current: 132.5, delta: 2.5, deltaPct: 2.0,
        yDomain: [110, 140], series: [118, 120, 124, 122, 126, 129, 127, 133, 131, 136],
      },
      {
        id: 'bench', label: 'לחיצת חזה', metric: '1RM משוער', unit: 'ק״ג',
        current: 100.0, delta: 2.0, deltaPct: 2.0,
        yDomain: [80, 110], series: [88, 89, 93, 97, 92, 96, 94, 99, 101, 105],
      },
      {
        id: 'deadlift', label: 'דדליפט', metric: '1RM משוער', unit: 'ק״ג',
        current: 160.0, delta: 3.0, deltaPct: 1.9,
        yDomain: [140, 170], series: [147, 149, 152, 151, 156, 154, 158, 157, 162, 166],
      },
    ],
  },

  recovery: {
    sleep: { label: 'שינה', value: '7:15', unit: 'שעות', status: 'טוב', tone: 'good' },
    rirAdherence: { label: 'עמידה ב־RIR', value: '87%', status: 'טוב', tone: 'good' },
    readiness: { label: 'עייפות / מוכנות', value: '3 / 7', status: 'בינוני', tone: 'medium' },
  },

  mesocycle: {
    totalWeeks: 12,
    currentWeek: 4,
    completedWeeks: [1, 2, 3],
    deloadWeeks: [8, 12],
    phaseLabel: 'בנייה',
  },
});

export function getStatisticsModel() {
  // Integration seam: swap this function for an adapter that combines workout
  // logs, weigh-ins, nutrition and recovery data into the same schema.
  return STATISTICS_DEMO;
}
