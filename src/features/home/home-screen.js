import { escapeHtml } from '../../core/escape-html.js';
import { workoutForDay, nextWorkoutFromDay } from '../workouts/workout-catalog.js';

const DAYS = Object.freeze([
  { jsDay: 0, label: 'א׳' },
  { jsDay: 1, label: 'ב׳' },
  { jsDay: 2, label: 'ג׳' },
  { jsDay: 3, label: 'ד׳' },
  { jsDay: 4, label: 'ה׳' },
  { jsDay: 5, label: 'ו׳' },
  { jsDay: 6, label: 'ש׳' },
]);

const ACTIVITY = [44, 66, 43, 56, 91, 36, 45];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'בוקר טוב';
  if (hour < 18) return 'צהריים טובים';
  return 'ערב טוב';
}

function nearestWorkout() {
  const currentDay = new Date().getDay();
  const today = workoutForDay(currentDay);
  if (today) return { ...today, timing: 'היום' };

  const next = nextWorkoutFromDay(currentDay);
  return { ...next, timing: currentDay === 0 ? 'מחר' : 'האימון הבא' };
}

function workoutArt(workout) {
  if (!workout.images?.length) return '';

  const front = workout.images[0];
  const back = workout.images[1] || workout.images[0];
  const label = escapeHtml(`שרירי המטרה: ${workout.targets.join(', ')}`);

  return `<figure class="home-workout-art" aria-label="${label}">
    <img class="home-body home-body--back" src="${back}" alt="${escapeHtml(`${workout.short} — מבט אחורי`)}" width="1024" height="1536" loading="eager" decoding="async">
    <img class="home-body home-body--front" src="${front}" alt="${escapeHtml(`${workout.short} — מבט קדמי`)}" width="1024" height="1536" loading="eager" decoding="async">
  </figure>`;
}

function weeklyProgress(currentDay) {
  return DAYS.map(({ jsDay, label }) => {
    const planned = Boolean(workoutForDay(jsDay));
    const current = jsDay === currentDay;
    const complete = planned && (currentDay === 0 ? true : jsDay < currentDay);
    const state = [planned ? 'is-planned' : '', current ? 'is-current' : '', complete ? 'is-complete' : ''].filter(Boolean).join(' ');

    return `<div class="home-progress-day ${state}">
      <span>${label}</span>
      <i>${complete ? '✓' : current ? '•' : ''}</i>
    </div>`;
  }).join('');
}

function activityBars() {
  return DAYS.map(({ label }, index) => `<div class="home-activity-bar">
    <i style="--activity:${ACTIVITY[index]}%"></i>
    <span>${label}</span>
  </div>`).join('');
}

export function HomeScreen({ userName = 'מתאמן' } = {}) {
  const safeName = escapeHtml(userName);
  const workout = nearestWorkout();
  const currentDay = new Date().getDay();
  const heroLabel = workout.timing === 'היום' ? "TODAY'S WORKOUT" : 'NEXT WORKOUT';

  return `<div class="home-editorial animate-enter" dir="rtl">
    <header class="home-editorial__header">
      <div class="home-brand" aria-label="IronLog"><i aria-hidden="true"></i><span>IRONLOG</span></div>
      <div class="home-user">
        <button class="home-bolt" type="button" aria-label="IronLog"><span>ϟ</span></button>
        <div><span>${greeting()},</span><h1>${safeName}<b>.</b></h1></div>
      </div>
    </header>

    <section class="home-stage" aria-label="האימון הקרוב">
      <div class="home-stage__smoke" aria-hidden="true"></div>
      ${workoutArt(workout)}

      <div class="home-stage__copy">
        <span class="home-kicker">${heroLabel}</span>
        <h2>${escapeHtml(workout.short)}</h2>
        <p>${escapeHtml(workout.title)}</p>
        <span class="home-accent-line" aria-hidden="true"></span>

        <div class="home-motivation">
          <span>חוזק בכל חזרה.</span>
          <span>שליטה בכל תנועה.</span>
        </div>

        <div class="home-workout-meta" aria-label="פרטי האימון">
          <span><strong>${String(workout.exercises).padStart(2, '0')}</strong><small>תרגילים</small></span>
          <span><strong>${workout.sets}</strong><small>סטים</small></span>
          <span><strong>${workout.minutes}</strong><small>דקות</small></span>
        </div>

        <button class="home-start" type="button" data-route="workouts">
          <span>פתח אימון</span><i aria-hidden="true">→</i>
        </button>
      </div>
    </section>

    <section class="home-progress-card" aria-label="התקדמות שבועית">
      <div class="home-card-heading">
        <span class="home-card-title">WEEKLY PROGRESS</span>
        <div><i aria-hidden="true">⌁</i><span>התקדמות שבועית</span></div>
      </div>
      <div class="home-progress-days">${weeklyProgress(currentDay)}</div>
    </section>

    <section class="home-activity-card" aria-label="פעילות שבועית">
      <div class="home-card-heading">
        <span class="home-card-title">ACTIVITY</span>
        <div><span>פעילות</span></div>
      </div>
      <div class="home-chart">
        <div class="home-chart__grid" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <div class="home-chart__bars">${activityBars()}</div>
      </div>
    </section>
  </div>`;
}
