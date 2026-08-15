import { escapeHtml } from '../../core/escape-html.js';
import { Icon } from '../../components/icons.js';
import { AppPageHeader } from '../../components/app-page-header.js';
import { WORKOUTS, workoutForDay, nextWorkoutFromDay } from './workout-catalog.js';

const DAY_LABELS = Object.freeze(['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']);
const MONTHS = Object.freeze(['בינו׳', 'בפבר׳', 'במרץ', 'באפר׳', 'במאי', 'ביוני', 'ביולי', 'באוג׳', 'בספט׳', 'באוק׳', 'בנוב׳', 'בדצמ׳']);

function weekDates(selectedDay = new Date().getDay()) {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setHours(12, 0, 0, 0);
  sunday.setDate(now.getDate() - now.getDay());

  return DAY_LABELS.map((label, day) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + day);
    return { label, day, date, selected: day === selectedDay };
  });
}

function selectedWorkout(workouts) {
  const today = new Date().getDay();
  return workoutForDay(today, workouts) || nextWorkoutFromDay(today, workouts);
}

function workoutDate(workout) {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setHours(12, 0, 0, 0);
  sunday.setDate(today.getDate() - today.getDay());

  const date = new Date(sunday);
  date.setDate(sunday.getDate() + workout.day);
  if (workout.day < today.getDay()) date.setDate(date.getDate() + 7);
  return date;
}

function compactTitle(workout) {
  return workout.short.replace(/\s+[AB]$/, '');
}

function hebrewTargets(workout) {
  const map = {
    Chest: 'חזה', Biceps: 'בייספס', Triceps: 'טרייספס', Shoulders: 'כתפיים',
    Back: 'גב', 'Rear Delts': 'כתף אחורית', Quads: 'רגליים', Hamstrings: 'המסטרינג',
    Glutes: 'ישבן', Core: 'בטן', Calves: 'תאומים', Delts: 'כתפיים',
  };
  return workout.targets.map((target) => map[target] || target).join(' · ');
}

function heroSubtitle(workout) {
  const label = compactTitle(workout);
  if (label === 'ARMS') return 'ידיים + כתפיים';
  if (label === 'PUSH') return 'חזה + כתפיים';
  if (label === 'PULL') return 'גב + ידיים';
  if (label === 'LEGS') return 'רגליים + ישבן';
  return hebrewTargets(workout);
}

function durationRange(minutes) {
  return `${Math.max(30, minutes - 16)}–${Math.max(31, minutes - 1)} דק׳`;
}

function dayStrip() {
  return weekDates().map(({ label, date, selected }) => `
    <div class="training-day ${selected ? 'is-selected' : ''}">
      <span>${label}</span>
      <strong>${String(date.getDate()).padStart(2, '0')}</strong>
      <i aria-hidden="true"></i>
    </div>`).join('');
}

function hero(workout) {
  const date = workoutDate(workout);
  const today = new Date().toDateString() === date.toDateString();
  const front = workout.images?.[0] || '';
  const back = workout.images?.[1] || front;

  return `<section class="training-hero" aria-label="האימון הנבחר">
    <div class="training-hero__copy">
      <div class="training-hero__date"><strong>${today ? 'היום' : 'האימון הבא'}</strong><span>• ${DAY_LABELS[workout.day]}, ${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]}</span></div>
      <h2>${escapeHtml(compactTitle(workout))}</h2>
      <p>${escapeHtml(heroSubtitle(workout))}</p>
      <div class="training-hero__chips">
        <span>${Icon('clock', { size: 13 })}<b>${escapeHtml(durationRange(workout.minutes))}</b></span>
        <span><i class="intensity-bars" aria-hidden="true"><b></b><b></b><b></b></i><b>עצימות גבוהה</b></span>
      </div>
      <button class="training-start" type="button" data-start-workout="${workout.databaseId || ''}">
        <span>התחל אימון</span><i aria-hidden="true">→</i>
      </button>
    </div>
    <div class="training-hero__art" aria-hidden="true">
      <img class="training-hero__back" src="${back}" alt="" loading="eager" decoding="async">
      <img class="training-hero__front" src="${front}" alt="" loading="eager" decoding="async">
    </div>
  </section>`;
}

function summaryTiles(workout) {
  const date = workoutDate(workout);
  return `<section class="training-summary" aria-label="סיכום תוכנית">
    <article><i class="summary-icon summary-icon--ring" aria-hidden="true"></i><div><strong>4/6</strong><span>אימונים השבוע</span></div></article>
    <article><i class="summary-icon summary-icon--target" aria-hidden="true"></i><div><strong>PPL</strong><span>ספליט פעיל</span></div></article>
    <article><i class="summary-icon summary-icon--clock" aria-hidden="true">${Icon('clock', { size: 17 })}</i><div><strong>${escapeHtml(compactTitle(workout))}</strong><span>אימון הבא</span><small>יום ${DAY_LABELS[workout.day]}, ${date.getDate()}</small></div></article>
  </section>`;
}

function representative(label, workouts) {
  if (label === 'PUSH') return workouts.find((item) => item.id === 'push-a');
  if (label === 'PULL') return workouts.find((item) => item.id === 'pull-a');
  if (label === 'LEGS') return workouts.find((item) => item.id === 'legs-b');
  return workouts.find((item) => item.id === 'arms');
}

function programRow(label, status, stateClass, progressText = '', workouts = WORKOUTS) {
  const workout = representative(label, workouts);
  const thumb = workout?.images?.[0] || '';
  return `<button class="training-plan-row ${stateClass}" type="button" data-demo-action>
    <span class="training-plan-row__arrow">‹</span>
    <span class="training-plan-row__copy"><strong>${label}</strong><small>${escapeHtml(hebrewTargets(workout))}</small></span>
    <span class="training-plan-row__progress"><i><b></b><b></b><b></b><b></b><b></b></i><em>${escapeHtml(progressText || status)}</em></span>
    <span class="training-plan-row__state">${status === 'הושלם' ? '✓' : status === 'רגליים חלקית' ? '3/6' : ''}</span>
    <span class="training-plan-row__thumb"><img src="${thumb}" alt="" loading="lazy" decoding="async"></span>
  </button>`;
}

function planList(workouts) {
  return `<section class="training-plan" aria-label="תוכנית האימונים שלך">
    <h3>תוכנית האימונים שלך</h3>
    <div class="training-plan__rows">
      ${programRow('PUSH', 'הושלם', 'is-complete', '', workouts)}
      ${programRow('PULL', 'הושלם', 'is-complete', '', workouts)}
      ${programRow('LEGS', 'רגליים חלקית', 'is-partial', 'רגליים חלקית', workouts)}
      ${programRow('ARMS', 'הבא בתור', 'is-next', 'הבא בתור', workouts)}
    </div>
  </section>`;
}

function quickStats() {
  return `<section class="training-quick" aria-label="סטטיסטיקות מהירות">
    <h3>סטטיסטיקות מהירות</h3>
    <div class="training-quick__grid">
      <article><i class="quick-ring" aria-hidden="true"></i><div><strong>68%</strong><span>השלמת תוכנית</span></div></article>
      <article><i class="quick-wave" aria-hidden="true">⌁</i><div><strong>12,450</strong><span>ק״ג השבוע</span></div></article>
      <article><i class="quick-trophy" aria-hidden="true">◇</i><div><strong>14</strong><span>רצף ימים</span></div></article>
    </div>
  </section>`;
}

export function WorkoutsScreen({ workouts = WORKOUTS } = {}) {
  const workout = selectedWorkout(workouts);

  return `<div class="workouts-concept animate-enter" dir="rtl">
    ${AppPageHeader({
      title: 'אימונים',
      subtitle: 'תכנון. ביצוע. התקדמות.',
      rootClass: 'training-header',
      brandClass: 'training-brand',
      headingClass: 'training-heading',
    })}

    <section class="training-calendar" aria-label="לוח שבועי">
      <span class="training-calendar__icon">${Icon('calendar', { size: 21 })}</span>
      <div class="training-calendar__days">${dayStrip()}</div>
    </section>

    ${hero(workout)}
    ${summaryTiles(workout)}
    ${planList(workouts)}
    ${quickStats()}
  </div>`;
}
