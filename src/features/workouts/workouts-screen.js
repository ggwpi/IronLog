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

function selectedWorkout() {
  const today = new Date().getDay();
  return workoutForDay(today) || nextWorkoutFromDay(today);
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

function compactTitle(workout) { return workout.short.replace(/\s+[AB]$/, ''); }
function hebrewTargets(workout) {
  const map = { Chest: 'חזה', Biceps: 'בייספס', Triceps: 'טרייספס', Shoulders: 'כתפיים', Back: 'גב', 'Rear Delts': 'כתף אחורית', Quads: 'רגליים', Hamstrings: 'המסטרינג', Glutes: 'ישבן', Core: 'בטן', Calves: 'תאומים', Delts: 'כתפיים' };
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
function durationRange(minutes) { return `${Math.max(30, minutes - 16)}–${Math.max(31, minutes - 1)} דק׳`; }
function dayStrip() {
  return weekDates().map(({ label, date, selected }) => `<div class="training-day ${selected ? 'is-selected' : ''}"><span>${label}</span><strong>${String(date.getDate()).padStart(2, '0')}</strong><i aria-hidden="true"></i></div>`).join('');
}
function liveWorkoutFor(displayWorkout, workouts) { return workouts.find((item) => item.id === displayWorkout.id) || null; }

function hero(workout, workouts, activeSession) {
  const date = workoutDate(workout);
  const today = new Date().toDateString() === date.toDateString();
  const front = workout.images?.[0] || '';
  const back = workout.images?.[1] || front;
  const liveWorkout = liveWorkoutFor(workout, workouts);
  const templateId = liveWorkout?.databaseId || '';
  const active = Boolean(activeSession);
  return `<section class="training-hero" aria-label="האימון הנבחר">
    <div class="training-hero__copy">
      <div class="training-hero__date"><strong>${today ? 'היום' : 'האימון הבא'}</strong><span>• ${DAY_LABELS[workout.day]}, ${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]}</span></div>
      <h2>${escapeHtml(compactTitle(workout))}</h2><p>${escapeHtml(heroSubtitle(workout))}</p>
      <div class="training-hero__chips"><span>${Icon('clock', { size: 13 })}<b>${escapeHtml(durationRange(workout.minutes))}</b></span><span><i class="intensity-bars" aria-hidden="true"><b></b><b></b><b></b></i><b>עצימות גבוהה</b></span></div>
      <button class="training-start" type="button" data-start-workout="${templateId}"><span>${active ? 'המשך אימון' : 'התחל אימון'}</span><i aria-hidden="true">→</i></button>
    </div>
    <div class="training-hero__art" aria-hidden="true"><img class="training-hero__back" src="${back}" alt="" loading="eager" decoding="async"><img class="training-hero__front" src="${front}" alt="" loading="eager" decoding="async"></div>
  </section>`;
}

function summaryTiles(workout) {
  const date = workoutDate(workout);
  return `<section class="training-summary" aria-label="סיכום תוכנית"><article><i class="summary-icon summary-icon--ring"></i><div><strong>4/6</strong><span>אימונים השבוע</span></div></article><article><i class="summary-icon summary-icon--target"></i><div><strong>PPL</strong><span>ספליט פעיל</span></div></article><article><i class="summary-icon summary-icon--clock">${Icon('clock', { size: 17 })}</i><div><strong>${escapeHtml(compactTitle(workout))}</strong><span>אימון הבא</span><small>יום ${DAY_LABELS[workout.day]}, ${date.getDate()}</small></div></article></section>`;
}
function representative(label) {
  if (label === 'PUSH') return WORKOUTS.find((item) => item.id === 'push-a');
  if (label === 'PULL') return WORKOUTS.find((item) => item.id === 'pull-a');
  if (label === 'LEGS') return WORKOUTS.find((item) => item.id === 'legs-b');
  return WORKOUTS.find((item) => item.id === 'arms');
}
function programRow(label, status, stateClass, workouts, progressText = '') {
  const workout = representative(label); const liveWorkout = liveWorkoutFor(workout, workouts); const thumb = workout?.images?.[0] || '';
  const action = liveWorkout?.databaseId ? `data-open-workout="${liveWorkout.databaseId}"` : 'data-demo-action';
  return `<button class="training-plan-row ${stateClass}" type="button" ${action}><span class="training-plan-row__arrow">‹</span><span class="training-plan-row__copy"><strong>${label}</strong><small>${escapeHtml(hebrewTargets(workout))}</small></span><span class="training-plan-row__progress"><i><b></b><b></b><b></b><b></b><b></b></i><em>${escapeHtml(progressText || status)}</em></span><span class="training-plan-row__state">${status === 'הושלם' ? '✓' : status === 'רגליים חלקית' ? '3/6' : ''}</span><span class="training-plan-row__thumb"><img src="${thumb}" alt="" loading="lazy"></span></button>`;
}
function planList(workouts) { return `<section class="training-plan" aria-label="תוכנית האימונים שלך"><h3>תוכנית האימונים שלך</h3><div class="training-plan__rows">${programRow('PUSH', 'הושלם', 'is-complete', workouts)}${programRow('PULL', 'הושלם', 'is-complete', workouts)}${programRow('LEGS', 'רגליים חלקית', 'is-partial', workouts, 'רגליים חלקית')}${programRow('ARMS', 'הבא בתור', 'is-next', workouts, 'הבא בתור')}</div></section>`; }
function quickStats() { return `<section class="training-quick"><h3>סטטיסטיקות מהירות</h3><div class="training-quick__grid"><article><i class="quick-ring"></i><div><strong>68%</strong><span>השלמת תוכנית</span></div></article><article><i class="quick-wave">⌁</i><div><strong>12,450</strong><span>ק״ג השבוע</span></div></article><article><i class="quick-trophy">◇</i><div><strong>14</strong><span>רצף ימים</span></div></article></div></section>`; }

function completedSetCount(session) { return session.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0); }
function plannedSetCount(session) { return session.exercises.reduce((sum, exercise) => sum + exercise.plannedSets, 0); }
function completedExerciseCount(session) { return session.exercises.filter((exercise) => exercise.sets.filter((set) => set.completed).length >= exercise.plannedSets).length; }
function currentExercise(session) { return session.exercises.find((exercise) => exercise.sets.filter((set) => set.completed).length < exercise.plannedSets) || session.exercises.at(-1); }
function setMap(exercise) { return new Map(exercise.sets.map((set) => [set.setNumber, set])); }
function targetRepDefault(target) { const found = String(target || '').match(/\d+/); return found ? Number(found[0]) : 8; }
function lastCompletedSet(exercise) { return [...exercise.sets].filter((set) => set.completed).sort((a, b) => b.setNumber - a.setNumber)[0] || null; }

function SetDots(exercise, activeNumber) {
  const map = setMap(exercise);
  return `<div class="live-set-dots" aria-label="סטים">${Array.from({ length: exercise.plannedSets }, (_, index) => {
    const number = index + 1; const done = map.get(number)?.completed;
    return `<span class="${done ? 'is-done' : ''} ${number === activeNumber ? 'is-current' : ''}">${done ? '✓' : number}</span>`;
  }).join('')}</div>`;
}

function ExerciseProgress(session, activeExerciseId) {
  return `<section class="live-exercise-progress"><div class="live-section-label"><span>התקדמות אימון</span><strong>${completedExerciseCount(session)} / ${session.exercises.length}</strong></div><div class="live-exercise-rail">${session.exercises.map((exercise) => {
    const done = exercise.sets.filter((set) => set.completed).length >= exercise.plannedSets;
    const active = exercise.id === activeExerciseId;
    return `<i class="${done ? 'is-done' : ''} ${active ? 'is-active' : ''}">${done ? '✓' : ''}</i>`;
  }).join('')}</div></section>`;
}

function ActiveWorkoutScreen(session) {
  const exercise = currentExercise(session);
  if (!exercise) return '';
  const map = setMap(exercise);
  let activeSetNumber = 1;
  for (let n = 1; n <= exercise.plannedSets; n += 1) { if (!map.get(n)?.completed) { activeSetNumber = n; break; } activeSetNumber = exercise.plannedSets; }
  const previous = lastCompletedSet(exercise);
  const load = previous?.loadKg ?? 0;
  const reps = previous?.reps ?? targetRepDefault(exercise.targetReps);
  const rir = previous?.rir ?? exercise.targetRirMax ?? 2;
  const completed = completedSetCount(session); const planned = plannedSetCount(session); const percent = planned ? Math.round(completed / planned * 100) : 0;
  const nextExercise = session.exercises.find((item) => item.position > exercise.position && item.sets.filter((set) => set.completed).length < item.plannedSets);
  return `<div class="active-workout-page animate-enter" dir="rtl" data-active-session="${session.id}" data-started-at="${escapeHtml(session.startedAt)}">
    <header class="live-workout-header"><button type="button" data-minimize-workout aria-label="חזרה">‹</button><div><strong>${escapeHtml(session.name)}</strong><span><b id="liveWorkoutElapsed">00:00:00</b> · ${completed}/${planned} סטים</span></div><button type="button" class="live-more" aria-label="אפשרויות">•••</button></header>
    <div class="live-total-progress"><i style="--progress:${percent}%"></i></div>

    <section class="live-current-card">
      <div class="live-current-top"><div><span>סט נוכחי</span><strong>${activeSetNumber} / ${exercise.plannedSets}</strong><small>${escapeHtml(exercise.targetReps || 'חזרות לפי התוכנית')} · RIR ${exercise.targetRirMin ?? '—'}–${exercise.targetRirMax ?? '—'}</small></div><div class="live-ring" style="--ring:${Math.round(((activeSetNumber - 1) / exercise.plannedSets) * 100)}%"><b>${activeSetNumber}</b><span>סט</span></div></div>
      <h1>${escapeHtml(exercise.name)}</h1>
      ${SetDots(exercise, activeSetNumber)}
    </section>

    <form class="live-entry-form" data-set-form data-session-exercise-id="${exercise.id}" data-set-number="${activeSetNumber}" data-rest-seconds="${exercise.restMaxSeconds}">
      <div class="live-entry-card"><label>משקל <small>(ק״ג)</small></label><div class="live-stepper"><button type="button" data-step="-2.5" data-step-target="liveWeight">−</button><input id="liveWeight" name="loadKg" type="number" min="0" step="0.25" inputmode="decimal" value="${load}"><button type="button" data-step="2.5" data-step-target="liveWeight">+</button></div></div>
      <div class="live-entry-card"><label>חזרות שבוצעו</label><div class="live-stepper"><button type="button" data-step="-1" data-step-target="liveReps">−</button><input id="liveReps" name="reps" type="number" min="0" step="1" inputmode="numeric" value="${reps}" required><button type="button" data-step="1" data-step-target="liveReps">+</button></div></div>
      <div class="live-rir-row"><span>RIR</span><button type="button" data-step="-0.5" data-step-target="liveRir">−</button><input id="liveRir" name="rir" type="number" min="0" max="10" step="0.5" value="${rir}"><button type="button" data-step="0.5" data-step-target="liveRir">+</button><small>כמה חזרות נשארו במאגר</small></div>
      <button class="live-save-set" type="submit"><span>שמור סט</span><b>✓</b></button>
    </form>

    <section class="live-rest-card" id="restTimer" hidden><div><span>מנוחה</span><strong id="restTimerValue">00:00</strong><small>עד הסט הבא</small></div><div class="live-rest-ring"><i></i><button type="button" id="skipRestTimer">Ⅱ</button></div></section>

    ${ExerciseProgress(session, exercise.id)}
    <section class="live-next-exercise"><span>התרגיל הבא</span><strong>${escapeHtml(nextExercise?.name || 'סיום האימון')}</strong></section>
    <div class="live-workout-actions"><button type="button" data-cancel-session="${session.id}">ביטול אימון</button><button type="button" data-complete-session="${session.id}">סיום אימון</button></div>
  </div>`;
}

// Kept for app.js compatibility.
export function WorkoutBuilderExerciseRow() { return ''; }

export function WorkoutsScreen({ workouts = WORKOUTS, workoutData = {}, ui = null } = {}) {
  if (workoutData.activeSession && ui?.type !== 'overview') return ActiveWorkoutScreen(workoutData.activeSession);
  const workout = selectedWorkout();
  return `<div class="workouts-concept animate-enter" dir="rtl">
    ${AppPageHeader({ title: 'אימונים', subtitle: 'תכנון. ביצוע. התקדמות.', rootClass: 'training-header', brandClass: 'training-brand', headingClass: 'training-heading' })}
    <section class="training-calendar" aria-label="לוח שבועי"><span class="training-calendar__icon">${Icon('calendar', { size: 21 })}</span><div class="training-calendar__days">${dayStrip()}</div></section>
    ${hero(workout, workouts, workoutData.activeSession || null)}${summaryTiles(workout)}${planList(workouts)}${quickStats()}
  </div>`;
}
