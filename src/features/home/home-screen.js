import { escapeHtml } from '../../core/escape-html.js';
import { AppPageHeader } from '../../components/app-page-header.js';
import { WORKOUTS, workoutForDay, nextWorkoutFromDay } from '../workouts/workout-catalog.js';

const DAYS = Object.freeze([
  { jsDay: 0, label: 'א׳' },
  { jsDay: 1, label: 'ב׳' },
  { jsDay: 2, label: 'ג׳' },
  { jsDay: 3, label: 'ד׳' },
  { jsDay: 4, label: 'ה׳' },
  { jsDay: 5, label: 'ו׳' },
  { jsDay: 6, label: 'ש׳' },
]);

const TARGET_LABELS = Object.freeze({
  Chest: 'חזה',
  Shoulders: 'כתפיים',
  Delts: 'כתפיים',
  'Rear Delts': 'כתף אחורית',
  Triceps: 'טרייספס',
  Biceps: 'בייספס',
  Back: 'גב',
  Quads: 'ארבע־ראשי',
  Hamstrings: 'המסטרינג',
  Glutes: 'ישבן',
  Calves: 'תאומים',
  Core: 'ליבה',
});

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'בוקר טוב';
  if (hour < 18) return 'צהריים טובים';
  return 'ערב טוב';
}

function isScheduled(workout) {
  if (workout?.day === null || workout?.day === undefined || workout?.day === '') return false;
  const day = Number(workout.day);
  return Number.isInteger(day) && day >= 0 && day <= 6;
}

function scheduledWorkouts(workouts = []) {
  return workouts.filter(isScheduled).sort((a, b) => Number(a.day) - Number(b.day));
}

function nearestWorkout(workouts = WORKOUTS) {
  const source = scheduledWorkouts(workouts);
  const currentDay = new Date().getDay();
  const today = workoutForDay(currentDay, source);
  if (today) return { ...today, timing: 'היום' };
  const next = nextWorkoutFromDay(currentDay, source);
  if (next) return { ...next, timing: currentDay === 0 ? 'מחר' : 'האימון הבא' };
  const fallback = workouts[0] || WORKOUTS[0];
  return { ...fallback, timing: 'האימון הבא' };
}

function workoutImages(workout) {
  if (workout?.images?.length) return workout.images;
  const id = String(workout?.id || workout?.slug || '').toLowerCase();
  const fallback = WORKOUTS.find((item) => item.id === id);
  return fallback?.images?.length ? fallback.images : [];
}

function workoutArt(workout) {
  const images = workoutImages(workout);
  if (!images.length) return '';
  const front = images[0];
  const back = images[1] || images[0];
  const label = escapeHtml(`שרירי המטרה: ${(workout.targets || []).join(', ')}`);
  return `<figure class="home-workout-art" aria-label="${label}">
    <img class="home-body home-body--back" src="${escapeHtml(back)}" alt="${escapeHtml(`${workout.short} — מבט אחורי`)}" width="1024" height="1536" loading="eager" decoding="async">
    <img class="home-body home-body--front" src="${escapeHtml(front)}" alt="${escapeHtml(`${workout.short} — מבט קדמי`)}" width="1024" height="1536" loading="eager" decoding="async">
  </figure>`;
}

function heroSubtitle(workout) {
  const targets = (workout?.targets || [])
    .map((target) => TARGET_LABELS[target] || target)
    .filter(Boolean)
    .slice(0, 3);
  if (targets.length) return targets.join(' · ');
  return workout?.description || workout?.title || 'אימון אישי';
}

function startOfCurrentWeek() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function sessionsByDay(workoutData = {}) {
  const start = startOfCurrentWeek();
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const result = new Map();
  for (const session of workoutData.sessions || []) {
    const timestamp = new Date(session.completed_at || session.started_at);
    if (Number.isNaN(timestamp.getTime()) || timestamp < start || timestamp >= end) continue;
    const day = timestamp.getDay();
    const current = result.get(day) || [];
    current.push(session);
    result.set(day, current);
  }
  return result;
}

function weeklyGoal(workouts, workoutData) {
  const sessions = sessionsByDay(workoutData);
  const scheduled = scheduledWorkouts(workouts);
  const completedSessions = [...sessions.values()]
    .flat()
    .filter((session) => session.status === 'completed').length;
  const fallbackTarget = Number(workoutData?.summary?.plannedWorkouts) || 0;
  const target = scheduled.length || fallbackTarget;
  const completed = target ? Math.min(completedSessions, target) : completedSessions;
  const remaining = Math.max(target - completed, 0);
  const progress = target ? Math.min(100, Math.round((completed / target) * 100)) : (completed ? 100 : 0);
  return { completed, target, remaining, progress };
}

function weeklyProgress(currentDay, workouts, workoutData) {
  const sessions = sessionsByDay(workoutData);
  const scheduled = scheduledWorkouts(workouts);
  return DAYS.map(({ jsDay, label }) => {
    const planned = Boolean(workoutForDay(jsDay, scheduled));
    const daySessions = sessions.get(jsDay) || [];
    const complete = daySessions.some((session) => session.status === 'completed');
    const active = daySessions.some((session) => session.status === 'active');
    const current = jsDay === currentDay;
    const state = [planned ? 'is-planned' : '', current ? 'is-current' : '', complete ? 'is-complete' : '', active ? 'is-active' : ''].filter(Boolean).join(' ');
    return `<div class="home-progress-day ${state}">
      <span>${label}</span>
      <i>${complete ? '✓' : active || current ? '•' : ''}</i>
    </div>`;
  }).join('');
}

function pointLoad(point) {
  const load = Number(point?.load_kg || 0);
  const reps = Number(point?.reps || 0);
  return Number.isFinite(load) && Number.isFinite(reps) ? Math.max(0, load * reps) : 0;
}

function activityMetrics(workoutData = {}) {
  const weekStart = startOfCurrentWeek();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const previousStart = new Date(weekStart);
  previousStart.setDate(previousStart.getDate() - 7);
  const byDay = Array(7).fill(0);
  let previousTotal = 0;

  for (const point of workoutData.performanceHistory || []) {
    const timestamp = new Date(point.completed_at);
    if (Number.isNaN(timestamp.getTime())) continue;
    const load = pointLoad(point);
    if (timestamp >= weekStart && timestamp < weekEnd) byDay[timestamp.getDay()] += load;
    else if (timestamp >= previousStart && timestamp < weekStart) previousTotal += load;
  }

  const total = byDay.reduce((sum, value) => sum + value, 0);
  const max = Math.max(...byDay, 1);
  const delta = previousTotal > 0 ? Math.round(((total - previousTotal) / previousTotal) * 100) : null;
  return { byDay, total, previousTotal, max, delta };
}

function compactLoad(value) {
  const number = Math.max(0, Number(value) || 0);
  if (number >= 10000) return `${Math.round(number / 1000)}K`;
  if (number >= 1000) return `${(number / 1000).toFixed(1).replace('.0', '')}K`;
  return String(Math.round(number));
}

function activityBars(currentDay, workouts, workoutData, metrics) {
  const sessions = sessionsByDay(workoutData);
  const scheduled = scheduledWorkouts(workouts);
  return DAYS.map(({ jsDay, label }) => {
    const value = metrics.byDay[jsDay] || 0;
    const planned = Boolean(workoutForDay(jsDay, scheduled));
    const daySessions = sessions.get(jsDay) || [];
    const complete = daySessions.some((session) => session.status === 'completed');
    const current = jsDay === currentDay;
    const activity = value > 0
      ? Math.round(24 + (value / metrics.max) * 76)
      : planned ? 12 : 4;
    const state = [value > 0 ? 'has-value' : '', planned ? 'is-planned' : '', complete ? 'is-complete' : '', current ? 'is-current' : ''].filter(Boolean).join(' ');
    return `<div class="home-activity-bar ${state}">
      <em>${value > 0 ? escapeHtml(compactLoad(value)) : ''}</em>
      <i style="--activity:${activity}%"></i>
      <span>${label}</span>
    </div>`;
  }).join('');
}

function goalInsight(goal) {
  if (!goal.target) return 'הוסף ימי אימון לתוכנית כדי להגדיר יעד שבועי.';
  if (!goal.remaining) return 'היעד השבועי הושלם. עבודה מצוינת.';
  if (goal.completed === 0) return `${goal.target} אימונים מתוכננים לשבוע הזה.`;
  return `${goal.remaining} אימונים נשארו כדי להשלים את היעד השבועי.`;
}

function activityInsight(metrics, goal) {
  if (metrics.total <= 0) {
    return goal.completed > 0
      ? 'האימון הושלם, אבל עדיין אין נתוני עומס משקולות זמינים לגרף.'
      : 'הגרף יתמלא אוטומטית אחרי שתתחיל לרשום סטים השבוע.';
  }
  if (metrics.delta === null) return 'זה השבוע הראשון עם מספיק נתונים להשוואת עומס.';
  if (metrics.delta === 0) return 'נפח האימון זהה לשבוע הקודם.';
  return `${metrics.delta > 0 ? 'עלייה' : 'ירידה'} של ${Math.abs(metrics.delta)}% לעומת השבוע הקודם.`;
}

export function HomeScreen({ userName = 'מתאמן', workouts = WORKOUTS, workoutData = {} } = {}) {
  const workout = nearestWorkout(workouts);
  const currentDay = new Date().getDay();
  const heroLabel = workout.timing === 'היום' ? "TODAY'S WORKOUT" : 'NEXT WORKOUT';
  const goal = weeklyGoal(workouts, workoutData);
  const activity = activityMetrics(workoutData);
  const activityTrend = activity.delta === null
    ? (activity.total > 0 ? 'השבוע הראשון להשוואה' : 'עדיין אין נפח השבוע')
    : `${activity.delta >= 0 ? '+' : ''}${activity.delta}% מהשבוע הקודם`;

  return `<div class="home-editorial animate-enter" dir="rtl">
    ${AppPageHeader({
      title: userName,
      subtitle: `${greeting()},`,
      subtitleAbove: true,
      rootClass: 'home-editorial__header',
      brandClass: 'home-brand',
      headingClass: 'home-user',
    })}

    <section class="home-stage" aria-label="האימון הקרוב">
      <div class="home-stage__smoke" aria-hidden="true"></div>
      ${workoutArt(workout)}
      <div class="home-stage__copy">
        <span class="home-kicker">${heroLabel}</span>
        <h2>${escapeHtml(workout.short || workout.title || 'אימון')}</h2>
        <p>${escapeHtml(heroSubtitle(workout))}</p>
        <div class="home-workout-meta" aria-label="פרטי האימון">
          <span><strong>${String(Number(workout.exercises) || 0).padStart(2, '0')}</strong><small>תרגילים</small></span>
          <span><strong>${Number(workout.sets) || 0}</strong><small>סטים</small></span>
          <span><strong>${Number(workout.minutes) || 0}</strong><small>דקות</small></span>
        </div>
        <button class="home-start" type="button" data-route="workouts"><span>פתח אימון</span><i aria-hidden="true">‹</i></button>
      </div>
    </section>

    <section class="home-progress-card" aria-label="התקדמות שבועית">
      <div class="home-metric-heading">
        <div class="home-metric-copy">
          <span class="home-card-title">WEEKLY GOAL</span>
          <h3>התקדמות שבועית</h3>
          <p>${goal.target ? `${goal.completed} מתוך ${goal.target} אימונים הושלמו` : 'עדיין לא הוגדר יעד שבועי'}</p>
        </div>
        <div class="home-progress-ring" style="--weekly-progress:${goal.progress}%" aria-label="${goal.progress}% מהיעד הושלם">
          <strong>${goal.progress}</strong><span>%</span>
        </div>
      </div>
      <div class="home-progress-days">${weeklyProgress(currentDay, workouts, workoutData)}</div>
      <div class="home-widget-insight"><span>${escapeHtml(goalInsight(goal))}</span><strong>${goal.remaining ? `${goal.remaining} נותרו` : goal.target ? 'הושלם' : 'ללא יעד'}</strong></div>
    </section>

    <section class="home-activity-card" aria-label="נפח אימון שבועי">
      <div class="home-metric-heading home-metric-heading--activity">
        <div class="home-metric-copy">
          <span class="home-card-title">TRAINING LOAD</span>
          <h3>נפח השבוע</h3>
          <p>${escapeHtml(activityTrend)}</p>
        </div>
        <div class="home-volume-total" dir="ltr"><strong>${escapeHtml(compactLoad(activity.total))}</strong><span>KG</span></div>
      </div>
      <div class="home-chart">
        <div class="home-chart__grid" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="home-chart__bars">${activityBars(currentDay, workouts, workoutData, activity)}</div>
      </div>
      <div class="home-widget-insight"><span>${escapeHtml(activityInsight(activity, goal))}</span><strong>${goal.completed} אימונים</strong></div>
    </section>
  </div>`;
}
