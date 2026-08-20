import { supabase } from '../../lib/supabase.js';
import { createBottomSheet } from '../../components/bottom-sheet.js';

let editSheet = null;
let activeFlowPage = null;
let cardSignature = '';
let loadVersion = 0;
let syncTimer = 0;
let setsByExercise = new Map();
let setById = new Map();

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function numberOrNull(value) {
  if (value === '' || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '';
  return Number.isInteger(number) ? String(number) : String(Math.round(number * 100) / 100);
}

function formatDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(total / 60);
  const rest = Math.round(total % 60);
  return minutes ? `${minutes}:${String(rest).padStart(2, '0')} דק׳` : `${rest} שנ׳`;
}

function normalizeSet(row) {
  return {
    id: row.id,
    sessionExerciseId: row.session_exercise_id,
    exerciseId: Number(row.exercise_id),
    setNumber: Number(row.set_number),
    setType: row.set_type || 'working',
    loadKg: row.load_kg == null ? null : Number(row.load_kg),
    reps: row.reps == null ? null : Number(row.reps),
    rir: row.rir == null ? null : Number(row.rir),
    durationSeconds: row.duration_seconds == null ? null : Number(row.duration_seconds),
    distanceMeters: row.distance_meters == null ? null : Number(row.distance_meters),
    restSeconds: row.rest_seconds == null ? null : Number(row.rest_seconds),
    notes: row.notes || '',
    trackingType: row.exercise?.tracking_type || 'weight_reps',
  };
}

function metricsMarkup(set) {
  const parts = [];
  if (set.trackingType === 'duration') {
    if (set.durationSeconds != null) parts.push(`<b>${escapeHtml(formatDuration(set.durationSeconds))}</b>`);
  } else if (set.trackingType === 'distance') {
    if (set.distanceMeters != null) parts.push(`<b>${escapeHtml(formatNumber(set.distanceMeters))} מ׳</b>`);
    if (set.durationSeconds != null) parts.push(`<span>${escapeHtml(formatDuration(set.durationSeconds))}</span>`);
  } else {
    if (set.loadKg != null) parts.push(`<b>${escapeHtml(formatNumber(set.loadKg))} ק״ג</b>`);
    if (set.reps != null) parts.push(`<span>${escapeHtml(formatNumber(set.reps))} חזרות</span>`);
    if (set.rir != null) parts.push(`<span>RIR ${escapeHtml(formatNumber(set.rir))}</span>`);
  }
  return parts.length ? parts.join('<i>·</i>') : '<span>ללא נתונים</span>';
}

function savedSetsMarkup(exerciseId, sets) {
  if (!sets.length) return '';
  return `<section class="workout-flow-saved-sets" data-flow-saved-sets="${escapeHtml(exerciseId)}">
    <div class="workout-flow-saved-sets__head"><strong>סטים שבוצעו</strong><span>לחץ על סט כדי לערוך</span></div>
    <div class="workout-flow-saved-sets__list">
      ${sets.map((set) => `<button class="workout-flow-saved-set workout-flow-action" type="button" data-flow-edit-set="${escapeHtml(set.id)}" aria-label="ערוך סט ${set.setNumber}">
        <span class="workout-flow-saved-set__number">סט ${set.setNumber}</span>
        <span class="workout-flow-saved-set__metrics">${metricsMarkup(set)}</span>
        <span class="workout-flow-saved-set__edit" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 20h4l10.4-10.4a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="m13.8 8.2 3 3"/></svg></span>
      </button>`).join('')}
    </div>
  </section>`;
}

function renderSavedSets() {
  const page = document.querySelector('.workout-flow-page');
  if (!page) return;
  page.querySelectorAll('[data-flow-item]').forEach((item) => {
    const exerciseId = item.dataset.flowItem;
    const card = item.querySelector('.workout-flow-card');
    const actions = card?.querySelector('.workout-flow-card__actions');
    if (!card || !actions) return;
    card.querySelector('.workout-flow-saved-sets')?.remove();
    const sets = setsByExercise.get(exerciseId) || [];
    if (!sets.length) return;
    actions.insertAdjacentHTML('beforebegin', savedSetsMarkup(exerciseId, sets));
  });
}

function currentCardSignature(page) {
  return [...page.querySelectorAll('[data-flow-item]')].map((item) => item.dataset.flowItem).join('|');
}

async function loadSets(page, signature) {
  const version = ++loadVersion;
  const ids = signature.split('|').filter(Boolean);
  if (!ids.length) {
    setsByExercise = new Map();
    setById = new Map();
    renderSavedSets();
    return;
  }

  const { data, error } = await supabase
    .from('performed_sets')
    .select('id,session_exercise_id,exercise_id,set_number,set_type,load_kg,reps,rir,duration_seconds,distance_meters,rest_seconds,notes,completed,exercise:exercises(tracking_type)')
    .in('session_exercise_id', ids)
    .eq('completed', true)
    .order('set_number');

  if (error) {
    console.warn('IronLog set editor could not load completed sets', error);
    return;
  }
  if (version !== loadVersion || page !== document.querySelector('.workout-flow-page')) return;

  const nextByExercise = new Map();
  const nextById = new Map();
  (data || []).map(normalizeSet).forEach((set) => {
    const list = nextByExercise.get(set.sessionExerciseId) || [];
    list.push(set);
    nextByExercise.set(set.sessionExerciseId, list);
    nextById.set(set.id, set);
  });
  nextByExercise.forEach((sets) => sets.sort((a, b) => a.setNumber - b.setNumber));
  setsByExercise = nextByExercise;
  setById = nextById;
  renderSavedSets();
}

function syncFlowCards({ force = false } = {}) {
  const page = document.querySelector('.workout-flow-page');
  if (!page) {
    if (activeFlowPage) {
      activeFlowPage = null;
      cardSignature = '';
      setsByExercise = new Map();
      setById = new Map();
      editSheet?.destroy();
      editSheet = null;
      loadVersion += 1;
    }
    return;
  }

  const signature = currentCardSignature(page);
  if (!signature) return;
  if (!force && page === activeFlowPage && signature === cardSignature) {
    renderSavedSets();
    return;
  }

  activeFlowPage = page;
  cardSignature = signature;
  loadSets(page, signature);
}

function scheduleSync(options = {}) {
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => syncFlowCards(options), 70);
}

function field(label, name, value, { min = 0, max = '', step = 1, inputMode = 'decimal' } = {}) {
  const maxAttr = max === '' ? '' : ` max="${max}"`;
  return `<label class="workout-set-editor-field"><span>${escapeHtml(label)}</span><input name="${escapeHtml(name)}" type="number" inputmode="${escapeHtml(inputMode)}" min="${min}"${maxAttr} step="${step}" value="${escapeHtml(value == null ? '' : formatNumber(value))}"></label>`;
}

function fieldsForSet(set) {
  if (set.trackingType === 'duration') {
    return field('משך (שניות)', 'durationSeconds', set.durationSeconds, { min: 0, step: 1, inputMode: 'numeric' });
  }
  if (set.trackingType === 'distance') {
    return `${field('מרחק (מטר)', 'distanceMeters', set.distanceMeters, { min: 0, step: 1 })}${field('משך (שניות)', 'durationSeconds', set.durationSeconds, { min: 0, step: 1, inputMode: 'numeric' })}`;
  }
  if (set.trackingType === 'reps') {
    return `${field('חזרות', 'reps', set.reps, { min: 0, step: 1, inputMode: 'numeric' })}${field('RIR', 'rir', set.rir, { min: 0, max: 10, step: 0.5 })}`;
  }
  return `${field('חזרות', 'reps', set.reps, { min: 0, step: 1, inputMode: 'numeric' })}${field('משקל (ק״ג)', 'loadKg', set.loadKg, { min: 0, step: 0.25 })}${field('RIR', 'rir', set.rir, { min: 0, max: 10, step: 0.5 })}`;
}

function openSetEditor(setId, sourceButton) {
  const set = setById.get(setId);
  if (!set) return;
  const card = sourceButton.closest('.workout-flow-card');
  const exerciseName = card?.querySelector('h2')?.textContent?.trim() || 'תרגיל';

  editSheet?.destroy();
  editSheet = createBottomSheet({
    ariaLabel: `עריכת סט ${set.setNumber}`,
    layerClassName: 'workout-flow-sheet-backdrop workout-set-editor-backdrop',
    panelClassName: 'workout-flow-sheet workout-set-editor-sheet',
    content: `<div class="workout-flow-sheet__grab"></div>
      <div class="workout-set-editor-head">
        <div><span>עריכת סט ${set.setNumber}</span><strong>${escapeHtml(exerciseName)}</strong></div>
        <button type="button" data-set-editor-close aria-label="סגור">×</button>
      </div>
      <form class="workout-set-editor-form" data-set-editor-form data-set-id="${escapeHtml(set.id)}">
        <div class="workout-set-editor-fields">${fieldsForSet(set)}</div>
        <p class="workout-set-editor-note">השינוי מתעדכן גם בגרף, בהתקדמות ובסטטיסטיקות.</p>
        <button class="workout-set-editor-save" type="submit"><span>שמור שינויים</span><b>✓</b></button>
      </form>`,
  });
  editSheet.open();
}

function showFlowStatus(message) {
  const busy = document.querySelector('.workout-flow-page .workout-flow-busy');
  if (!busy) return;
  busy.textContent = message;
  busy.hidden = false;
  window.setTimeout(() => {
    if (busy.textContent === message) busy.hidden = true;
  }, 1500);
}

function updateCachedSet(setId, values) {
  const set = setById.get(setId);
  if (!set) return;
  Object.assign(set, values);
  const list = setsByExercise.get(set.sessionExerciseId) || [];
  const index = list.findIndex((item) => item.id === set.id);
  if (index >= 0) list[index] = set;
  renderSavedSets();
}

async function saveEditedSet(form) {
  const set = setById.get(form.dataset.setId);
  if (!set) throw new Error('הסט כבר לא זמין לעריכה');
  const data = new FormData(form);
  const has = (name) => form.elements.namedItem(name) != null;
  const values = {
    loadKg: has('loadKg') ? numberOrNull(data.get('loadKg')) : set.loadKg,
    reps: has('reps') ? numberOrNull(data.get('reps')) : set.reps,
    rir: has('rir') ? numberOrNull(data.get('rir')) : set.rir,
    durationSeconds: has('durationSeconds') ? numberOrNull(data.get('durationSeconds')) : set.durationSeconds,
    distanceMeters: has('distanceMeters') ? numberOrNull(data.get('distanceMeters')) : set.distanceMeters,
  };

  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  submit.classList.add('is-saving');

  const { error } = await supabase.rpc('record_workout_set', {
    p_session_exercise_id: set.sessionExerciseId,
    p_set_number: set.setNumber,
    p_set_type: set.setType || 'working',
    p_load_kg: values.loadKg,
    p_reps: values.reps,
    p_rir: values.rir,
    p_duration_seconds: values.durationSeconds,
    p_distance_meters: values.distanceMeters,
    p_rest_seconds: set.restSeconds,
    p_notes: set.notes || null,
  });
  if (error) {
    submit.disabled = false;
    submit.classList.remove('is-saving');
    throw error;
  }

  updateCachedSet(set.id, values);
  editSheet?.close();
  showFlowStatus(`סט ${set.setNumber} עודכן`);
  window.setTimeout(() => scheduleSync({ force: true }), 360);
}

// The existing long-press reorder logic already ignores .workout-flow-action.
// Set rows intentionally use that class, so tapping/editing never starts a drag.
document.addEventListener('click', (event) => {
  const edit = event.target.closest('[data-flow-edit-set]');
  if (edit) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openSetEditor(edit.dataset.flowEditSet, edit);
    return;
  }

  if (event.target.closest('[data-set-editor-close]')) {
    event.preventDefault();
    editSheet?.close();
    return;
  }

  const backdrop = event.target.closest('.workout-set-editor-backdrop');
  if (backdrop && event.target === backdrop) editSheet?.close();
}, true);

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('[data-set-editor-form]');
  if (!form) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  try {
    await saveEditedSet(form);
  } catch (error) {
    const note = form.querySelector('.workout-set-editor-note');
    if (note) {
      note.textContent = error?.message || 'לא הצלחנו לשמור את הסט';
      note.classList.add('is-error');
    }
  }
}, true);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && editSheet?.isOpen()) {
    event.preventDefault();
    event.stopImmediatePropagation();
    editSheet.close();
  }
}, true);

new MutationObserver(() => scheduleSync()).observe(document.body, { childList: true, subtree: true });
addEventListener('pageshow', () => scheduleSync({ force: true }));
scheduleSync({ force: true });
