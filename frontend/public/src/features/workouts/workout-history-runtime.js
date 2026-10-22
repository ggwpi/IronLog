import { AppPageHeader } from '../../components/app-page-header.js';
import { escapeHtml } from '../../core/escape-html.js';
import {
  deleteHistorySession,
  deleteHistorySet,
  loadWorkoutHistory,
  updateHistorySession,
  updateHistorySet,
} from './workout-history-repository.js';

const STYLE_ID = 'ironlog-workout-history-style';
let page = null;
let sessions = [];
let selectedId = null;
let filter = 'all';
let loading = false;
let errorMessage = '';
let ownsHistoryEntry = false;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const link = document.createElement('link');
  link.id = STYLE_ID;
  link.rel = 'stylesheet';
  link.href = '/src/features/workouts/workout-history.css?v=1';
  document.head.appendChild(link);
}

function calendarIcon() {
  return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="5.5" width="17" height="15" rx="3"/><path d="M7 3v5M17 3v5M3.5 10h17"/></svg>';
}

function backIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 4.5 16 12l-7.5 7.5"/></svg>';
}

function chevronIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
}

function injectEntry() {
  const workouts = document.querySelector('.workouts-concept');
  if (!workouts || workouts.querySelector('[data-open-workout-history]')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'workout-history-entry';
  button.dataset.openWorkoutHistory = 'true';
  button.innerHTML = `<span class="workout-history-entry__icon">${calendarIcon()}</span><span class="workout-history-entry__copy"><strong>היסטוריית אימונים</strong><span>צפייה בכל האימונים, עריכת סטים ומחיקת נתונים</span></span><span class="workout-history-entry__arrow">‹</span>`;
  const summary = workouts.querySelector('.training-summary');
  if (summary) summary.insertAdjacentElement('afterend', button);
  else workouts.querySelector('.training-calendar')?.insertAdjacentElement('afterend', button);
}

function dateValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

function monthLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'ללא תאריך';
  return new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(date);
}

function monthKey(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'unknown' : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function toLocalInput(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 16);
}

function durationMinutes(session) {
  const start = new Date(session.startedAt).getTime();
  const end = new Date(session.completedAt || session.startedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;
  return Math.max(0, Math.round((end - start) / 60000));
}

function durationLabel(session) {
  const minutes = durationMinutes(session);
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} דק׳`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}:${String(rest).padStart(2, '0')} ש׳` : `${hours} ש׳`;
}

function formatVolume(value) {
  const number = Math.round(Number(value) || 0);
  return number ? `${number.toLocaleString('he-IL')} ק״ג` : '—';
}

function statusLabel(status) {
  return status === 'completed' ? 'הושלם' : status === 'cancelled' ? 'בוטל' : String(status || 'אימון');
}

function visibleExercises(session) {
  return session.exercises.filter((exercise) => !exercise.isSkipped && (exercise.sets.length || exercise.plannedSets));
}

function filteredSessions() {
  return sessions.filter((session) => filter === 'all' || session.status === filter);
}

function sessionRow(session) {
  const exercises = visibleExercises(session);
  const names = exercises.map((exercise) => exercise.name).filter(Boolean);
  const preview = names.length ? names.slice(0, 4).join(' · ') + (names.length > 4 ? ` · +${names.length - 4}` : '') : 'אין תרגילים עם נתונים';
  const cancelled = session.status === 'cancelled';
  return `<button type="button" class="history-session-row" data-history-session="${session.id}">
    <span class="history-session-row__main">
      <span class="history-session-row__top"><strong>${escapeHtml(session.name)}</strong><em class="history-status ${cancelled ? 'is-cancelled' : ''}">${escapeHtml(statusLabel(session.status))}</em></span>
      <span class="history-session-row__date">${escapeHtml(dateValue(session.completedAt || session.startedAt))}</span>
      <span class="history-session-row__exercises">${escapeHtml(preview)}</span>
      <span class="history-session-row__meta"><span>${exercises.length} תרגילים</span><i></i><span>${session.completedSets} סטים</span><i></i><span>${escapeHtml(formatVolume(session.volumeKg))}</span></span>
    </span>
    <span class="history-session-row__side"><strong>${escapeHtml(durationLabel(session))}</strong>${chevronIcon()}</span>
  </button>`;
}

function listMarkup() {
  if (loading) return '<div class="history-loading" aria-label="טוען היסטוריה"><i></i><i></i><i></i><i></i></div>';
  if (errorMessage) return `<div class="history-error">${escapeHtml(errorMessage)}<button type="button" data-history-retry>נסה שוב</button></div>`;
  const visible = filteredSessions();
  if (!visible.length) return '<div class="history-empty"><strong>אין אימונים להצגה</strong><span>כשתסיים אימון הוא יופיע כאן ותוכל לערוך אותו בכל זמן.</span></div>';

  const groups = [];
  visible.forEach((session) => {
    const key = monthKey(session.completedAt || session.startedAt);
    let group = groups.find((item) => item.key === key);
    if (!group) {
      group = { key, label: monthLabel(session.completedAt || session.startedAt), items: [] };
      groups.push(group);
    }
    group.items.push(session);
  });
  return groups.map((group) => `<section class="history-month"><h2 class="history-month__title">${escapeHtml(group.label)}</h2><div class="history-session-list">${group.items.map(sessionRow).join('')}</div></section>`).join('');
}

function listView() {
  const visible = filteredSessions();
  return `<div class="history-toolbar"><div class="history-segmented" role="group" aria-label="סינון היסטוריה">
    <button type="button" data-history-filter="all" class="${filter === 'all' ? 'is-active' : ''}">הכל</button>
    <button type="button" data-history-filter="completed" class="${filter === 'completed' ? 'is-active' : ''}">הושלמו</button>
    <button type="button" data-history-filter="cancelled" class="${filter === 'cancelled' ? 'is-active' : ''}">בוטלו</button>
  </div><span class="history-count">${loading ? 'טוען…' : `${visible.length} אימונים`}</span></div>${listMarkup()}`;
}

function setRow(exercise, set) {
  return `<form class="history-set-row" data-history-set-form data-set-id="${set.id}">
    <span class="history-set-number">${set.setNumber}</span>
    <div class="history-set-field"><label>ק״ג</label><input name="loadKg" inputmode="decimal" type="number" min="0" step="0.25" value="${set.loadKg ?? ''}" aria-label="משקל בסט ${set.setNumber}"></div>
    <div class="history-set-field"><label>חזרות</label><input name="reps" inputmode="numeric" type="number" min="0" step="1" value="${set.reps ?? ''}" aria-label="חזרות בסט ${set.setNumber}"></div>
    <div class="history-set-field"><label>RIR</label><input name="rir" inputmode="decimal" type="number" min="0" max="10" step="0.5" value="${set.rir ?? ''}" aria-label="RIR בסט ${set.setNumber}"></div>
    <div class="history-set-actions"><button class="history-set-save" type="submit" aria-label="שמור סט">✓</button><button class="history-set-delete" type="button" data-delete-history-set="${set.id}" data-set-label="${escapeHtml(exercise.name)} · סט ${set.setNumber}" aria-label="מחק סט">×</button></div>
  </form>`;
}

function detailView(session) {
  const exercises = visibleExercises(session);
  const cancelled = session.status === 'cancelled';
  return `<button class="history-detail-back" type="button" data-history-back>${backIcon()}<span>כל האימונים</span></button>
    <section class="history-detail-hero">
      <div class="history-detail-hero__status ${cancelled ? 'is-cancelled' : ''}"><i></i><span>${escapeHtml(statusLabel(session.status))} · ${escapeHtml(dateValue(session.completedAt || session.startedAt))}</span></div>
      <h2>${escapeHtml(session.name)}</h2><p>${exercises.map((exercise) => escapeHtml(exercise.name)).slice(0, 4).join(' · ')}</p>
      <div class="history-detail-stats"><div><strong>${exercises.length}</strong><span>תרגילים</span></div><div><strong>${session.completedSets}</strong><span>סטים</span></div><div><strong>${escapeHtml(formatVolume(session.volumeKg))}</strong><span>נפח</span></div></div>
    </section>
    <form class="history-session-editor" data-history-session-form data-session-id="${session.id}">
      <h3>פרטי האימון</h3><div class="history-session-editor__grid">
        <label class="history-field"><span>תאריך ושעת התחלה</span><input type="datetime-local" name="startedAt" value="${escapeHtml(toLocalInput(session.startedAt))}"></label>
        <label class="history-field"><span>הערה</span><textarea name="notes" placeholder="הערה על האימון…">${escapeHtml(session.notes)}</textarea></label>
      </div><button class="history-save-session" type="submit">שמור פרטי אימון</button><div class="history-inline-status" data-history-session-status></div>
    </form>
    <section class="history-exercises"><h3 class="history-exercises-title">תרגילים וסטים</h3>
      ${exercises.map((exercise, index) => `<article class="history-exercise"><div class="history-exercise__head"><div><strong>${escapeHtml(exercise.name)}</strong><span>${exercise.sets.length} סטים שנשמרו</span></div><span class="history-exercise__position">${index + 1}</span></div><div class="history-set-list">${exercise.sets.length ? exercise.sets.map((set) => setRow(exercise, set)).join('') : '<div class="history-set-empty">לא נשמרו סטים לתרגיל הזה.</div>'}</div></article>`).join('')}
    </section>
    <section class="history-danger-zone"><strong>מחיקת האימון</strong><p>המחיקה מסירה את האימון ואת כל הסטים ששייכים אליו. הפעולה לא ניתנת לביטול.</p><button class="history-delete-session" type="button" data-delete-history-session="${session.id}">מחק את האימון מההיסטוריה</button><div class="history-inline-status" data-history-delete-status></div></section>`;
}

function renderBody() {
  if (!page) return;
  const body = page.querySelector('#workoutHistoryBody');
  if (!body) return;
  if (selectedId) {
    const selected = sessions.find((session) => session.id === selectedId);
    if (selected) {
      body.innerHTML = detailView(selected);
      return;
    }
    selectedId = null;
  }
  body.innerHTML = listView();
}

function shellMarkup() {
  return `<div class="workout-history-page__inner">${AppPageHeader({ title: 'היסטוריית אימונים', subtitle: 'צפייה. תיקון. שליטה בנתונים.', rootClass: 'history-header', headingClass: 'history-heading', subtitleAbove: true })}<button class="workout-history-close" type="button" data-close-workout-history aria-label="חזרה לאימונים">${backIcon()}</button><section class="workout-history-content" id="workoutHistoryBody"></section></div>`;
}

async function refreshHistory({ keepSelection = true } = {}) {
  if (loading) return;
  loading = true;
  errorMessage = '';
  renderBody();
  const previousSelection = keepSelection ? selectedId : null;
  try {
    sessions = await loadWorkoutHistory();
    selectedId = previousSelection && sessions.some((session) => session.id === previousSelection) ? previousSelection : null;
  } catch (error) {
    errorMessage = error.message || 'לא הצלחנו לטעון את היסטוריית האימונים.';
  } finally {
    loading = false;
    renderBody();
  }
}

function openHistory() {
  if (page) return;
  ensureStyles();
  page = document.createElement('main');
  page.className = 'workout-history-page';
  page.dataset.ironScrollRoot = 'true';
  page.setAttribute('aria-label', 'היסטוריית אימונים');
  page.innerHTML = shellMarkup();
  document.body.appendChild(page);
  selectedId = null;
  filter = 'all';
  sessions = [];
  loading = false;
  errorMessage = '';
  history.pushState({ ...(history.state || {}), ironlogWorkoutHistory: true }, '', location.href);
  ownsHistoryEntry = true;
  refreshHistory({ keepSelection: false });
}

function removeHistoryPage() {
  if (!page) return;
  page.remove();
  page = null;
  sessions = [];
  selectedId = null;
  loading = false;
  errorMessage = '';
}

function closeHistory() {
  if (!page) return;
  if (ownsHistoryEntry) {
    ownsHistoryEntry = false;
    history.back();
  } else {
    removeHistoryPage();
  }
}

function inlineStatus(selector, message, type = '') {
  const node = page?.querySelector(selector);
  if (!node) return;
  node.textContent = message;
  node.className = `history-inline-status ${type ? `is-${type}` : ''}`;
}

function numberOrNull(value) {
  if (value === '' || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

document.addEventListener('click', async (event) => {
  const open = event.target.closest('[data-open-workout-history]');
  if (open) {
    event.preventDefault();
    openHistory();
    return;
  }
  if (!page) return;
  if (event.target.closest('[data-close-workout-history]')) {
    event.preventDefault();
    closeHistory();
    return;
  }
  if (event.target.closest('[data-history-back]')) {
    selectedId = null;
    renderBody();
    page.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const retry = event.target.closest('[data-history-retry]');
  if (retry) {
    refreshHistory();
    return;
  }
  const filterButton = event.target.closest('[data-history-filter]');
  if (filterButton) {
    filter = filterButton.dataset.historyFilter;
    renderBody();
    return;
  }
  const sessionButton = event.target.closest('[data-history-session]');
  if (sessionButton) {
    selectedId = sessionButton.dataset.historySession;
    renderBody();
    page.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const deleteSet = event.target.closest('[data-delete-history-set]');
  if (deleteSet) {
    const label = deleteSet.dataset.setLabel || 'הסט הזה';
    if (!window.confirm(`למחוק את ${label}? הנתונים יוסרו גם מהסטטיסטיקות.`)) return;
    deleteSet.disabled = true;
    try {
      await deleteHistorySet(deleteSet.dataset.deleteHistorySet);
      await refreshHistory();
    } catch (error) {
      deleteSet.disabled = false;
      window.alert(error.message || 'לא הצלחנו למחוק את הסט.');
    }
    return;
  }
  const deleteSession = event.target.closest('[data-delete-history-session]');
  if (deleteSession) {
    const session = sessions.find((item) => item.id === deleteSession.dataset.deleteHistorySession);
    if (!session) return;
    if (!window.confirm(`למחוק את "${session.name}" ואת כל ${session.completedSets} הסטים שלו? הפעולה לא ניתנת לביטול.`)) return;
    deleteSession.disabled = true;
    inlineStatus('[data-history-delete-status]', 'מוחק…');
    try {
      await deleteHistorySession(session.id);
      selectedId = null;
      await refreshHistory({ keepSelection: false });
    } catch (error) {
      deleteSession.disabled = false;
      inlineStatus('[data-history-delete-status]', error.message || 'לא הצלחנו למחוק את האימון.', 'error');
    }
  }
}, true);

document.addEventListener('submit', async (event) => {
  if (!page) return;
  const setForm = event.target.closest('[data-history-set-form]');
  if (setForm) {
    event.preventDefault();
    const submit = setForm.querySelector('.history-set-save');
    const data = new FormData(setForm);
    submit.disabled = true;
    try {
      await updateHistorySet(setForm.dataset.setId, {
        loadKg: numberOrNull(data.get('loadKg')),
        reps: numberOrNull(data.get('reps')),
        rir: numberOrNull(data.get('rir')),
      });
      await refreshHistory();
    } catch (error) {
      submit.disabled = false;
      window.alert(error.message || 'לא הצלחנו לשמור את הסט.');
    }
    return;
  }

  const sessionForm = event.target.closest('[data-history-session-form]');
  if (sessionForm) {
    event.preventDefault();
    const session = sessions.find((item) => item.id === sessionForm.dataset.sessionId);
    if (!session) return;
    const submit = sessionForm.querySelector('.history-save-session');
    const data = new FormData(sessionForm);
    const nextStart = new Date(String(data.get('startedAt') || ''));
    if (Number.isNaN(nextStart.getTime())) {
      inlineStatus('[data-history-session-status]', 'תאריך האימון לא תקין.', 'error');
      return;
    }
    const previousStart = new Date(session.startedAt).getTime();
    const previousEnd = new Date(session.completedAt || session.startedAt).getTime();
    const duration = Math.max(0, previousEnd - previousStart);
    submit.disabled = true;
    inlineStatus('[data-history-session-status]', 'שומר…');
    try {
      await updateHistorySession(session.id, {
        startedAt: nextStart.toISOString(),
        completedAt: new Date(nextStart.getTime() + duration).toISOString(),
        notes: data.get('notes'),
      });
      await refreshHistory();
      inlineStatus('[data-history-session-status]', 'השינויים נשמרו.', 'success');
    } catch (error) {
      submit.disabled = false;
      inlineStatus('[data-history-session-status]', error.message || 'לא הצלחנו לשמור.', 'error');
    }
  }
}, true);

window.addEventListener('popstate', () => {
  if (!page) return;
  ownsHistoryEntry = false;
  removeHistoryPage();
});

const observer = new MutationObserver(() => injectEntry());
observer.observe(document.body, { childList: true, subtree: true });
window.addEventListener('pageshow', injectEntry);
window.addEventListener('ironlog:navigate', injectEntry);
ensureStyles();
injectEntry();
