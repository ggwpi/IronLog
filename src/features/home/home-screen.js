import { escapeHtml } from '../../core/escape-html.js';
import '../../anatomy/chest.js';
import '../../anatomy/biceps.js';
import '../../anatomy/triceps.js';
import '../../anatomy/shoulders.js';
import '../../anatomy/back.js';
import '../../anatomy/abs.js';
import '../../anatomy/quads.js';
import '../../anatomy/hamstrings.js';
import '../../anatomy/glutes.js';
import '../../anatomy/calves.js';

const schedule = [
  { day: 1, short: 'PUSH A', title: 'Chest + Biceps', subtitle: 'Chest · Biceps', exercises: 7, sets: 24, minutes: 72, anatomy: ['chest', 'biceps'] },
  { day: 2, short: 'LEGS A', title: 'Legs Heavy + Abs', subtitle: 'Quads · Hamstrings · Glutes · Core', exercises: 8, sets: 29, minutes: 88, anatomy: ['quads', 'hamstrings'] },
  { day: 3, short: 'PULL A', title: 'Back + Triceps', subtitle: 'Back · Triceps · Rear Delts', exercises: 8, sets: 27, minutes: 82, anatomy: ['back', 'triceps'] },
  { day: 4, short: 'PUSH B', title: 'Shoulders + Chest', subtitle: 'Shoulders · Chest', exercises: 5, sets: 20, minutes: 64, anatomy: ['shoulders', 'chest'] },
  { day: 5, short: 'LEGS B', title: 'Legs Hypertrophy + Abs', subtitle: 'Quads · Hamstrings · Calves · Core', exercises: 8, sets: 30, minutes: 86, anatomy: ['quads', 'calves'] },
  { day: 6, short: 'ARMS', title: 'Arms + Shoulders', subtitle: 'Biceps · Triceps · Delts', exercises: 8, sets: 27, minutes: 76, anatomy: ['biceps', 'triceps'] },
];

const weekLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'בוקר טוב';
  if (hour < 18) return 'צהריים טובים';
  return 'ערב טוב';
}

function nearestWorkout() {
  const currentDay = new Date().getDay();
  const today = schedule.find((item) => item.day === currentDay);
  if (today) return { ...today, timing: 'היום' };
  const next = schedule.find((item) => item.day > currentDay) || schedule[0];
  return { ...next, timing: currentDay === 0 ? 'מחר' : 'האימון הבא' };
}

function weekActivity(currentDay) {
  const activity = [72, 44, 83, 58, 76, 51, 12];
  return weekLabels.map((label, index) => {
    const jsDay = index < 6 ? index + 1 : 0;
    const planned = schedule.some((item) => item.day === jsDay);
    const current = jsDay === currentDay;
    return `<div class="home-day ${current ? 'is-today' : ''} ${planned ? 'is-planned' : ''}">
      <div class="home-day__line"><i style="--activity:${planned ? activity[index] : 8}%"></i><b></b></div>
      <span>${label}</span>
    </div>`;
  }).join('');
}

function anatomyVisual(workout) {
  const [primary, secondary] = workout.anatomy;
  return `<div class="home-anatomy" aria-label="שרירי המטרה של ${escapeHtml(workout.title)}">
    <div class="home-anatomy__halo" aria-hidden="true"></div>
    <img class="home-anatomy__primary" data-anatomy="${escapeHtml(primary)}" alt="">
    <img class="home-anatomy__secondary" data-anatomy="${escapeHtml(secondary)}" alt="">
    <div class="home-anatomy__caption"><span>PRIMARY FOCUS</span><strong>${escapeHtml(workout.subtitle)}</strong></div>
  </div>`;
}

export function hydrateHomeAnatomy(root = document) {
  const assets = window.IRONLOG_ANATOMY_ASSETS || {};

  root.querySelectorAll('img[data-anatomy]').forEach((image) => {
    const name = image.dataset.anatomy;
    const source = assets[name];

    image.removeAttribute('src');
    image.classList.remove('is-loaded', 'is-error');

    if (!source) {
      image.hidden = true;
      return;
    }

    image.addEventListener('load', () => image.classList.add('is-loaded'), { once: true });
    image.addEventListener('error', () => {
      image.classList.add('is-error');
      image.hidden = true;
    }, { once: true });

    requestAnimationFrame(() => {
      image.src = source;
    });
  });
}

export function HomeScreen({ userName = 'מתאמן' } = {}) {
  const safeName = escapeHtml(userName);
  const workout = nearestWorkout();
  const currentDay = new Date().getDay();
  const weeklySets = schedule.reduce((total, item) => total + item.sets, 0);
  const weeklyMinutes = schedule.reduce((total, item) => total + item.minutes, 0);

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
        <p>${workout.subtitle}</p>
        <div class="home-workout-meta">
          <span><strong>${workout.exercises}</strong><small>תרגילים</small></span>
          <span><strong>${workout.sets}</strong><small>סטים</small></span>
          <span><strong>~${workout.minutes}</strong><small>דק׳</small></span>
        </div>
        <button class="home-start" type="button" data-route="workouts"><span>פתח אימון</span><i>↗</i></button>
      </div>
      ${anatomyVisual(workout)}
    </section>

    <section class="home-metrics" aria-label="סיכום תוכנית שבועי">
      <div><span>TRAINING DAYS</span><strong>6</strong><small>השבוע</small></div>
      <i></i>
      <div><span>WEEKLY SETS</span><strong>${weeklySets}</strong><small>מתוכננים</small></div>
      <i></i>
      <div><span>TRAINING TIME</span><strong>${Math.round(weeklyMinutes / 60)}h</strong><small>בקירוב</small></div>
    </section>

    <section class="home-activity" aria-label="פעילות שבועית">
      <div class="home-activity__heading"><div><span class="home-kicker">CALENDAR ACTIVITY</span><h3>השבוע שלך</h3></div><span>${currentDay === 0 ? 'REST DAY' : 'ACTIVE WEEK'}</span></div>
      <div class="home-week">${weekActivity(currentDay)}</div>
    </section>
  </div>`;
}
