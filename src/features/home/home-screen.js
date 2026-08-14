import { escapeHtml } from '../../core/escape-html.js';
import { WORKOUTS, workoutForDay, nextWorkoutFromDay } from '../workouts/workout-catalog.js';

const weekLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

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

function weekActivity(currentDay) {
  const activity = [72, 44, 83, 58, 76, 51, 12];

  return weekLabels.map((label, index) => {
    const jsDay = index < 6 ? index + 1 : 0;
    const planned = Boolean(workoutForDay(jsDay));
    const current = jsDay === currentDay;

    return `<div class="home-day ${current ? 'is-today' : ''} ${planned ? 'is-planned' : ''}">
      <div class="home-day__line"><i style="--activity:${planned ? activity[index] : 8}%"></i><b></b></div>
      <span>${label}</span>
    </div>`;
  }).join('');
}

function workoutImage(workout) {
  if (!workout.image) return '';
  const label = escapeHtml(`שרירי המטרה: ${workout.targets.join(', ')}`);

  return `<figure class="home-workout-image" aria-label="${label}">
    <img src="${workout.image}" alt="${label}" loading="eager" decoding="async">
  </figure>`;
}

export function HomeScreen({ userName = 'מתאמן' } = {}) {
  const safeName = escapeHtml(userName);
  const workout = nearestWorkout();
  const currentDay = new Date().getDay();
  const weeklySets = WORKOUTS.reduce((total, item) => total + item.sets, 0);
  const weeklyMinutes = WORKOUTS.reduce((total, item) => total + item.minutes, 0);

  return `<div class="home-art animate-enter" dir="rtl">
    <header class="home-art__header">
      <div><span>${greeting()},</span><h1>${safeName}<b>.</b></h1></div>
      <span class="home-pulse" aria-hidden="true">⌁</span>
    </header>

    <section class="home-workout" aria-label="האימון הקרוב">
      <div class="home-workout__copy">
        <span class="home-kicker">${workout.timing} · NEXT WORKOUT</span>
        <h2>${workout.short}</h2>
        <h3>${workout.title}</h3>
        <div class="home-workout-meta">
          <span><strong>${workout.exercises}</strong><small>תרגילים</small></span>
          <span><strong>${workout.sets}</strong><small>סטים</small></span>
          <span><strong>~${workout.minutes}</strong><small>דק׳</small></span>
        </div>
        <button class="home-start" type="button" data-route="workouts"><span>פתח אימון</span><i>↗</i></button>
      </div>
      ${workoutImage(workout)}
    </section>

    <section class="home-metrics" aria-label="סיכום תוכנית שבועי">
      <div><strong>6</strong><small>ימי אימון</small></div>
      <div><strong>${weeklySets}</strong><small>סטים השבוע</small></div>
      <div><strong>${Math.round(weeklyMinutes / 60)}h</strong><small>זמן מתוכנן</small></div>
    </section>

    <section class="home-activity" aria-label="פעילות שבועית">
      <div class="home-activity__heading">
        <div><span class="home-kicker">CALENDAR ACTIVITY</span><h3>השבוע שלך</h3></div>
        <span>${currentDay === 0 ? 'REST DAY' : 'ACTIVE WEEK'}</span>
      </div>
      <div class="home-week">${weekActivity(currentDay)}</div>
    </section>
  </div>`;
}
