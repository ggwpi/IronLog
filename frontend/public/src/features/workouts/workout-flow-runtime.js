import { supabase } from '../../lib/supabase.js';
import { createBottomSheet } from '../../components/bottom-sheet.js';

let flowState = null;
let flowRoot = null;
let flowBusyTimer = null;
let addSheet = null;
let dragState = null;
let suppressClickUntil = 0;
const LONG_PRESS_MS = 320;
const LONG_PRESS_SLOP = 9;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function completedCount(exercise) {
  return Number(exercise?.completedSets || 0);
}

function plannedCount(exercise) {
  return Math.max(0, Number(exercise?.plannedSets ?? 0));
}

function originalPlannedCount(exercise) {
  return Math.max(1, Number(exercise?.originalPlannedSets ?? exercise?.plannedSets ?? 1));
}

function isDone(exercise) {
  const planned = plannedCount(exercise);
  return !exercise.isSkipped && planned > 0 && completedCount(exercise) >= planned;
}

function isRunnable(exercise) {
  return !exercise.isSkipped && completedCount(exercise) < plannedCount(exercise);
}

function currentExercise(exercises = []) {
  return exercises.find(isRunnable) || null;
}

function stateLabel(exercise, currentId) {
  if (exercise.isSkipped) return 'לא מתבצע';
  if (isDone(exercise)) return 'הושלם';
  if (exercise.id === currentId) return 'עכשיו';
  return 'בהמשך';
}

function normalizeExercise(item, setsByExercise) {
  const completedSets = Number(setsByExercise.get(item.id) || 0);
  const plannedSets = Number(item.planned_sets ?? 0);
  return {
    id: item.id,
    exerciseId: Number(item.exercise_id),
    position: Number(item.position),
    name: item.exercise_name || 'Exercise',
    plannedSets,
    originalPlannedSets: Number(item.original_planned_sets ?? item.planned_sets ?? Math.max(completedSets, 1)),
    isSkipped: Boolean(item.is_skipped),
    targetReps: item.target_reps || '',
    targetRirMin: item.target_rir_min == null ? null : Number(item.target_rir_min),
    targetRirMax: item.target_rir_max == null ? null : Number(item.target_rir_max),
    restSeconds: Number(item.rest_max_seconds || item.rest_min_seconds || 90),
    completedSets,
  };
}

async function loadFlowData() {
  const { data: session, error: sessionError } = await supabase
    .from('workout_sessions')
    .select('id,template_name,status,started_at')
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sessionError) throw sessionError;
  if (!session) throw new Error('אין אימון פעיל כרגע');

  const [exerciseResult, setsResult, libraryResult] = await Promise.all([
    supabase
      .from('session_exercises')
      .select('id,session_id,exercise_id,position,exercise_name,planned_sets,original_planned_sets,is_skipped,target_reps,target_rir_min,target_rir_max,rest_min_seconds,rest_max_seconds')
      .eq('session_id', session.id)
      .order('position'),
    supabase
      .from('performed_sets')
      .select('id,session_exercise_id,set_number,completed')
      .eq('session_id', session.id)
      .eq('completed', true),
    supabase
      .from('exercises')
      .select('id,name,name_he,equipment,tracking_type,is_system')
      .is('archived_at', null)
      .order('name'),
  ]);

  if (exerciseResult.error) throw exerciseResult.error;
  if (setsResult.error) throw setsResult.error;
  if (libraryResult.error) throw libraryResult.error;

  const setsByExercise = new Map();
  (setsResult.data || []).forEach((set) => {
    setsByExercise.set(set.session_exercise_id, (setsByExercise.get(set.session_exercise_id) || 0) + 1);
  });

  const exercises = (exerciseResult.data || []).map((item) => normalizeExercise(item, setsByExercise));
  const library = (libraryResult.data || []).map((item) => ({
    id: Number(item.id),
    name: item.name_he || item.name,
    englishName: item.name || '',
    equipment: item.equipment || '',
    trackingType: item.tracking_type || '',
  }));

  flowState = { session, exercises, library };
  return flowState;
}

function progressModel(exercises) {
  const included = exercises.filter((exercise) => !exercise.isSkipped);
  const planned = included.reduce((sum, exercise) => sum + plannedCount(exercise), 0);
  const completed = included.reduce((sum, exercise) => sum + Math.min(completedCount(exercise), plannedCount(exercise)), 0);
  const doneExercises = included.filter(isDone).length;
  return {
    planned,
    completed,
    doneExercises,
    activeExercises: included.length,
    percent: planned > 0 ? Math.min(100, Math.round((completed / planned) * 100)) : 0,
  };
}

function setDotsMarkup(exercise) {
  const count = exercise.isSkipped ? originalPlannedCount(exercise) : Math.max(1, plannedCount(exercise));
  const completed = completedCount(exercise);
  return Array.from({ length: count }, (_, index) => {
    const setNumber = index + 1;
    const className = exercise.isSkipped ? '' : setNumber <= completed ? 'is-done' : setNumber === completed + 1 ? 'is-current' : '';
    return `<i class="${className}"></i>`;
  }).join('');
}

function exerciseMeta(exercise) {
  const parts = [];
  const plan = exercise.isSkipped ? originalPlannedCount(exercise) : plannedCount(exercise);
  parts.push(`${plan} סטים`);
  if (exercise.targetReps) parts.push(`${escapeHtml(exercise.targetReps)} חזרות`);
  if (exercise.restSeconds) parts.push(`${Math.round(exercise.restSeconds / 30) * 30} שנ׳ מנוחה`);
  return parts.map((part) => `<span>${part}</span>`).join('');
}

function cardMarkup(exercise, index, exercises, currentId) {
  const classNames = ['workout-flow-item'];
  if (exercise.isSkipped) classNames.push('is-skipped');
  else if (isDone(exercise)) classNames.push('is-done');
  else if (exercise.id === currentId) classNames.push('is-current');

  const runnable = isRunnable(exercise);
  const nonSkippedCount = exercises.filter((item) => !item.isSkipped).length;
  const skipDisabled = !exercise.isSkipped && nonSkippedCount <= 1;

  return `<article class="${classNames.join(' ')}" data-flow-item="${exercise.id}">
    <div class="workout-flow-card" data-flow-drag-card>
      <button class="workout-flow-card__main" type="button" ${runnable ? `data-flow-go="${exercise.id}"` : ''} ${runnable ? '' : 'aria-disabled="true"'}>
        <div class="workout-flow-card__head">
          <div class="workout-flow-card__copy">
            <span class="workout-flow-state"><i></i>${stateLabel(exercise, currentId)}</span>
            <h2>${escapeHtml(exercise.name)}</h2>
            <div class="workout-flow-card__meta">${exerciseMeta(exercise)}</div>
          </div>
          <span class="workout-flow-card__index">${String(index + 1).padStart(2, '0')}</span>
        </div>
        <div class="workout-flow-set-dots" aria-label="${completedCount(exercise)} מתוך ${exercise.isSkipped ? originalPlannedCount(exercise) : plannedCount(exercise)} סטים">${setDotsMarkup(exercise)}</div>
      </button>
      <div class="workout-flow-card__actions">
        <span class="workout-flow-drag-hint" aria-hidden="true"><i></i><span>לחיצה ארוכה לגרירה</span></span>
        <button class="workout-flow-action workout-flow-action--skip ${exercise.isSkipped ? 'is-restore' : ''}" type="button" data-flow-skip="${exercise.id}" data-skipped="${exercise.isSkipped ? 'true' : 'false'}" ${skipDisabled ? 'disabled' : ''}>${exercise.isSkipped ? '↶ החזר לאימון' : '⊘ לא לבצע'}</button>
        ${runnable ? `<button class="workout-flow-action workout-flow-action--go" type="button" data-flow-go="${exercise.id}">${exercise.id === currentId ? 'חזרה לתרגיל' : 'בצע עכשיו'} <span>↗</span></button>` : ''}
      </div>
    </div>
  </article>`;
}

function libraryMarkup() {
  if (!flowState) return '';
  const existing = new Set(flowState.exercises.map((exercise) => exercise.exerciseId));
  const available = flowState.library.filter((exercise) => !existing.has(exercise.id));
  if (!available.length) return '<div class="workout-flow-library-empty">כל התרגילים הזמינים כבר נמצאים באימון.</div>';

  return available.map((exercise) => {
    const search = `${exercise.name} ${exercise.englishName} ${exercise.equipment}`.toLowerCase();
    return `<button class="workout-flow-library-item" type="button" data-flow-add="${exercise.id}" data-search="${escapeHtml(search)}">
      <span><strong>${escapeHtml(exercise.name)}</strong><small>${escapeHtml(exercise.equipment || 'תרגיל')}</small></span><b>＋</b>
    </button>`;
  }).join('');
}

function mountAddSheet() {
  addSheet?.destroy();
  addSheet = createBottomSheet({
    ariaLabel: 'הוסף תרגיל',
    layerClassName: 'workout-flow-sheet-backdrop',
    panelClassName: 'workout-flow-sheet',
    content: `<div class="workout-flow-sheet__grab"></div>
      <div class="workout-flow-sheet__head"><strong>הוסף תרגיל</strong><button type="button" data-flow-close-sheet aria-label="סגור">×</button></div>
      <input class="workout-flow-search" type="search" inputmode="search" placeholder="חיפוש תרגיל..." data-flow-search autocomplete="off">
      <div class="workout-flow-library">${libraryMarkup()}</div>`,
  });
  addSheet.root.dataset.flowSheetBackdrop = 'true';
}

function renderFlow() {
  if (!flowRoot || !flowState) return;
  const { session, exercises } = flowState;
  const progress = progressModel(exercises);
  const current = currentExercise(exercises);
  const currentId = current?.id || '';

  flowRoot.innerHTML = `<div class="workout-flow-shell">
    <header class="workout-flow-topbar">
      <button type="button" data-flow-close aria-label="חזרה לאימון">‹</button>
      <div class="workout-flow-heading"><strong>${escapeHtml(session.template_name || 'האימון שלי')}</strong><span>מפת האימון</span></div>
      <span aria-hidden="true"></span>
    </header>

    <section class="workout-flow-summary">
      <span class="workout-flow-summary__eyebrow">WORKOUT FLOW</span>
      <h1>כל האימון, במקום אחד.</h1>
      <p>בחר תרגיל לביצוע עכשיו, גרור בלחיצה ארוכה כדי לשנות סדר, השבת תרגיל או הוסף תרגיל חדש.</p>
      <div class="workout-flow-progress">
        <div class="workout-flow-progress__meta"><strong>${progress.completed}/${progress.planned} סטים</strong><span>${progress.doneExercises}/${progress.activeExercises} תרגילים הושלמו</span></div>
        <div class="workout-flow-progress__track"><i style="--flow-progress:${progress.percent}%"></i></div>
      </div>
    </section>

    <div class="workout-flow-section-title"><strong>סדר האימון</strong><span>לחיצה ארוכה על Card וגרירה</span></div>
    <section class="workout-flow-timeline" aria-label="סדר התרגילים">
      ${exercises.map((exercise, index) => cardMarkup(exercise, index, exercises, currentId)).join('')}
      <button class="workout-flow-add" type="button" data-flow-open-add><b>＋</b><span>הוסף תרגיל לאימון</span></button>
    </section>
    <p class="workout-flow-note">תרגיל שבוטל נשאר ברשימה באפור ולא נספר בהתקדמות. אפשר להחזיר אותו בכל רגע.</p>
  </div>
  <div class="workout-flow-busy" role="status" hidden></div>`;
  mountAddSheet();
}

function showFlowLoading() {
  if (!flowRoot) return;
  flowRoot.innerHTML = `<div class="workout-flow-shell"><header class="workout-flow-topbar"><button type="button" data-flow-close aria-label="חזרה">‹</button><div class="workout-flow-heading"><strong>האימון שלי</strong><span>מפת האימון</span></div><span></span></header><section class="workout-flow-summary"><span class="workout-flow-summary__eyebrow">WORKOUT FLOW</span><h1>טוען את האימון...</h1><p>רגע אחד.</p></section></div>`;
}

function showBusy(message, duration = 0) {
  const element = flowRoot?.querySelector('.workout-flow-busy');
  if (!element) return;
  window.clearTimeout(flowBusyTimer);
  element.textContent = message;
  element.hidden = false;
  if (duration > 0) flowBusyTimer = window.setTimeout(() => { element.hidden = true; }, duration);
}

function showError(error) {
  showBusy(error?.message || 'לא הצלחנו לעדכן את האימון', 2600);
}

function closeFlow() {
  cancelPendingDrag();
  addSheet?.destroy();
  addSheet = null;
  document.body.classList.remove('ironlog-flow-open', 'ironlog-flow-dragging');
  flowRoot?.remove();
  flowRoot = null;
  flowState = null;
}

function openAddSheet() {
  if (!addSheet) mountAddSheet();
  addSheet?.open();
}

function closeAddSheet() {
  document.activeElement?.blur?.();
  addSheet?.close();
}

async function refreshFlow(message = '') {
  await loadFlowData();
  renderFlow();
  if (message) showBusy(message, 1300);
}

async function goToExercise(id) {
  if (!flowState) return;
  const selected = flowState.exercises.find((exercise) => exercise.id === id);
  if (!selected || !isRunnable(selected)) return;
  const current = currentExercise(flowState.exercises);
  if (!current || current.id === selected.id) {
    closeFlow();
    return;
  }

  const order = flowState.exercises.map((exercise) => exercise.id);
  const currentIndex = flowState.exercises.findIndex((exercise) => exercise.id === current.id);
  const selectedIndex = order.indexOf(selected.id);
  order.splice(selectedIndex, 1);
  order.splice(currentIndex, 0, selected.id);

  showBusy('עובר לתרגיל...');
  const { error } = await supabase.rpc('reorder_active_workout_exercises', {
    p_session_id: flowState.session.id,
    p_order: order,
  });
  if (error) throw error;
  showBusy('התרגיל מוכן', 700);
  window.setTimeout(closeFlow, 480);
}

async function toggleSkipped(id, isCurrentlySkipped) {
  if (!flowState) return;
  const exercise = flowState.exercises.find((item) => item.id === id);
  if (!exercise) return;
  if (!isCurrentlySkipped && flowState.exercises.filter((item) => !item.isSkipped).length <= 1) {
    showBusy('צריך להשאיר לפחות תרגיל אחד באימון', 2200);
    return;
  }

  showBusy(isCurrentlySkipped ? 'מחזיר את התרגיל...' : 'מסמן כלא מתבצע...');
  const { error } = await supabase.rpc('set_active_workout_exercise_skipped', {
    p_session_exercise_id: id,
    p_skipped: !isCurrentlySkipped,
  });
  if (error) throw error;
  await refreshFlow(isCurrentlySkipped ? 'התרגיל חזר לאימון' : 'התרגיל נשאר ברשימה באפור');
}

async function addExercise(exerciseId) {
  if (!flowState) return;
  closeAddSheet();
  showBusy('מוסיף תרגיל...');
  const { error } = await supabase.rpc('add_active_workout_exercise', {
    p_session_id: flowState.session.id,
    p_exercise_id: Number(exerciseId),
  });
  if (error) throw error;
  await refreshFlow('התרגיל נוסף לסוף האימון');
}

function timelineItems() {
  return [...(flowRoot?.querySelectorAll('.workout-flow-item') || [])];
}

function captureRects(items) {
  return new Map(items.map((item) => [item.dataset.flowItem, item.getBoundingClientRect()]));
}

function animateFlip(previousRects, items) {
  items.forEach((item) => {
    if (item === dragState?.source) return;
    const before = previousRects.get(item.dataset.flowItem);
    if (!before) return;
    const after = item.getBoundingClientRect();
    const delta = before.top - after.top;
    if (Math.abs(delta) < 1) return;
    item.animate([
      { transform: `translateY(${delta}px)` },
      { transform: 'translateY(0)' },
    ], { duration: 190, easing: 'cubic-bezier(.2,.78,.2,1)' });
  });
}

function updateOrderNumbersAndStates() {
  if (!flowState) return;
  const order = timelineItems().map((item) => item.dataset.flowItem);
  const byId = new Map(flowState.exercises.map((exercise) => [exercise.id, exercise]));
  flowState.exercises = order.map((id, index) => ({ ...byId.get(id), position: index + 1 })).filter(Boolean);
  const currentId = currentExercise(flowState.exercises)?.id || '';
  timelineItems().forEach((item, index) => {
    const exercise = byId.get(item.dataset.flowItem);
    if (!exercise) return;
    item.querySelector('.workout-flow-card__index').textContent = String(index + 1).padStart(2, '0');
    item.classList.toggle('is-current', !exercise.isSkipped && !isDone(exercise) && exercise.id === currentId);
    item.classList.toggle('is-done', isDone(exercise));
    item.classList.toggle('is-skipped', exercise.isSkipped);
    const state = item.querySelector('.workout-flow-state');
    if (state) state.lastChild.textContent = stateLabel(exercise, currentId);
    const go = item.querySelector('.workout-flow-action--go');
    if (go && isRunnable(exercise)) go.innerHTML = `${exercise.id === currentId ? 'חזרה לתרגיל' : 'בצע עכשיו'} <span>↗</span>`;
  });
}

function dragTargetAt(clientY) {
  const items = timelineItems().filter((item) => item !== dragState?.source);
  if (!items.length) return null;
  for (const item of items) {
    const rect = item.getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) return { item, before: true };
  }
  return { item: items.at(-1), before: false };
}

function moveSourceNearPointer(clientY) {
  if (!dragState?.active) return;
  const target = dragTargetAt(clientY);
  if (!target) return;
  const source = dragState.source;
  const timeline = source.parentElement;
  const previousRects = captureRects(timelineItems());
  const reference = target.before ? target.item : target.item.nextElementSibling;
  if (reference === source || source.nextElementSibling === reference) return;
  timeline.insertBefore(source, reference);
  animateFlip(previousRects, timelineItems());
  updateOrderNumbersAndStates();
}

function updateGhost(clientY) {
  if (!dragState?.active) return;
  dragState.lastClientY = clientY;
  const y = clientY - dragState.grabOffsetY;
  dragState.ghost.style.transform = `translate3d(0, ${y - dragState.originTop}px, 0) scale(1.015)`;

  const viewport = window.visualViewport;
  const top = viewport?.offsetTop || 0;
  const bottom = top + (viewport?.height || window.innerHeight);
  const edge = 92;
  if (clientY < top + edge) flowRoot?.scrollBy({ top: -12, behavior: 'auto' });
  else if (clientY > bottom - edge) flowRoot?.scrollBy({ top: 12, behavior: 'auto' });
}

function beginDrag(pending) {
  if (!flowRoot || !pending?.source?.isConnected) return;
  const rect = pending.source.getBoundingClientRect();
  const card = pending.source.querySelector('.workout-flow-card');
  if (!card) return;
  const ghost = card.cloneNode(true);
  ghost.classList.add('workout-flow-drag-ghost');
  ghost.querySelectorAll('button').forEach((button) => { button.tabIndex = -1; });
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: '0',
    zIndex: '120050',
    pointerEvents: 'none',
    transformOrigin: 'center center',
  });
  document.body.appendChild(ghost);

  dragState = {
    ...pending,
    active: true,
    ghost,
    originTop: rect.top,
    grabOffsetY: pending.startClientY - rect.top,
    lastClientY: pending.startClientY,
    initialOrder: timelineItems().map((item) => item.dataset.flowItem),
  };
  pending.source.classList.add('is-drag-source');
  document.body.classList.add('ironlog-flow-dragging');
  try { pending.source.setPointerCapture(pending.pointerId); } catch {}
  navigator.vibrate?.(12);
  updateGhost(pending.startClientY);
}

function cancelPendingDrag() {
  if (!dragState) return;
  window.clearTimeout(dragState.timer);
  if (!dragState.active) {
    dragState = null;
    return;
  }
  dragState.ghost?.remove();
  dragState.source?.classList.remove('is-drag-source');
  document.body.classList.remove('ironlog-flow-dragging');
  dragState = null;
}

async function commitDraggedOrder(order) {
  if (!flowState) return;
  showBusy('שומר את הסדר...');
  const { error } = await supabase.rpc('reorder_active_workout_exercises', {
    p_session_id: flowState.session.id,
    p_order: order,
  });
  if (error) throw error;
  showBusy('הסדר עודכן', 1100);
}

async function finishDrag() {
  if (!dragState?.active) {
    cancelPendingDrag();
    return;
  }
  const state = dragState;
  const finalRect = state.source.getBoundingClientRect();
  const finalY = finalRect.top - state.originTop;
  state.ghost.style.transition = 'transform 170ms cubic-bezier(.2,.82,.2,1), opacity 170ms ease';
  state.ghost.style.transform = `translate3d(0, ${finalY}px, 0) scale(1)`;
  state.ghost.style.opacity = '.72';
  suppressClickUntil = performance.now() + 450;

  const order = timelineItems().map((item) => item.dataset.flowItem);
  const changed = order.some((id, index) => id !== state.initialOrder[index]);
  window.setTimeout(() => {
    state.source?.classList.remove('is-drag-source');
    state.ghost?.remove();
  }, 175);
  document.body.classList.remove('ironlog-flow-dragging');
  dragState = null;

  if (!changed) return;
  try {
    updateOrderNumbersAndStates();
    await commitDraggedOrder(order);
  } catch (error) {
    showError(error);
    try { await refreshFlow(); } catch {}
  }
}

function onDragPointerDown(event) {
  if (event.pointerType === 'touch') return;
  if (!flowRoot || event.button !== 0 || !event.isPrimary) return;
  if (event.target.closest('.workout-flow-action, [data-flow-open-add], .workout-flow-sheet')) return;
  const source = event.target.closest('.workout-flow-item');
  if (!source) return;
  cancelPendingDrag();
  const pending = {
    active: false,
    source,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    timer: 0,
  };
  pending.timer = window.setTimeout(() => beginDrag(pending), LONG_PRESS_MS);
  dragState = pending;
}

function onDragPointerMove(event) {
  if (event.pointerType === 'touch') return;
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  if (!dragState.active) {
    const moved = Math.hypot(event.clientX - dragState.startClientX, event.clientY - dragState.startClientY);
    if (moved > LONG_PRESS_SLOP) cancelPendingDrag();
    return;
  }
  event.preventDefault();
  updateGhost(event.clientY);
  moveSourceNearPointer(event.clientY);
}

function onDragPointerEnd(event) {
  if (event.pointerType === 'touch') return;
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  window.clearTimeout(dragState.timer);
  if (dragState.active) {
    event.preventDefault();
    finishDrag();
  } else {
    dragState = null;
  }
}

function touchByIdentifier(event, identifier) {
  return [...event.changedTouches, ...event.touches].find((touch) => touch.identifier === identifier) || null;
}

function onDragTouchStart(event) {
  if (!flowRoot || event.touches.length !== 1) return;
  if (event.target.closest('.workout-flow-action, [data-flow-open-add], .workout-flow-sheet')) return;
  const source = event.target.closest('.workout-flow-item');
  if (!source) return;
  cancelPendingDrag();
  const touch = event.touches[0];
  const pending = {
    active: false,
    source,
    touchIdentifier: touch.identifier,
    startClientX: touch.clientX,
    startClientY: touch.clientY,
    timer: 0,
  };
  pending.timer = window.setTimeout(() => beginDrag(pending), LONG_PRESS_MS);
  dragState = pending;
}

function onDragTouchMove(event) {
  if (!dragState || dragState.touchIdentifier == null) return;
  const touch = touchByIdentifier(event, dragState.touchIdentifier);
  if (!touch) return;
  if (!dragState.active) {
    const moved = Math.hypot(touch.clientX - dragState.startClientX, touch.clientY - dragState.startClientY);
    if (moved > LONG_PRESS_SLOP) cancelPendingDrag();
    return;
  }
  event.preventDefault();
  updateGhost(touch.clientY);
  moveSourceNearPointer(touch.clientY);
}

function onDragTouchEnd(event) {
  if (!dragState || dragState.touchIdentifier == null) return;
  const touch = [...event.changedTouches].find((candidate) => candidate.identifier === dragState.touchIdentifier);
  if (!touch && event.type !== 'touchcancel') return;
  window.clearTimeout(dragState.timer);
  if (dragState.active) {
    event.preventDefault();
    finishDrag();
  } else {
    dragState = null;
  }
}

async function openFlow() {
  if (flowRoot) return;
  flowRoot = document.createElement('main');
  flowRoot.className = 'workout-flow-page';
  flowRoot.setAttribute('aria-label', 'מפת האימון');
  document.body.appendChild(flowRoot);
  document.body.classList.add('ironlog-flow-open');
  showFlowLoading();
  try {
    await loadFlowData();
    renderFlow();
  } catch (error) {
    flowRoot.innerHTML = `<div class="workout-flow-shell"><header class="workout-flow-topbar"><button type="button" data-flow-close>‹</button><div class="workout-flow-heading"><strong>מפת האימון</strong><span>שגיאה</span></div><span></span></header><section class="workout-flow-summary"><h1>לא הצלחנו לפתוח את האימון.</h1><p>${escapeHtml(error?.message || 'נסה שוב בעוד רגע')}</p></section></div>`;
  }
}

function prepareNextWidget() {
  document.querySelectorAll('.live-next-flat').forEach((element) => {
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');
    element.setAttribute('aria-label', 'פתח את מפת האימון');
  });
}

document.addEventListener('pointerdown', onDragPointerDown, { capture: true });
document.addEventListener('pointermove', onDragPointerMove, { capture: true, passive: false });
document.addEventListener('pointerup', onDragPointerEnd, { capture: true });
document.addEventListener('pointercancel', onDragPointerEnd, { capture: true });
document.addEventListener('touchstart', onDragTouchStart, { capture: true, passive: true });
document.addEventListener('touchmove', onDragTouchMove, { capture: true, passive: false });
document.addEventListener('touchend', onDragTouchEnd, { capture: true, passive: false });
document.addEventListener('touchcancel', onDragTouchEnd, { capture: true, passive: false });
document.addEventListener('contextmenu', (event) => {
  if (flowRoot && event.target.closest?.('.workout-flow-card')) event.preventDefault();
}, { capture: true });

document.addEventListener('click', async (event) => {
  if (performance.now() < suppressClickUntil && event.target.closest('.workout-flow-card')) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  const nextWidget = event.target.closest('.live-next-flat');
  if (nextWidget && !flowRoot) {
    event.preventDefault();
    event.stopPropagation();
    await openFlow();
    return;
  }

  if (!flowRoot) return;

  if (event.target.closest('[data-flow-close]')) {
    event.preventDefault();
    closeFlow();
    return;
  }

  if (event.target.closest('[data-flow-open-add]')) {
    event.preventDefault();
    openAddSheet();
    return;
  }

  if (event.target.closest('[data-flow-close-sheet]')) {
    event.preventDefault();
    closeAddSheet();
    return;
  }

  const backdrop = event.target.closest('[data-flow-sheet-backdrop]');
  if (backdrop && event.target === backdrop) {
    closeAddSheet();
    return;
  }

  const go = event.target.closest('[data-flow-go]');
  if (go) {
    event.preventDefault();
    try { await goToExercise(go.dataset.flowGo); } catch (error) { showError(error); }
    return;
  }

  const skip = event.target.closest('[data-flow-skip]');
  if (skip) {
    event.preventDefault();
    try { await toggleSkipped(skip.dataset.flowSkip, skip.dataset.skipped === 'true'); } catch (error) { showError(error); }
    return;
  }

  const add = event.target.closest('[data-flow-add]');
  if (add) {
    event.preventDefault();
    try { await addExercise(Number(add.dataset.flowAdd)); } catch (error) { showError(error); }
  }
}, true);

document.addEventListener('keydown', (event) => {
  if (!flowRoot && event.target.closest?.('.live-next-flat') && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    openFlow();
    return;
  }
  if (event.key !== 'Escape' || !flowRoot) return;
  if (addSheet?.isOpen()) closeAddSheet();
  else closeFlow();
});

document.addEventListener('input', (event) => {
  if (!flowRoot || !event.target.matches('[data-flow-search]')) return;
  const query = event.target.value.trim().toLowerCase();
  addSheet?.root.querySelectorAll('[data-search]').forEach((item) => {
    item.hidden = Boolean(query) && !String(item.dataset.search || '').includes(query);
  });
}, true);

const appRoot = document.querySelector('#app');
if (appRoot) new MutationObserver(prepareNextWidget).observe(appRoot, { childList: true, subtree: true });
prepareNextWidget();
