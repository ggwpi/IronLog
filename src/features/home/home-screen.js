import { escapeHtml } from '../../core/escape-html.js';
import '../../anatomy/workout-art.js';

const schedule = [
  { day: 1, short: 'PUSH A', title: 'Chest + Biceps', subtitle: 'Chest · Biceps', exercises: 7, sets: 24, minutes: 72, art: [{ col: 0, row: 0 }] },
  { day: 2, short: 'LEGS A', title: 'Legs Heavy + Abs', subtitle: 'Quads · Hamstrings · Glutes · Core', exercises: 8, sets: 29, minutes: 88, art: [{ col: 4, row: 0 }, { col: 0, row: 1 }, { col: 4, row: 1 }] },
  { day: 3, short: 'PULL A', title: 'Back + Triceps', subtitle: 'Back · Triceps · Rear Delts', exercises: 8, sets: 27, minutes: 82, art: [{ col: 3, row: 0 }] },
  { day: 4, short: 'PUSH B', title: 'Shoulders + Chest', subtitle: 'Shoulders · Chest', exercises: 5, sets: 20, minutes: 64, art: [{ col: 0, row: 0 }, { col: 1, row: 0 }] },
  { day: 5, short: 'LEGS B', title: 'Legs Hypertrophy + Abs', subtitle: 'Quads · Hamstrings · Calves · Core', exercises: 8, sets: 30, minutes: 86, art: [{ col: 4, row: 0 }, { col: 0, row: 1 }, { col: 1, row: 1 }, { col: 4, row: 1 }] },
  { day: 6, short: 'ARMS', title: 'Arms + Shoulders', subtitle: 'Biceps · Triceps · Delts', exercises: 8, sets: 27, minutes: 76, art: [{ col: 2, row: 1 }, { col: 1, row: 0 }] },
];

const weekLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
let sheetBlobUrl = null;

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

function dataUrlToBlobUrl(dataUrl) {
  if (sheetBlobUrl) return sheetBlobUrl;
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return null;
  try {
    const comma = dataUrl.indexOf(',');
    const header = dataUrl.slice(0, comma);
    const payload = dataUrl.slice(comma + 1);
    const mime = header.match(/^data:([^;]+)/)?.[1] || 'image/webp';
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    sheetBlobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
    return sheetBlobUrl;
  } catch {
    return null;
  }
}

export function hydrateHomeArt(root = document) {
  const blobUrl = dataUrlToBlobUrl(window.IRONLOG_WORKOUT_ART?.sheet);
  if (!blobUrl) return;
  root.querySelectorAll('[data-workout-sheet]').forEach((image) => {
    image.addEventListener('load', () => image.closest('.home-body')?.classList.add('is-loaded'), { once: true });
    image.src = blobUrl;
  });
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
  const compact = workout.art.length > 2 ? ' is-compact' : '';
  return `<div class="home-anatomy${compact}" aria-label="שרירי המטרה של ${escapeHtml(workout.title)}">
    <div class="home-anatomy__glow" aria-hidden="true"></div>
    <div class="home-anatomy__bodies">
      ${workout.art.map(({ col, row }) => `<div class="home-body" style="--col:${col};--row:${row}">
        <img data-workout-sheet alt="" aria-hidden="true">
      </div>`).join('')}
    </div>
  </div>`;
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
      <div><strong>6</strong><small>ימי אימון</small></div>
      <div><strong>${weeklySets}</strong><small>סטים השבוע</small></div>
      <div><strong>${Math.round(weeklyMinutes / 60)}h</strong><small>זמן מתוכנן</small></div>
    </section>

    <section class="home-activity" aria-label="פעילות שבועית">
      <div class="home-activity__heading"><div><span class="home-kicker">CALENDAR ACTIVITY</span><h3>השבוע שלך</h3></div><span>${currentDay === 0 ? 'REST DAY' : 'ACTIVE WEEK'}</span></div>
      <div class="home-week">${weekActivity(currentDay)}</div>
    </section>
  </div>`;
}
