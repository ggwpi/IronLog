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
  return workouts.filter(isScheduled);
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

function workoutArt(workout) {
  if (!workout?.images?.length) return '';
  const front = workout.images[0];
  const back = workout.images[1] || workout.images[0];
  const label = escapeHtml(`שרירי המטרה: ${(workout.targets || []).join(', ')}`);
  return `<figure class="home-workout-art" aria-label="${label}">
    <img class="home-body home-body--back" src="${escapeHtml(back)}" alt="${escapeHtml(`${workout.short} — מבט אחורי`)}" width="1024" height="1536" loading="eager" decoding="async">
    <img class="home-body home-body--front" src="${escapeHtml(front)}" alt="${escapeHtml(`${workout.short} — מבט קדמי`)}" width="1024" height="1536" loading="eager" decoding="async">
  </figure>`;
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

function activityBars(workouts, workoutData) {
  const sessions = sessionsByDay(workoutData);
  const scheduled = scheduledWorkouts(workouts);
  return DAYS.map(({ jsDay, label }) => {
    const daySessions = sessions.get(jsDay) || [];
    const completed = daySessions.filter((session) => session.status === 'completed').length;
    const active = daySessions.some((session) => session.status === 'active');
    const planned = Boolean(workoutForDay(jsDay, scheduled));
    const activity = completed ? 92 : active ? 62 : planned ? 18 : 5;
    return `<div class="home-activity-bar"><i style="--activity:${activity}%"></i><span>${label}</span></div>`;
  }).join('');
}

export function HomeScreen({ userName = 'מתאמן', workouts = WORKOUTS, workoutData = {} } = {}) {
  const workout = nearestWorkout(workouts);
  const currentDay = new Date().getDay();
  const heroLabel = workout.timing === 'היום' ? "TODAY'S WORKOUT" : 'NEXT WORKOUT';

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
        <p>${escapeHtml(workout.title || '')}</p>
        <span class="home-accent-line" aria-hidden="true"></span>
        <div class="home-motivation"><span>חוזק בכל חזרה.</span><span>שליטה בכל תנועה.</span></div>
        <div class="home-workout-meta" aria-label="פרטי האימון">
          <span><strong>${String(Number(workout.exercises) || 0).padStart(2, '0')}</strong><small>תרגילים</small></span>
          <span><strong>${Number(workout.sets) || 0}</strong><small>סטים</small></span>
          <span><strong>${Number(workout.minutes) || 0}</strong><small>דקות</small></span>
        </div>
        <button class="home-start" type="button" data-route="workouts"><span>פתח אימון</span><i aria-hidden="true">→</i></button>
      </div>
    </section>

    <section class="home-progress-card" aria-label="התקדמות שבועית">
      <div class="home-card-heading"><span class="home-card-title">WEEKLY PROGRESS</span><div><i aria-hidden="true">⌁</i><span>התקדמות שבועית</span></div></div>
      <div class="home-progress-days">${weeklyProgress(currentDay, workouts, workoutData)}</div>
    </section>

    <section class="home-activity-card" aria-label="פעילות שבועית">
      <div class="home-card-heading"><span class="home-card-title">ACTIVITY</span><div><span>פעילות</span></div></div>
      <div class="home-chart"><div class="home-chart__grid" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="home-chart__bars">${activityBars(workouts, workoutData)}</div></div>
    </section>
  </div>`;
}
