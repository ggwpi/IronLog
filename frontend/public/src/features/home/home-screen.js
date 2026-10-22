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

function prefersBackView(workout) {
  const targets = new Set(workout?.targets || []);
  return ['Back', 'Rear Delts', 'Hamstrings', 'Glutes'].some((target) => targets.has(target));
}

function workoutArt(workout) {
  const images = workoutImages(workout);
  if (!images.length) return '';
  const front = images[0];
  const back = images[1] || images[0];
  const useBack = prefersBackView(workout);
  const primary = useBack ? back : front;
  const secondary = useBack ? front : back;
  const primaryClass = useBack ? 'home-body--back' : 'home-body--front';
  const secondaryClass = useBack ? 'home-body--front' : 'home-body--back';
  const primaryLabel = useBack ? 'מבט אחורי' : 'מבט קדמי';
  const secondaryLabel = useBack ? 'מבט קדמי' : 'מבט אחורי';
  const targetLabel = escapeHtml(`שרירי המטרה: ${(workout.targets || []).join(', ')}`);

  return `<figure class="home-workout-art" aria-label="${targetLabel}" data-primary-view="${useBack ? 'back' : 'front'}">
    <img class="home-body home-body--ghost ${secondaryClass}" src="${escapeHtml(secondary)}" alt="${escapeHtml(`${workout.short} — ${secondaryLabel}`)}" width="1024" height="1536" loading="eager" decoding="async">
    <img class="home-body home-body--primary ${primaryClass}" src="${escapeHtml(primary)}" alt="${escapeHtml(`${workout.short} — ${primaryLabel}`)}" width="1024" height="1536" loading="eager" decoding="async">
  </figure>`;
}

function heroSubtitle(workout) {
  const short = String(workout?.short || '').trim();
  let title = String(workout?.title || workout?.description || '').trim();

  if (short && title.toLocaleUpperCase().startsWith(short.toLocaleUpperCase())) {
    title = title.slice(short.length).replace(/^\s*[—–:\-]+\s*/, '').trim();
  }

  if (!title) title = (workout?.targets || []).join(', ');
  if (!title) title = 'PERSONAL WORKOUT';
  return title.toUpperCase();
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
  return { completed, target };
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
    const fill = complete ? 100 : active ? 84 : current && planned ? 68 : planned ? 34 : 10;
    const state = [
      planned ? 'is-planned' : '',
      current ? 'is-current' : '',
      complete ? 'is-complete' : '',
      active ? 'is-active' : '',
    ].filter(Boolean).join(' ');

    return `<div class="home-progress-day ${state}" style="--day-fill:${fill}%">
      <i aria-hidden="true"><b></b></i>
      <span>${label}</span>
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

function activityBars(workoutData, metrics) {
  const sessions = sessionsByDay(workoutData);
  const fragments = [];
  const multipliers = [0.46, 1, 0.66];

  DAYS.forEach(({ jsDay }) => {
    const value = metrics.byDay[jsDay] || 0;
    const hasSession = (sessions.get(jsDay) || []).length > 0;
    multipliers.forEach((multiplier, index) => {
      const normalized = value > 0
        ? Math.max(12, Math.round((value / metrics.max) * 82 * multiplier))
        : (hasSession ? 11 + index * 4 : 4 + index * 2);
      const className = value > 0 ? 'has-value' : hasSession ? 'has-session' : 'is-empty';
      fragments.push(`<i class="${className}" style="--activity:${normalized}%" aria-hidden="true"></i>`);
    });
  });

  return fragments.join('');
}

function activityTrend(metrics) {
  if (metrics.delta === null) return metrics.total > 0 ? 'BASELINE WEEK' : 'THIS WEEK';
  if (metrics.delta === 0) return 'SAME AS LAST WEEK';
  return `${metrics.delta > 0 ? '+' : ''}${metrics.delta}% VS LAST WEEK`;
}

function miniBarsIcon() {
  return '<span class="home-mini-bars" aria-hidden="true"><i></i><i></i><i></i></span>';
}

export function HomeScreen({ userName = 'מתאמן', workouts = WORKOUTS, workoutData = {} } = {}) {
  const workout = nearestWorkout(workouts);
  const currentDay = new Date().getDay();
  const heroLabel = workout.timing === 'היום' ? "TODAY'S WORKOUT" : 'NEXT WORKOUT';
  const goal = weeklyGoal(workouts, workoutData);
  const activity = activityMetrics(workoutData);

  return `<div class="home-editorial home-rebuild animate-enter" dir="rtl">
    ${AppPageHeader({
      title: userName,
      subtitle: `${greeting()},`,
      subtitleAbove: true,
      rootClass: 'home-editorial__header',
      brandClass: 'home-brand',
      headingClass: 'home-user',
    })}

    <section class="home-stage" aria-label="האימון הקרוב">
      <div class="home-stage__visual">
        <div class="home-stage__aura" aria-hidden="true"></div>
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

          <button class="home-start" type="button" data-route="workouts">
            <span>פתח אימון</span><i aria-hidden="true">←</i>
          </button>
        </div>
      </div>
    </section>

    <section class="home-progress-card home-section" aria-label="התקדמות שבועית">
      <div class="home-section-heading">
        <div class="home-section-copy">
          <div class="home-section-title-row"><h3>התקדמות שבועית</h3>${miniBarsIcon()}</div>
          <p>WEEKLY PROGRESS</p>
        </div>
        <span class="home-section-action" dir="ltr">${goal.target ? `${goal.completed}/${goal.target}` : '—'}</span>
      </div>

      <div class="home-progress-days" aria-label="התקדמות לפי ימים">
        ${weeklyProgress(currentDay, workouts, workoutData)}
      </div>
    </section>

    <section class="home-activity-card home-section" aria-label="פעילות שבועית">
      <div class="home-section-heading">
        <div class="home-section-copy">
          <div class="home-section-title-row"><h3>פעילות</h3>${miniBarsIcon()}</div>
          <p>ACTIVITY</p>
        </div>
        <span class="home-section-action home-section-action--period" dir="ltr">THIS WEEK</span>
      </div>

      <div class="home-activity-layout">
        <div class="home-chart" aria-label="גרף נפח אימון שבועי">
          <div class="home-chart__baseline" aria-hidden="true"></div>
          <div class="home-chart__bars">${activityBars(workoutData, activity)}</div>
        </div>
        <div class="home-activity-total">
          <strong>${goal.completed}</strong>
          <span>אימונים<br>השבוע</span>
          <small>${escapeHtml(activityTrend(activity))}</small>
        </div>
      </div>
    </section>
  </div>`;
}
