const MUSCLE_TARGETS = Object.freeze({
  chest: { label: 'חזה', target: [12, 20], icon: '◫' },
  'upper-chest': { label: 'חזה עליון', target: [8, 16], icon: '◫' },
  lats: { label: 'רחב גבי', target: [10, 18], icon: '⌁' },
  'upper-back': { label: 'גב עליון', target: [10, 18], icon: '⌁' },
  'side-delts': { label: 'כתף צדית', target: [8, 16], icon: '◇' },
  'rear-delts': { label: 'כתף אחורית', target: [6, 14], icon: '◇' },
  biceps: { label: 'בייספס', target: [8, 16], icon: '◜' },
  triceps: { label: 'טרייספס', target: [8, 16], icon: '◝' },
  quads: { label: 'ארבע ראשי', target: [12, 20], icon: '⋔' },
  hamstrings: { label: 'המסטרינג', target: [8, 16], icon: '⋏' },
  calves: { label: 'תאומים', target: [6, 12], icon: '⌇' },
  core: { label: 'ליבה', target: [6, 12], icon: '◎' },
});

const round = (value, digits = 1) => Number(Number(value || 0).toFixed(digits));

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + Number(value), 0) / values.length : 0;
}

function dateLabel(value) {
  return new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'short' }).format(new Date(value));
}

function buildWeight(rows) {
  if (!rows.length) return { hasData: false, unit: 'ק״ג', averageWindowDays: 7 };
  const normalized = rows
    .map((row) => ({ date: new Date(row.measured_at), value: Number(row.weight_kg) }))
    .filter((row) => Number.isFinite(row.value) && !Number.isNaN(row.date.getTime()))
    .sort((a, b) => a.date - b.date);
  if (!normalized.length) return { hasData: false, unit: 'ק״ג', averageWindowDays: 7 };

  const latestAt = normalized.at(-1).date;
  const latestWeek = normalized.filter((row) => latestAt - row.date <= 7 * 86400000).map((row) => row.value);
  const priorWeek = normalized.filter((row) => latestAt - row.date > 7 * 86400000 && latestAt - row.date <= 14 * 86400000).map((row) => row.value);
  const current = average(latestWeek) || normalized.at(-1).value;
  const weeklyDelta = priorWeek.length ? current - average(priorWeek) : 0;
  const baseline = normalized[0].value;
  const series = normalized.map((row) => {
    const weeks = Math.max(0, (row.date - normalized[0].date) / (7 * 86400000));
    return { label: dateLabel(row.date), value: row.value, targetMin: baseline + weeks * 0.15, targetMax: baseline + weeks * 0.30 };
  });
  const values = series.flatMap((point) => [point.value, point.targetMin, point.targetMax]);
  const targetToday = series.at(-1);
  const within = current >= targetToday.targetMin && current <= targetToday.targetMax;
  return {
    hasData: true,
    unit: 'ק״ג',
    current: round(current),
    weeklyDelta: round(weeklyDelta),
    averageWindowDays: 7,
    status: within ? 'within' : current < targetToday.targetMin ? 'below' : 'above',
    statusLabel: within ? 'בתוך הטווח' : current < targetToday.targetMin ? 'מתחת לטווח' : 'מעל הטווח',
    targetToday: { min: round(targetToday.targetMin), max: round(targetToday.targetMax) },
    yDomain: { min: Math.floor(Math.min(...values) - 1), max: Math.ceil(Math.max(...values) + 1) },
    series,
  };
}

function buildMuscleVolume(rows) {
  const latestWeek = rows.reduce((latest, row) => !latest || row.week_start > latest ? row.week_start : latest, null);
  const latestRows = rows.filter((row) => row.week_start === latestWeek);
  const bySlug = new Map(latestRows.map((row) => [row.muscle_slug, Number(row.effective_sets)]));
  const muscles = Object.entries(MUSCLE_TARGETS).map(([id, config]) => ({ id, ...config, actual: round(bySlug.get(id) || 0) }));
  const weeklySets = latestRows.reduce((sum, row) => sum + Math.max(0, Number(row.direct_sets) || 0), 0);
  const activeMuscles = latestRows.filter((row) => Number(row.effective_sets) > 0).length;
  return { unit: 'סטים', maxScale: 24, hasData: Boolean(latestWeek), muscles, weeklySets: round(weeklySets, 0), activeMuscles };
}

function buildPerformance(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    if (row.estimated_1rm_kg == null) return;
    if (!groups.has(row.exercise_id)) groups.set(row.exercise_id, { id: row.exercise_id, label: row.name, values: [] });
    groups.get(row.exercise_id).values.push(Number(row.estimated_1rm_kg));
  });

  const allExercises = [...groups.values()].map((group) => {
    const series = group.values.filter(Number.isFinite);
    if (!series.length) return null;
    const current = series.at(-1);
    const baseline = series[0];
    const min = Math.floor(Math.min(...series) * 0.9);
    const rawMax = Math.ceil(Math.max(...series) * 1.1);
    return {
      id: group.id,
      label: group.label,
      metric: '1RM משוער',
      unit: 'ק״ג',
      current,
      delta: current - baseline,
      deltaPct: baseline ? (current - baseline) / baseline * 100 : 0,
      yDomain: [min, rawMax === min ? min + 10 : rawMax],
      series,
    };
  }).filter(Boolean).sort((a, b) => b.series.length - a.series.length || b.current - a.current);

  return {
    hasData: allExercises.length > 0,
    periodLabel: 'כל הנתונים הזמינים',
    exercises: allExercises.slice(0, 3),
    allExercises,
  };
}

function buildRecovery(rows, performanceRows) {
  const recent = rows.slice(-7);
  const sleep = average(recent.filter((row) => row.sleep_minutes != null).map((row) => Number(row.sleep_minutes)));
  const sleepMinutes = sleep ? Math.round(sleep) : 0;
  const sleepValue = sleepMinutes
    ? `${Math.floor(sleepMinutes / 60)}:${String(sleepMinutes % 60).padStart(2, '0')}`
    : '—';
  const readiness = average(recent.filter((row) => row.readiness != null).map((row) => Number(row.readiness)));
  const rirRows = performanceRows.filter((row) => row.rir != null);
  const rirAdherence = rirRows.length ? rirRows.filter((row) => Number(row.rir) >= 1 && Number(row.rir) <= 2).length / rirRows.length * 100 : 0;
  return {
    hasData: recent.length > 0 || rirRows.length > 0,
    sleep: { label: 'שינה', value: sleepValue, unit: sleep ? 'שעות' : '', status: sleep >= 450 ? 'טוב' : sleep ? 'נמוך' : 'אין נתונים', tone: sleep >= 450 ? 'good' : 'medium' },
    rirAdherence: { label: 'עמידה ב־RIR', value: rirRows.length ? `${Math.round(rirAdherence)}%` : '—', status: rirRows.length ? (rirAdherence >= 75 ? 'טוב' : 'לשיפור') : 'אין נתונים', tone: rirAdherence >= 75 ? 'good' : 'medium' },
    readiness: { label: 'מוכנות', value: readiness ? `${round(readiness)} / 7` : '—', status: readiness >= 5 ? 'טוב' : readiness ? 'בינוני' : 'אין נתונים', tone: readiness >= 5 ? 'good' : 'medium' },
  };
}

function buildCycle(cycle) {
  if (!cycle) return { hasData: false, totalWeeks: 12, currentWeek: 1, completedWeeks: [], deloadWeeks: [4, 8, 12], phaseLabel: 'טרם התחיל' };
  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(cycle.starts_on).getTime()) / (7 * 86400000)));
  const currentWeek = Math.min(cycle.planned_weeks, elapsed + 1);
  return { hasData: true, totalWeeks: cycle.planned_weeks, currentWeek, completedWeeks: Array.from({ length: currentWeek - 1 }, (_, index) => index + 1), deloadWeeks: [4, 8, 12].filter((week) => week <= cycle.planned_weeks), phaseLabel: cycle.name };
}

export function buildStatisticsModel(source = {}) {
  return {
    schemaVersion: 3,
    generatedAt: new Date().toISOString(),
    source: 'supabase',
    bodyWeight: buildWeight(source.weights || []),
    muscleVolume: buildMuscleVolume(source.muscleVolume || []),
    exercisePerformance: buildPerformance(source.performance || []),
    recovery: buildRecovery(source.recovery || [], source.performance || []),
    mesocycle: buildCycle(source.cycle || null),
  };
}
