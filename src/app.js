(function () {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const program = window.IRONLOG_PROGRAM;
  const store = window.IronStorage;

  if (!program || !store) {
    document.body.innerHTML = '<div style="padding:30px;color:white">IronLog failed to initialize.</div>';
    return;
  }

  const state = {
    workout: null,
    exerciseIndex: 0,
    setIndex: 0,
    run: null,
    sheetWorkout: null,
    restEndsAt: 0,
    restTimer: null,
  };

  const els = {
    home: $('#homeView'),
    history: $('#historyView'),
    weight: $('#weightView'),
    grid: $('#workoutGrid'),
    sheet: $('#workoutSheet'),
    backdrop: $('#sheetBackdrop'),
    sheetList: $('#sheetExerciseList'),
    grabber: $('#sheetGrabber'),
    workoutView: $('#workoutView'),
    selector: $('#exerciseSelector'),
    title: $('#exerciseTitle'),
    ring: $('#setRing'),
    ringText: $('#setRingText'),
    load: $('#loadInput'),
    reps: $('#repsInput'),
    rir: $('#rirInput'),
    restCard: $('#restCard'),
    restText: $('#restTimerText'),
    videoPanel: $('#videoPanel'),
    toast: $('#toast'),
  };

  function fmtTime(seconds) {
    const value = Math.max(0, Math.round(Number(seconds) || 0));
    const minutes = Math.floor(value / 60);
    const secs = value % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function totalSets(workout) {
    return workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  }

  function estimatedMinutes(workout) {
    return Math.round(
      workout.exercises.reduce(
        (sum, exercise) => sum + exercise.sets * (exercise.compound ? 4.2 : 2.7),
        0,
      ),
    );
  }

  function todayWorkout() {
    const day = new Date().getDay();
    const dayToProgram = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
    return program[dayToProgram[day] ?? 0];
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      els.toast.hidden = true;
    }, 2200);
  }

  function switchView(name) {
    [els.home, els.history, els.weight].forEach((view) => view.classList.remove('active'));
    const target = { home: els.home, history: els.history, weight: els.weight }[name];
    if (target) target.classList.add('active');
  }

  function renderHome() {
    const saved = store.get();
    const next = todayWorkout();
    $('#nextWorkoutTitle').textContent = `${next.short} · ${next.title}`;
    $('#nextWorkoutMeta').textContent = `${next.exercises.length} תרגילים · ${totalSets(next)} סטים`;
    $('#todaySummary').textContent = new Intl.DateTimeFormat('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());
    $('#workoutCount').textContent = saved.sessions.length;

    const bodyWeight = saved.bodyWeight[saved.bodyWeight.length - 1];
    $('#latestWeight').textContent = bodyWeight ? `${Number(bodyWeight.value).toFixed(1)} ק״ג` : '—';

    els.grid.innerHTML = program
      .map(
        (workout, index) => `
          <button class="workout-card" data-workout="${index}">
            <div>
              <span class="day">${workout.day} · ${workout.short}</span>
              <strong>${workout.title}</strong>
              <p>${workout.subtitle}</p>
            </div>
            <div class="meta">
              <span>${workout.exercises.length} תרגילים</span>
              <span>${totalSets(workout)} סטים</span>
            </div>
          </button>`,
      )
      .join('');

    $$('[data-workout]').forEach((button) => {
      button.addEventListener('click', () => openSheet(program[Number(button.dataset.workout)]));
    });
  }

  function finishedSetCount(draft) {
    return draft?.sets?.filter((set) => set.status !== 'pending').length || 0;
  }

  function openSheet(workout) {
    state.sheetWorkout = workout;
    $('#sheetTitle').textContent = `${workout.short} · ${workout.title}`;
    $('#sheetExerciseCount').textContent = workout.exercises.length;
    $('#sheetSetCount').textContent = totalSets(workout);
    $('#sheetTime').textContent = `~${estimatedMinutes(workout)} דק׳`;

    els.sheetList.innerHTML = workout.exercises
      .map((exercise, index) => {
        const draft = store.getDraft(workout.id, exercise.id);
        const finished = finishedSetCount(draft);
        return `
          <button class="sheet-exercise-row" data-sheet-ex="${index}">
            <span class="exercise-num">${index + 1}</span>
            <span class="copy">
              <strong>${exercise.name}</strong>
              <small>${exercise.sets} סטים · ${exercise.reps} חזרות · ${fmtTime(exercise.rest)} מנוחה</small>
            </span>
            <span class="${finished === exercise.sets ? 'done' : ''}">${finished}/${exercise.sets}</span>
          </button>`;
      })
      .join('');

    $$('[data-sheet-ex]').forEach((button) => {
      button.addEventListener('click', () => startWorkout(workout, Number(button.dataset.sheetEx)));
    });

    els.backdrop.hidden = false;
    els.sheet.classList.add('open');
    els.sheet.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeSheet() {
    els.sheet.classList.remove('open', 'full');
    els.sheet.setAttribute('aria-hidden', 'true');
    els.backdrop.hidden = true;
    if (!state.workout) document.body.style.overflow = '';
  }

  let dragStart = null;
  let dragLast = null;

  els.grabber.addEventListener('pointerdown', (event) => {
    dragStart = event.clientY;
    dragLast = event.clientY;
    els.grabber.setPointerCapture?.(event.pointerId);
  });

  els.grabber.addEventListener('pointermove', (event) => {
    if (dragStart === null) return;
    dragLast = event.clientY;
  });

  function endSheetDrag() {
    if (dragStart === null || dragLast === null) return;
    const delta = dragLast - dragStart;
    if (delta < -35) {
      els.sheet.classList.add('full');
    } else if (delta > 45 && els.sheet.classList.contains('full')) {
      els.sheet.classList.remove('full');
    } else if (delta > 70) {
      closeSheet();
    }
    dragStart = null;
    dragLast = null;
  }

  els.grabber.addEventListener('pointerup', endSheetDrag);
  els.grabber.addEventListener('pointercancel', endSheetDrag);

  function buildDraft(workout, exercise) {
    const existing = store.getDraft(workout.id, exercise.id);
    if (existing && Array.isArray(existing.sets) && existing.sets.length === exercise.sets) {
      return existing;
    }

    return {
      sets: Array.from({ length: exercise.sets }, (_, index) =>
        existing?.sets?.[index] || {
          status: 'pending',
          load: '',
          reps: '',
          rir: '',
          at: null,
        },
      ),
      updatedAt: new Date().toISOString(),
    };
  }

  function firstPendingSet(draft) {
    const index = draft.sets.findIndex((set) => set.status === 'pending');
    return index >= 0 ? index : Math.max(0, draft.sets.length - 1);
  }

  function startWorkout(workout, exerciseIndex = 0) {
    closeSheet();
    stopRest(true);
    state.workout = workout;
    state.exerciseIndex = Math.min(Math.max(exerciseIndex, 0), workout.exercises.length - 1);
    state.setIndex = 0;
    state.run = {
      workoutId: workout.id,
      startedAt: new Date().toISOString(),
    };

    els.workoutView.classList.add('active');
    els.workoutView.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    renderExercise(true);
  }

  function currentExercise() {
    return state.workout.exercises[state.exerciseIndex];
  }

  function lastCompletedSet(exerciseId) {
    const previous = store.lastExerciseResult(exerciseId);
    if (!previous?.sets?.length) return null;
    const completed = previous.sets.filter((set) => set.status === 'done');
    return completed.length ? completed[completed.length - 1] : null;
  }

  function renderExercise(resetSet = false) {
    const workout = state.workout;
    const exercise = currentExercise();
    const draft = buildDraft(workout, exercise);
    store.setDraft(workout.id, exercise.id, draft);

    if (resetSet) state.setIndex = firstPendingSet(draft);
    state.setIndex = Math.min(Math.max(0, state.setIndex), exercise.sets - 1);

    $('#bigWorkoutTitle').textContent = workout.short;
    $('#exerciseIndex').textContent = `${state.exerciseIndex + 1} מתוך ${workout.exercises.length}`;
    els.title.textContent = exercise.name;
    $('#muscleChip').textContent = exercise.muscle;
    $('#targetReps').textContent = exercise.reps;
    $('#targetRest').textContent = fmtTime(exercise.rest);

    const previous = lastCompletedSet(exercise.id);
    $('#lastLoad').textContent = previous
      ? previous.load
        ? `${previous.load} ק״ג`
        : `${previous.reps || '—'} חזרות`
      : '—';

    renderSet();
    renderSelector();
    renderNext();
    closeVideo();
  }

  function renderSet() {
    const exercise = currentExercise();
    const draft = buildDraft(state.workout, exercise);
    const set = draft.sets[state.setIndex];
    const finished = finishedSetCount(draft);

    els.ringText.textContent = `${state.setIndex + 1}/${exercise.sets}`;
    els.ring.style.setProperty('--progress', `${(finished / exercise.sets) * 100}%`);

    $('#currentSetLabel').textContent = `סט ${state.setIndex + 1}`;
    $('#setStatePill').textContent =
      set.status === 'done' ? 'הושלם' : set.status === 'skipped' ? 'דולג' : 'מוכן';
    $('#setStatePill').className = `state-pill${set.status === 'done' ? ' done' : ''}`;

    els.load.value = set.load ?? '';
    els.reps.value = set.reps ?? '';
    els.rir.value = set.rir ?? '';

    const previousExercise = store.lastExerciseResult(exercise.id);
    const previousSet = previousExercise?.sets?.[state.setIndex];
    $('#previousHint').textContent = previousSet
      ? `פעם קודמת: ${previousSet.load || '—'} ק״ג · ${previousSet.reps || '—'} חזרות · RIR ${previousSet.rir ?? '—'}`
      : 'אין נתון קודם לסט הזה';
  }

  function persistInputs() {
    if (!state.workout) return;
    const exercise = currentExercise();
    const draft = buildDraft(state.workout, exercise);
    const set = draft.sets[state.setIndex];
    set.load = els.load.value;
    set.reps = els.reps.value;
    set.rir = els.rir.value;
    draft.updatedAt = new Date().toISOString();
    store.setDraft(state.workout.id, exercise.id, draft);
  }

  function completeSet(skip = false) {
    persistInputs();
    const exercise = currentExercise();
    const draft = buildDraft(state.workout, exercise);
    const set = draft.sets[state.setIndex];

    set.status = skip ? 'skipped' : 'done';
    set.at = new Date().toISOString();
    store.setDraft(state.workout.id, exercise.id, draft);
    renderSet();

    const nextPending = draft.sets.findIndex(
      (candidate, index) => index > state.setIndex && candidate.status === 'pending',
    );

    if (nextPending >= 0) {
      if (!skip) startRest(exercise.rest);
      state.setIndex = nextPending;
      setTimeout(renderSet, 180);
      return;
    }

    const isLastExercise = state.exerciseIndex >= state.workout.exercises.length - 1;
    if (isLastExercise) {
      setTimeout(finishWorkout, 220);
      return;
    }

    if (!skip) startRest(exercise.rest);
    setTimeout(advanceExercise, 260);
  }

  function advanceExercise() {
    if (!state.workout) return;
    persistInputs();

    if (state.exerciseIndex < state.workout.exercises.length - 1) {
      state.exerciseIndex += 1;
      state.setIndex = 0;
      renderExercise(true);
      els.workoutView.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    finishWorkout();
  }

  function finishWorkout() {
    if (!state.workout) return;
    persistInputs();
    const workout = state.workout;
    const exercises = workout.exercises.map((exercise) => {
      const draft = store.getDraft(workout.id, exercise.id) || buildDraft(workout, exercise);
      return {
        exerciseId: exercise.id,
        name: exercise.name,
        sets: draft.sets.map((set) => ({ ...set })),
      };
    });

    store.addSession({
      id: crypto.randomUUID?.() || String(Date.now()),
      workoutId: workout.id,
      workoutTitle: workout.title,
      short: workout.short,
      startedAt: state.run?.startedAt || new Date().toISOString(),
      completedAt: new Date().toISOString(),
      exercises,
    });

    store.clearWorkoutDrafts(workout.id);
    exitWorkout();
    renderHome();
    showToast('האימון נשמר ✓');
  }

  function exitWorkout() {
    stopRest(true);
    closeVideo();
    els.workoutView.classList.remove('active');
    els.workoutView.setAttribute('aria-hidden', 'true');
    els.selector.hidden = true;
    document.body.style.overflow = '';
    state.workout = null;
    state.run = null;
  }

  function renderSelector() {
    els.selector.innerHTML = state.workout.exercises
      .map((exercise, index) => {
        const draft = store.getDraft(state.workout.id, exercise.id);
        const finished = finishedSetCount(draft);
        return `<button data-pick="${index}" class="${index === state.exerciseIndex ? 'active' : ''}">${index + 1}. ${exercise.name} · ${finished}/${exercise.sets}</button>`;
      })
      .join('');

    $$('[data-pick]').forEach((button) => {
      button.onclick = () => {
        persistInputs();
        state.exerciseIndex = Number(button.dataset.pick);
        state.setIndex = 0;
        els.selector.hidden = true;
        renderExercise(true);
        els.workoutView.scrollTo({ top: 0, behavior: 'smooth' });
      };
    });
  }

  function renderNext() {
    const next = state.workout.exercises[state.exerciseIndex + 1];
    $('#nextExerciseName').textContent = next ? next.name : 'סיום האימון';
  }

  function openVideo() {
    const exercise = currentExercise();
    $('#videoFallback').href = exercise.video;
    els.videoPanel.hidden = false;
    $('#openVideoBtn').textContent = '↗ אפשר לפתוח את הסרטון';
  }

  function closeVideo() {
    els.videoPanel.hidden = true;
    $('#openVideoBtn').textContent = '▶ סרטון תרגיל';
  }

  function startRest(seconds) {
    stopRest(false);
    state.restEndsAt = Date.now() + seconds * 1000;
    els.restCard.hidden = false;
    tickRest();
    state.restTimer = setInterval(tickRest, 250);
  }

  function tickRest() {
    if (!state.restEndsAt) return;
    const remaining = Math.ceil((state.restEndsAt - Date.now()) / 1000);
    els.restText.textContent = fmtTime(remaining);
    if (remaining <= 0) {
      stopRest(true);
      navigator.vibrate?.([120, 60, 120]);
      showToast('המנוחה הסתיימה');
    }
  }

  function stopRest(hide = true) {
    clearInterval(state.restTimer);
    state.restTimer = null;
    if (hide) {
      state.restEndsAt = 0;
      els.restCard.hidden = true;
    }
  }

  function adjustRest(deltaSeconds) {
    if (!state.restEndsAt) return;
    state.restEndsAt += deltaSeconds * 1000;
    tickRest();
  }

  function renderHistory() {
    const sessions = [...store.get().sessions].reverse();
    $('#historyList').innerHTML = sessions.length
      ? sessions
          .map((session) => {
            const done =
              session.exercises?.reduce(
                (sum, exercise) =>
                  sum + (exercise.sets || []).filter((set) => set.status === 'done').length,
                0,
              ) || 0;
            return `<div class="history-row"><strong>${session.short || ''} · ${session.workoutTitle || session.workoutId}</strong><small>${new Date(session.completedAt).toLocaleString('he-IL')} · ${done} סטים הושלמו</small></div>`;
          })
          .join('')
      : '<div class="history-row">עדיין אין אימונים שמורים.</div>';
  }

  function renderWeights() {
    const entries = [...store.get().bodyWeight].reverse();
    $('#weightList').innerHTML = entries.length
      ? entries
          .map(
            (entry) =>
              `<div class="history-row"><strong>${Number(entry.value).toFixed(1)} ק״ג</strong><small>${new Date(entry.at).toLocaleString('he-IL')}</small></div>`,
          )
          .join('')
      : '<div class="history-row">עדיין אין מדידות.</div>';
  }

  function downloadBackup() {
    const blob = new Blob([store.exportData()], { type: 'application/json' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `ironlog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(anchor.href), 500);
  }

  $('#startNextBtn').onclick = () => openSheet(todayWorkout());
  $('#sheetStartBtn').onclick = () => startWorkout(state.sheetWorkout, 0);
  $('#closeSheet').onclick = closeSheet;
  els.backdrop.onclick = closeSheet;

  $('#exitWorkoutBtn').onclick = () => {
    persistInputs();
    if (confirm('לצאת מהאימון? הנתונים שהקלדת יישמרו כטיוטה.')) exitWorkout();
  };

  $('#exercisePickerBtn').onclick = () => {
    els.selector.hidden = !els.selector.hidden;
  };

  $('#openVideoBtn').onclick = openVideo;
  $('#closeVideoBtn').onclick = closeVideo;
  $('#completeSetBtn').onclick = () => completeSet(false);
  $('#skipSetBtn').onclick = () => completeSet(true);
  $('#nextExerciseStrip').onclick = advanceExercise;

  [els.load, els.reps, els.rir].forEach((input) => {
    input.addEventListener('input', persistInputs);
  });

  $('#minusRestBtn').onclick = () => adjustRest(-15);
  $('#plusRestBtn').onclick = () => adjustRest(15);
  $('#skipRestBtn').onclick = () => stopRest(true);

  $('#historyBtn').onclick = () => {
    renderHistory();
    switchView('history');
  };

  $('#bodyWeightBtn').onclick = () => {
    renderWeights();
    switchView('weight');
  };

  $$('[data-back]').forEach((button) => {
    button.onclick = () => switchView('home');
  });

  $('#weightForm').onsubmit = (event) => {
    event.preventDefault();
    const value = Number.parseFloat($('#weightInput').value);
    if (!Number.isFinite(value) || value < 20) return;
    store.addWeight(value);
    $('#weightInput').value = '';
    renderWeights();
    renderHome();
    showToast('המשקל נשמר');
  };

  $('#settingsBtn').onclick = () => $('#settingsDialog').showModal();
  $('#exportBtn').onclick = downloadBackup;

  $('#importInput').onchange = async (event) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      store.importData(JSON.parse(await file.text()));
      renderHome();
      showToast('הגיבוי נטען');
      $('#settingsDialog').close();
    } catch (error) {
      alert('לא ניתן לטעון את הגיבוי');
    }
  };

  $('#resetBtn').onclick = () => {
    if (!confirm('למחוק את כל היסטוריית IronLog מהמכשיר?')) return;
    store.reset();
    renderHome();
    $('#settingsDialog').close();
    showToast('הנתונים אופסו');
  };

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.restEndsAt) tickRest();
  });

  window.addEventListener('beforeunload', () => {
    if (state.workout) persistInputs();
  });

  renderHome();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
})();
