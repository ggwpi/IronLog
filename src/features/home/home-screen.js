import { escapeHtml } from '../../core/escape-html.js';
import { WORKOUTS, workoutForDay, nextWorkoutFromDay } from '../workouts/workout-catalog.js';

const weekLabels = ['ב', 'ג', 'ד', 'ה', 'ו', 'ש', 'א'];

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
    const level = planned ? activity[index] : 8;

    return `<div class="home-day ${current ? 'is-today' : ''} ${planned ? 'is-planned' : ''}">
      <div class="home-day__bar"><i style="--activity:${level}%"></i></div>
      <span>${label}</span>
    </div>`;
  }).join('');
}

function workoutImage(workout) {
  if (!workout.images?.length) return '';

  const label = escapeHtml(`שרירי המטרה: ${workout.targets.join(', ')}`);
  const images = workout.images.map((src, index) => {
    const view = index === 0 ? 'מבט קדמי' : 'מבט אחורי';
    const imageLabel = escapeHtml(`${workout.short} — ${view}`);
    return `<div class="home-workout-view">
      <img src="${src}" alt="${imageLabel}" width="1024" height="1536" loading="eager" decoding="async">
      <span>${index === 0 ? 'FRONT' : 'BACK'}</span>
    </div>`;
  }).join('');

  return `<figure class="home-workout-image" aria-label="${label}">
    <div class="home-workout-images" data-count="${workout.images.length}">${images}</div>
  </figure>`;
}

function targetPills(workout) {
  return workout.targets.map((target) => `<span>${escapeHtml(target)}</span>`).join('');
}

export function HomeScreen({ userName = 'מתאמן' } = {}) {
  const safeName = escapeHtml(userName);
  const workout = nearestWorkout();
  const currentDay = new Date().getDay();
  const weeklySets = WORKOUTS.reduce((total, item) => total + item.sets, 0);
  const weeklyMinutes = WORKOUTS.reduce((total, item) => total + item.minutes, 0);

  return `<div class="home-dashboard animate-enter" dir="rtl">
    <header class="home-header">
      <div class="home-header__identity">
        <span>${greeting()}</span>
        <h1>${safeName}<b>.</b></h1>
      </div>
      <div class="home-header__brand" aria-label="IronLog">
        <i></i>
        <span>IRONLOG</span>
      </div>
    </header>

    <section class="home-hero" aria-label="האימון הקרוב">
      <div class="home-hero__heading">
        <div>
          <span class="home-kicker">${workout.timing} · NEXT WORKOUT</span>
          <h2>${workout.short}</h2>
          <p>${workout.title}</p>
        </div>
        <span class="home-hero__number">06</span>
      </div>

      <div class="home-hero__visual">
        ${workoutImage(workout)}
        <div class="home-targets" aria-label="שרירי מטרה">${targetPills(workout)}</div>
      </div>

      <div class="home-hero__footer">
        <div class="home-workout-meta">
          <span><strong>${workout.exercises}</strong><small>תרגילים</small></span>
          <span><strong>${workout.sets}</strong><small>סטים</small></span>
          <span><strong>~${workout.minutes}</strong><small>דקות</small></span>
        </div>
        <button class="home-primary-action" type="button" data-route="workouts">
          <span>פתח אימון</span><i aria-hidden="true">↗</i>
        </button>
      </div>
    </section>

    <section class="home-summary" aria-label="סיכום תוכנית שבועי">
      <article><span>ימי אימון</span><strong>6</strong><small>מתוך 7 ימים</small></article>
      <article><span>סטים שבועיים</span><strong>${weeklySets}</strong><small>מתוכננים</small></article>
      <article><span>זמן שבועי</span><strong>${Math.round(weeklyMinutes / 60)}<em>h</em></strong><small>בקירוב</small></article>
    </section>

    <section class="home-activity" aria-label="פעילות שבועית">
      <div class="home-activity__heading">
        <div>
          <span class="home-kicker">WEEKLY ACTIVITY</span>
          <h3>השבוע שלך</h3>
        </div>
        <span class="home-activity__status"><i></i>${currentDay === 0 ? 'REST DAY' : 'ACTIVE'}</span>
      </div>
      <div class="home-week">${weekActivity(currentDay)}</div>
    </section>
  </div>`;
}
