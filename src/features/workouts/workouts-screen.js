import { escapeHtml } from '../../core/escape-html.js';
import { Icon } from '../../components/icons.js';
import { AppPageHeader } from '../../components/app-page-header.js';
import { WORKOUTS, workoutForDay, nextWorkoutFromDay } from './workout-catalog.js';

const DAY_LABELS = Object.freeze(['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']);
const DAY_NAMES = Object.freeze(['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']);
const MONTHS = Object.freeze(['בינו׳', 'בפבר׳', 'במרץ', 'באפר׳', 'במאי', 'ביוני', 'ביולי', 'באוג׳', 'בספט׳', 'באוק׳', 'בנוב׳', 'בדצמ׳']);
const TRACKING_LABELS = Object.freeze({
  weight_reps: 'משקל וחזרות', reps: 'חזרות', duration: 'זמן', distance: 'מרחק',
});
const EQUIPMENT_LABELS = Object.freeze({
  barbell: 'מוט', dumbbell: 'דאמבלים', cable: 'כבל', machine: 'מכונה',
  smith_machine: 'סמית׳', bodyweight: 'משקל גוף', kettlebell: 'קטלבל', band: 'גומייה',
});

function selectedWorkout(workouts) {
  const today = new Date().getDay();
  return workoutForDay(today, workouts) || nextWorkoutFromDay(today, workouts) || workouts[0] || null;
}

function workoutDate(workout) {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setHours(12, 0, 0, 0);
  sunday.setDate(today.getDate() - today.getDay());
  const day = workout?.day == null ? today.getDay() : workout.day;
  const date = new Date(sunday);
  date.setDate(sunday.getDate() + day);
  if (day < today.getDay()) date.setDate(date.getDate() + 7);
  return date;
}

function compactTitle(workout) {
  return String(workout?.short || workout?.title || 'WORKOUT').replace(/\s+[AB]$/, '');
}

function hebrewTargets(workout) {
  const map = {
    Chest: 'חזה', Biceps: 'יד קדמית', Triceps: 'יד אחורית', Shoulders: 'כתפיים',
    Back: 'גב', 'Rear Delts': 'כתף אחורית', Quads: 'רגליים', Hamstrings: 'המסטרינג',
    Glutes: 'ישבן', Core: 'בטן', Calves: 'תאומים', Delts: 'כתפיים',
    'Upper Chest': 'חזה עליון', 'Upper Back': 'גב עליון', 'Latissimus Dorsi': 'רחב גבי',
    Quadriceps: 'ארבע ראשי', Forearms: 'אמות', 'Front Delts': 'כתף קדמית',
    'Side Delts': 'כתף צדית', 'Rear Delts': 'כתף אחורית',
  };
  const targets = workout?.targets || [];
  return targets.length ? targets.map((target) => map[target] || target).join(' · ') : 'אימון מותאם אישית';
}

function durationRange(minutes) {
  const value = Number(minutes || 45);
  return `${Math.max(15, value - 8)}–${value + 8} דק׳`;
}

function dayStrip(workouts, sessions) {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setHours(0, 0, 0, 0);
  sunday.setDate(now.getDate() - now.getDay());
  const completedDays = new Set((sessions || [])
    .filter((session) => session.status === 'completed' && new Date(session.completed_at || session.started_at) >= sunday)
    .map((session) => new Date(session.completed_at || session.started_at).getDay()));
  const plannedDays = new Set(workouts.map((workout) => workout.day).filter((day) => day != null));

  return DAY_LABELS.map((label, day) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + day);
    const classes = [day === now.getDay() ? 'is-selected' : '', completedDays.has(day) ? 'is-complete' : '', plannedDays.has(day) ? 'is-planned' : ''].filter(Boolean).join(' ');
    return `<div class="training-day ${classes}"><span>${label}</span><strong>${String(date.getDate()).padStart(2, '0')}</strong><i aria-hidden="true"></i></div>`;
  }).join('');
}

function hero(workout, activeSession) {
  if (!workout) return '';
  const date = workoutDate(workout);
  const today = new Date().toDateString() === date.toDateString();
  const front = workout.images?.[0] || '';
  const back = workout.images?.[1] || front;
  const active = Boolean(activeSession);

  return `<section class="training-hero ${front ? '' : 'training-hero--custom'}" aria-label="האימון הנבחר">
    <div class="training-hero__copy">
      <div class="training-hero__date"><strong>${active ? 'אימון פעיל' : today ? 'היום' : 'האימון הבא'}</strong><span>• ${workout.day == null ? 'ללא יום קבוע' : `יום ${DAY_LABELS[workout.day]}, ${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]}`}</span></div>
      <h2>${escapeHtml(active ? activeSession.name : compactTitle(workout))}</h2>
      <p>${escapeHtml(active ? 'כל הסטים נשמרים בענן בזמן אמת' : hebrewTargets(workout))}</p>
      <div class="training-hero__chips">
        <span>${Icon('clock', { size: 13 })}<b>${escapeHtml(durationRange(workout.minutes))}</b></span>
        <span><b>${workout.exercises} תרגילים · ${workout.sets} סטים</b></span>
      </div>
      <button class="training-start" type="button" data-start-workout="${workout.databaseId || ''}">
        <span>${active ? 'המשך אימון' : 'התחל אימון'}</span><i aria-hidden="true">→</i>
      </button>
    </div>
    <div class="training-hero__art" aria-hidden="true">
      ${front ? `<img class="training-hero__back" src="${back}" alt="" loading="eager" decoding="async"><img class="training-hero__front" src="${front}" alt="" loading="eager" decoding="async">` : '<span class="custom-workout-bolt">ϟ</span>'}
    </div>
  </section>`;
}

function summaryTiles(summary, activeSession) {
  const planned = Number(summary?.plannedWorkouts || 0);
  const complete = Number(summary?.completedThisWeek || 0);
  const percent = planned ? Math.min(100, Math.round(complete / planned * 100)) : 0;
  return `<section class="training-summary" aria-label="סיכום תוכנית">
    <article><i class="summary-icon summary-icon--ring" aria-hidden="true"></i><div><strong>${complete}/${planned}</strong><span>אימונים השבוע</span></div></article>
    <article><i class="summary-icon summary-icon--target" aria-hidden="true"></i><div><strong>${percent}%</strong><span>השלמה שבועית</span></div></article>
    <article><i class="summary-icon summary-icon--clock" aria-hidden="true">${Icon('clock', { size: 17 })}</i><div><strong>${activeSession ? 'פעיל' : Number(summary?.customWorkouts || 0)}</strong><span>${activeSession ? 'אימון בענן' : 'אימונים אישיים'}</span></div></article>
  </section>`;
}

function workoutRows(workouts, sessions) {
  const recentCompleted = new Set((sessions || []).filter((session) => session.status === 'completed').map((session) => Number(session.template_id)));
  return workouts.map((workout) => `<article class="db-workout-row ${workout.isCustom ? 'is-custom' : ''}">
    <button class="db-workout-row__main" type="button" data-open-workout="${workout.databaseId}">
      <span class="db-workout-row__day">${workout.day == null ? '•' : DAY_LABELS[workout.day]}</span>
      <span class="db-workout-row__copy"><strong>${escapeHtml(workout.short)}</strong><small>${escapeHtml(workout.title)} · ${workout.exercises} תרגילים · ${workout.sets} סטים</small></span>
      <span class="db-workout-row__badges">${workout.isCustom ? '<em>שלי</em>' : '<em>IronLog</em>'}${recentCompleted.has(workout.databaseId) ? '<b>✓</b>' : ''}</span>
      <span class="db-workout-row__arrow">‹</span>
    </button>
    <div class="db-workout-row__actions">
      <button type="button" data-start-workout="${workout.databaseId}">התחל</button>
      ${workout.isCustom ? `<button type="button" data-edit-workout="${workout.databaseId}">עריכה</button><button class="is-danger" type="button" data-archive-workout="${workout.databaseId}">ארכיון</button>` : `<button type="button" data-copy-workout="${workout.databaseId}">שכפל</button>`}
    </div>
  </article>`).join('');
}

function customExerciseRows(exerciseLibrary) {
  const custom = exerciseLibrary.filter((exercise) => exercise.isCustom);
  if (!custom.length) return '<p class="empty-custom-copy">עדיין לא יצרת תרגילים אישיים.</p>';
  return `<div class="custom-exercise-list">${custom.map((exercise) => `<article>
    <div><strong>${escapeHtml(exercise.displayName)}</strong><small>${escapeHtml(TRACKING_LABELS[exercise.trackingType] || exercise.trackingType)}${exercise.equipment ? ` · ${escapeHtml(EQUIPMENT_LABELS[exercise.equipment] || exercise.equipment)}` : ''}</small></div>
    <button type="button" data-edit-exercise="${exercise.id}">עריכה</button>
    <button class="is-danger" type="button" data-archive-exercise="${exercise.id}">ארכיון</button>
  </article>`).join('')}</div>`;
}

function quickStats(summary) {
  return `<section class="training-quick" aria-label="סטטיסטיקות מהירות">
    <h3>סטטיסטיקות אמיתיות</h3>
    <div class="training-quick__grid">
      <article><i class="quick-ring" aria-hidden="true"></i><div><strong>${Number(summary?.completedThisWeek || 0)}</strong><span>אימונים הושלמו</span></div></article>
      <article><i class="quick-wave" aria-hidden="true">⌁</i><div><strong>${Math.round(Number(summary?.weeklyLoadKg || 0)).toLocaleString('he-IL')}</strong><span>ק״ג השבוע</span></div></article>
      <article><i class="quick-trophy" aria-hidden="true">◇</i><div><strong>${Number(summary?.customWorkouts || 0)}</strong><span>אימונים אישיים</span></div></article>
    </div>
  </section>`;
}

function modalShell(title, eyebrow, body, { wide = false, live = false } = {}) {
  return `<div class="workout-modal-backdrop" data-close-workout-ui></div>
    <section class="workout-modal ${wide ? 'workout-modal--wide' : ''} ${live ? 'workout-modal--live' : ''}" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <header><div><small>${escapeHtml(eyebrow)}</small><h2>${escapeHtml(title)}</h2></div><button type="button" data-close-workout-ui aria-label="סגירה">×</button></header>
      ${body}
    </section>`;
}

function workoutDetails(workout, activeSession) {
  if (!workout) return '';
  const exercises = workout.templateExercises.map((item, index) => `<article class="workout-detail-exercise">
    <span>${index + 1}</span><div><strong>${escapeHtml(item.exercise.displayName)}</strong><small>${item.plannedSets} סטים · ${escapeHtml(item.targetReps)} חזרות · מנוחה ${item.restMinSeconds}–${item.restMaxSeconds} שנ׳</small></div>
  </article>`).join('');
  const body = `<div class="workout-modal__body">
      <div class="workout-detail-summary"><span>${workout.exercises} תרגילים</span><span>${workout.sets} סטים</span><span>${durationRange(workout.minutes)}</span></div>
      ${workout.description ? `<p class="workout-description">${escapeHtml(workout.description)}</p>` : ''}
      <div class="workout-detail-list">${exercises}</div>
    </div>
    <footer class="workout-modal__footer">
      <button class="button-secondary" type="button" data-${workout.isCustom ? 'edit' : 'copy'}-workout="${workout.databaseId}">${workout.isCustom ? 'עריכת האימון' : 'יצירת עותק אישי'}</button>
      <button class="button-primary" type="button" data-start-workout="${workout.databaseId}">${activeSession ? 'המשך אימון פעיל' : 'התחל אימון'}</button>
    </footer>`;
  return modalShell(workout.title, workout.isCustom ? 'האימון האישי שלך' : 'תוכנית IronLog', body, { wide: true });
}

function exerciseOption(exercise) {
  return `<option value="${exercise.id}">${escapeHtml(exercise.displayName)}${exercise.equipment ? ` · ${escapeHtml(EQUIPMENT_LABELS[exercise.equipment] || exercise.equipment)}` : ''}</option>`;
}

export function WorkoutBuilderExerciseRow(item, index = 0) {
  const exercise = item.exercise || item;
  const exerciseId = Number(item.exerciseId || exercise.id);
  return `<article class="builder-exercise-row" data-builder-exercise data-exercise-id="${exerciseId}">
    <div class="builder-exercise-row__head"><span class="builder-position">${index + 1}</span><div><strong>${escapeHtml(exercise.displayName)}</strong><small>${escapeHtml(TRACKING_LABELS[exercise.trackingType] || exercise.trackingType || '')}</small></div><div class="builder-order"><button type="button" data-move-exercise="up" aria-label="הזזה למעלה">↑</button><button type="button" data-move-exercise="down" aria-label="הזזה למטה">↓</button><button type="button" data-remove-builder-exercise aria-label="הסרה">×</button></div></div>
    <div class="builder-exercise-row__fields">
      <label><span>סטים</span><input name="plannedSets" type="number" min="1" max="20" inputmode="numeric" value="${Number(item.plannedSets || 3)}" required></label>
      <label><span>חזרות</span><input name="targetReps" type="text" maxlength="40" value="${escapeHtml(item.targetReps || '8–12')}" required></label>
      <label><span>RIR</span><input name="targetRir" type="number" min="0" max="10" step="0.5" inputmode="decimal" value="${item.targetRirMin == null ? 2 : Number(item.targetRirMin)}"></label>
      <label><span>מנוחה</span><input name="restSeconds" type="number" min="15" max="900" step="15" inputmode="numeric" value="${Number(item.restMaxSeconds || item.restMinSeconds || 90)}"></label>
    </div>
  </article>`;
}

function workoutBuilder(workout, exerciseLibrary, copyMode = false) {
  const editing = Boolean(workout?.isCustom && !copyMode);
  const rows = (workout?.templateExercises || []).map((item, index) => WorkoutBuilderExerciseRow(item, index)).join('');
  const body = `<form id="workoutBuilderForm" class="workout-modal__body builder-form" data-template-id="${editing ? workout.databaseId : ''}">
      <div class="form-grid form-grid--workout">
        <label><span>שם האימון</span><input name="name" minlength="2" maxlength="120" value="${escapeHtml(copyMode ? `${workout?.title || ''} אישי` : workout?.title || '')}" required></label>
        <label><span>קוד קצר</span><input name="code" maxlength="20" value="${escapeHtml(copyMode ? '' : workout?.short || '')}" placeholder="למשל PUSH C"></label>
        <label><span>יום בשבוע</span><select name="weekday"><option value="">ללא יום קבוע</option>${DAY_NAMES.map((name, day) => `<option value="${day}" ${workout?.day === day ? 'selected' : ''}>${name}</option>`).join('')}</select></label>
        <label class="form-grid__wide"><span>תיאור</span><textarea name="description" maxlength="500" rows="2">${escapeHtml(workout?.description || '')}</textarea></label>
      </div>
      <section class="builder-exercises"><div class="builder-exercises__title"><div><strong>תרגילים</strong><small>הסדר נשמר בדיוק כפי שמופיע כאן</small></div><span id="builderExerciseCount">${workout?.templateExercises?.length || 0}</span></div>
        <div id="builderExerciseRows">${rows}</div>
        <div class="builder-add"><select id="builderExerciseSelect">${exerciseLibrary.map(exerciseOption).join('')}</select><button type="button" id="addBuilderExercise">+ הוספת תרגיל</button></div>
      </section>
      <p class="form-error" id="workoutBuilderError" hidden></p>
    </form>
    <footer class="workout-modal__footer"><button class="button-secondary" type="button" data-close-workout-ui>ביטול</button><button class="button-primary" type="submit" form="workoutBuilderForm">שמירת אימון</button></footer>`;
  return modalShell(editing ? 'עריכת אימון' : copyMode ? 'עותק אישי' : 'אימון חדש', 'בונה האימונים', body, { wide: true });
}

function exerciseEditor(exercise, muscles) {
  const primaryMuscle = exercise?.muscles?.find((muscle) => muscle.role === 'primary');
  const body = `<form id="exerciseEditorForm" class="workout-modal__body builder-form" data-exercise-id="${exercise?.id || ''}">
      <div class="form-grid">
        <label><span>שם באנגלית</span><input name="name" minlength="2" maxlength="120" value="${escapeHtml(exercise?.name || '')}" required></label>
        <label><span>שם בעברית</span><input name="nameHe" maxlength="120" value="${escapeHtml(exercise?.nameHe || '')}"></label>
        <label><span>סוג מעקב</span><select name="trackingType">${Object.entries(TRACKING_LABELS).map(([value, label]) => `<option value="${value}" ${exercise?.trackingType === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
        <label><span>ציוד</span><select name="equipment"><option value="">ללא</option>${Object.entries(EQUIPMENT_LABELS).map(([value, label]) => `<option value="${value}" ${exercise?.equipment === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
        <label><span>שריר עיקרי</span><select name="muscleId"><option value="">ללא</option>${muscles.map((muscle) => `<option value="${muscle.id}" ${Number(primaryMuscle?.id) === muscle.id ? 'selected' : ''}>${escapeHtml(muscle.name_he || muscle.name)}</option>`).join('')}</select></label>
        <label class="form-grid__wide"><span>הנחיות</span><textarea name="instructions" maxlength="1000" rows="3">${escapeHtml(exercise?.instructions || '')}</textarea></label>
      </div><p class="form-error" id="exerciseEditorError" hidden></p>
    </form>
    <footer class="workout-modal__footer"><button class="button-secondary" type="button" data-close-workout-ui>ביטול</button><button class="button-primary" type="submit" form="exerciseEditorForm">שמירת תרגיל</button></footer>`;
  return modalShell(exercise ? 'עריכת תרגיל' : 'תרגיל חדש', 'ספריית התרגילים', body);
}

function previousHint(exerciseId, performanceHistory) {
  const previous = performanceHistory.find((point) => Number(point.exercise_id) === Number(exerciseId));
  if (!previous) return 'אין ביצוע קודם';
  const parts = [];
  if (previous.load_kg != null) parts.push(`${Number(previous.load_kg)} ק״ג`);
  if (previous.reps != null) parts.push(`${Number(previous.reps)} חזרות`);
  if (previous.rir != null) parts.push(`RIR ${Number(previous.rir)}`);
  return `קודם: ${parts.join(' · ')}`;
}

function setInputs(sessionExercise, setNumber, set) {
  const tracking = sessionExercise.exercise?.trackingType || 'weight_reps';
  const common = `<label><span>RIR</span><input name="rir" type="number" min="0" max="10" step="0.5" inputmode="decimal" value="${set?.rir ?? ''}"></label>`;
  if (tracking === 'duration') return `<label><span>שניות</span><input name="durationSeconds" type="number" min="0" inputmode="numeric" value="${set?.durationSeconds ?? ''}" required></label>${common}`;
  if (tracking === 'distance') return `<label><span>מטרים</span><input name="distanceMeters" type="number" min="0" step="0.1" inputmode="decimal" value="${set?.distanceMeters ?? ''}" required></label><label><span>שניות</span><input name="durationSeconds" type="number" min="0" inputmode="numeric" value="${set?.durationSeconds ?? ''}"></label>`;
  if (tracking === 'reps') return `<label><span>חזרות</span><input name="reps" type="number" min="0" inputmode="numeric" value="${set?.reps ?? ''}" required></label>${common}`;
  return `<label><span>ק״ג</span><input name="loadKg" type="number" min="0" step="0.25" inputmode="decimal" value="${set?.loadKg ?? ''}"></label><label><span>חזרות</span><input name="reps" type="number" min="0" inputmode="numeric" value="${set?.reps ?? ''}" required></label>${common}`;
}

function activeWorkout(session, performanceHistory) {
  if (!session) return '';
  const completedSets = session.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0);
  const plannedSets = session.exercises.reduce((sum, exercise) => sum + exercise.plannedSets, 0);
  const exercises = session.exercises.map((exercise, exerciseIndex) => {
    const setByNumber = new Map(exercise.sets.map((set) => [set.setNumber, set]));
    const rows = Array.from({ length: exercise.plannedSets }, (_, index) => {
      const setNumber = index + 1;
      const set = setByNumber.get(setNumber);
      return `<form class="live-set-row ${set?.completed ? 'is-complete' : ''}" data-set-form data-session-exercise-id="${exercise.id}" data-set-number="${setNumber}" data-rest-seconds="${exercise.restMaxSeconds}">
        <strong>${setNumber}</strong><div class="live-set-fields">${setInputs(exercise, setNumber, set)}</div><button type="submit">${set?.completed ? '✓' : 'שמור'}</button>
      </form>`;
    }).join('');
    return `<article class="live-exercise-card ${exerciseIndex === 0 ? 'is-open' : ''}">
      <button class="live-exercise-card__head" type="button" data-toggle-live-exercise><span>${exerciseIndex + 1}</span><div><strong>${escapeHtml(exercise.name)}</strong><small>${escapeHtml(exercise.targetReps)} · מנוחה ${exercise.restMinSeconds}–${exercise.restMaxSeconds} שנ׳</small><em>${escapeHtml(previousHint(exercise.exerciseId, performanceHistory))}</em></div><i>⌄</i></button>
      <div class="live-exercise-card__sets">${rows}</div>
    </article>`;
  }).join('');

  const body = `<div class="live-workout-summary"><div><span>התקדמות</span><strong>${completedSets}/${plannedSets} סטים</strong></div><progress max="${plannedSets || 1}" value="${completedSets}"></progress><div id="restTimer" class="rest-timer" hidden><span>מנוחה</span><strong id="restTimerValue">00:00</strong><button type="button" id="skipRestTimer">דלג</button></div></div>
    <div class="workout-modal__body live-workout-body">${exercises}</div>
    <footer class="workout-modal__footer live-workout-actions"><button class="button-secondary is-danger" type="button" data-cancel-session="${session.id}">ביטול אימון</button><button class="button-primary" type="button" data-complete-session="${session.id}">סיום אימון</button></footer>`;
  return modalShell(session.name, 'אימון פעיל · נשמר בענן', body, { wide: true, live: true });
}

function overlay(ui, workouts, workoutData) {
  if (!ui?.type) return '';
  const workout = workouts.find((item) => item.databaseId === Number(ui.templateId));
  if (ui.type === 'details') return workoutDetails(workout, workoutData.activeSession);
  if (ui.type === 'builder') return workoutBuilder(workout, workoutData.exerciseLibrary, Boolean(ui.copyMode));
  if (ui.type === 'exercise') {
    const exercise = workoutData.exerciseLibrary.find((item) => item.id === Number(ui.exerciseId));
    return exerciseEditor(exercise, workoutData.muscles);
  }
  if (ui.type === 'session') return activeWorkout(workoutData.activeSession, workoutData.performanceHistory || []);
  return '';
}

export function WorkoutsScreen({ workouts = WORKOUTS, workoutData = {}, ui = null } = {}) {
  const resolvedData = {
    exerciseLibrary: workoutData.exerciseLibrary || [], muscles: workoutData.muscles || [],
    sessions: workoutData.sessions || [], activeSession: workoutData.activeSession || null,
    performanceHistory: workoutData.performanceHistory || [], summary: workoutData.summary || {},
  };
  const workout = resolvedData.activeSession
    ? workouts.find((candidate) => candidate.databaseId === resolvedData.activeSession.templateId) || selectedWorkout(workouts)
    : selectedWorkout(workouts);

  return `<div class="workouts-concept animate-enter" dir="rtl">
    ${AppPageHeader({ title: 'אימונים', subtitle: 'תכנון. ביצוע. התקדמות.', rootClass: 'training-header', brandClass: 'training-brand', headingClass: 'training-heading' })}
    <section class="training-calendar" aria-label="לוח שבועי"><span class="training-calendar__icon">${Icon('calendar', { size: 21 })}</span><div class="training-calendar__days">${dayStrip(workouts, resolvedData.sessions)}</div></section>
    ${hero(workout, resolvedData.activeSession)}
    ${summaryTiles(resolvedData.summary, resolvedData.activeSession)}
    <section class="workout-library" aria-label="תוכנית האימונים שלך">
      <div class="workout-section-title"><div><h3>תוכנית האימונים שלך</h3><p>כל שינוי נשמר בחשבון שלך בלבד</p></div><div><button type="button" data-new-exercise>+ תרגיל</button><button class="is-primary" type="button" data-new-workout>+ אימון</button></div></div>
      <div class="db-workout-list">${workoutRows(workouts, resolvedData.sessions)}</div>
    </section>
    <section class="custom-exercises" aria-label="תרגילים אישיים"><div class="workout-section-title"><div><h3>התרגילים האישיים שלך</h3><p>נוספים אוטומטית לבונה האימונים</p></div></div>${customExerciseRows(resolvedData.exerciseLibrary)}</section>
    ${quickStats(resolvedData.summary)}
    ${overlay(ui, workouts, resolvedData)}
  </div>`;
}
