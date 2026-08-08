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

  const HEBREW_NAMES = {
    'incline-smith': 'לחיצת חזה בשיפוע בסמית',
    'chest-press-machine': 'לחיצת חזה במכונה',
    'pec-deck': 'פרפר במכונה',
    'cable-fly': 'קרוס אובר בכבלים',
    'ez-curl': 'כפיפת מרפקים במוט EZ',
    'incline-db-curl': 'כפיפת מרפקים בשיפוע',
    'hammer-curl': 'כפיפת פטיש',
    'hack-squat-heavy': 'האק סקוואט',
    'romanian-deadlift': 'דדליפט רומני',
    'leg-press-heavy': 'לחיצת רגליים',
    'bulgarian-split': 'סקוואט בולגרי',
    'leg-curl': 'כפיפת ברך',
    'standing-calf': 'הרמת עקבים בעמידה',
    'hanging-leg-raise': 'הרמת רגליים בתלייה',
    'cable-crunch': 'כפיפות בטן בכבל',
    'pullups': 'מתח',
    'chest-supported-row': 'חתירה עם תמיכת חזה',
    'lat-pulldown': 'משיכת פולי עליון',
    'seated-cable-row': 'חתירה בכבל בישיבה',
    'face-pull': 'פייס פול',
    'rope-pushdown': 'פשיטת מרפקים בחבל',
    'overhead-cable-ext': 'פשיטת מרפקים מעל הראש',
    'machine-dips': 'מקבילים במכונה',
    'shoulder-press-machine': 'לחיצת כתפיים במכונה',
    'cable-lateral-raise': 'הרחקת כתף בכבל',
    'rear-delt-fly': 'פרפר כתף אחורית',
    'incline-chest-machine': 'לחיצת חזה עליון במכונה',
    'cable-fly-b': 'קרוס אובר בכבלים',
    'hack-squat-volume': 'האק סקוואט',
    'leg-press-volume': 'לחיצת רגליים',
    'leg-extension': 'פשיטת ברך',
    'seated-leg-curl': 'כפיפת ברך בישיבה',
    'walking-lunges': 'לאנג׳ים בהליכה',
    'seated-calf': 'הרמת עקבים בישיבה',
    'ab-wheel': 'גלגל בטן',
    'plank': 'פלאנק',
    'barbell-curl': 'כפיפת מרפקים במוט',
    'preacher-curl': 'כפיפת מרפקים בכיסא כומר',
    'cable-curl': 'כפיפת מרפקים בכבל',
    'skull-crushers': 'סקאל קראשר במוט EZ',
    'rope-pushdown-b': 'פשיטת מרפקים בחבל',
    'overhead-cable-ext-b': 'פשיטת מרפקים מעל הראש',
    'lateral-raise': 'הרחקת כתפיים',
    'rear-delt-machine': 'כתף אחורית במכונה',
  };

  const state = {
    workout: null,
    exerciseIndex: 0,
    setIndex: 0,
    run: null,
    sheetWorkout: null,
    restEndsAt: 0,
    restTimer: null,
    selectedStrengthExercise: null,
  };

  const els = {
    home: $('#homeView'),
    progress: $('#progressView'),
    grid: $('#workoutGrid'),
    sheet: $('#workoutSheet'),
    backdrop: $('#sheetBackdrop'),
    sheetList: $('#sheetExerciseList'),
    grabber: $('#sheetGrabber'),
    workoutView: $('#workoutView'),
    workoutContent: $('#workoutContent'),
    selector: $('#exerciseSelector'),
    title: $('#exerciseTitle'),
    ring: $('#setRing'),
    ringText: $('#setRingText'),
    load: $('#loadInput'),
    reps: $('#repsInput'),
    rir: $('#rirInput'),
    restText: $('#restTimerText'),
    restMetric: $('#restMetric'),
    restControls: $('#restControls'),
    videoPanel: $('#videoPanel'),
    toast: $('#toast'),
    anatomy: $('#anatomyFigure'),
  };

  function safeNumber(value) {
    const number = Number.parseFloat(value);
    return Number.isFinite(number) ? number : 0;
  }

  function fmtTime(seconds) {
    const value = Math.max(0, Math.round(Number(seconds) || 0));
    const minutes = Math.floor(value / 60);
    const secs = value % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function fmtCompact(value) {
    const number = Number(value) || 0;
    if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
    if (number >= 1000) return `${(number / 1000).toFixed(number >= 10000 ? 0 : 1)}K`;
    return Math.round(number).toLocaleString('he-IL');
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

  function exerciseName(exercise) {
    return HEBREW_NAMES[exercise.id] || exercise.name;
  }

  function weekStart(dateLike) {
    const date = new Date(dateLike);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    const delta = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + delta);
    return date;
  }

  function weekKey(dateLike) {
    return weekStart(dateLike).toISOString().slice(0, 10);
  }

  function sessionVolume(session) {
    return (session.exercises || []).reduce(
      (sum, exercise) =>
        sum +
        (exercise.sets || []).reduce((setSum, set) => {
          if (set.status !== 'done') return setSum;
          return setSum + safeNumber(set.load) * safeNumber(set.reps);
        }, 0),
      0,
    );
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      els.toast.hidden = true;
    }, 2200);
  }

  function setActiveNav(name) {
    $$('.nav-btn').forEach((button) => button.classList.toggle('active', button.dataset.nav === name));
  }

  function switchView(name) {
    [els.home, els.progress].forEach((view) => view.classList.remove('active', 'view-enter'));
    const target = name === 'progress' ? els.progress : els.home;
    target.classList.add('active');
    requestAnimationFrame(() => target.classList.add('view-enter'));
    setActiveNav(name === 'progress' ? 'progress' : 'home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function currentWeekSessions(saved = store.get()) {
    const key = weekKey(new Date());
    return saved.sessions.filter((session) => weekKey(session.completedAt || session.startedAt) === key);
  }

  function renderHome() {
    const saved = store.get();
    const next = todayWorkout();
    const weekSessions = currentWeekSessions(saved);
    const weekVolume = weekSessions.reduce((sum, session) => sum + sessionVolume(session), 0);

    $('#nextWorkoutTitle').textContent = `${next.short} · ${next.title}`;
    $('#nextWorkoutMeta').textContent = `${next.exercises.length} תרגילים · ${totalSets(next)} סטים · ~${estimatedMinutes(next)} דק׳`;
    $('#todaySummary').textContent = new Intl.DateTimeFormat('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());
    $('#homeWeekSessions').textContent = weekSessions.length;
    $('#homeWeekVolume').textContent = fmtCompact(weekVolume);

    els.grid.innerHTML = program
      .map(
        (workout, index) => `
          <button class="workout-card reveal-card" data-workout="${index}" style="--delay:${index * 45}ms">
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
    if (!workout) return;
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
              <strong>${exerciseName(exercise)}</strong>
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
    if (delta < -35) els.sheet.classList.add('full');
    else if (delta > 45 && els.sheet.classList.contains('full')) els.sheet.classList.remove('full');
    else if (delta > 70) closeSheet();
    dragStart = null;
    dragLast = null;
  }

  els.grabber.addEventListener('pointerup', endSheetDrag);
  els.grabber.addEventListener('pointercancel', endSheetDrag);

  function buildDraft(workout, exercise) {
    const existing = store.getDraft(workout.id, exercise.id);
    if (existing && Array.isArray(existing.sets) && existing.sets.length === exercise.sets) return existing;
    return {
      sets: Array.from({ length: exercise.sets }, (_, index) =>
        existing?.sets?.[index] || { status: 'pending', load: '', reps: '', rir: '', at: null },
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
    state.run = { workoutId: workout.id, startedAt: new Date().toISOString() };
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

  function anatomyZone(exercise) {
    const muscle = exercise.muscle || '';
    if (muscle.includes('תאומים')) return 'calves';
    if (muscle.includes('המסטרינג')) return 'hamstrings';
    if (muscle.includes('ארבע') || muscle.includes('רגליים')) return 'quads';
    if (muscle.includes('ישבן')) return 'glutes';
    if (muscle.includes('יד קדמית')) return 'biceps';
    if (muscle.includes('יד אחורית')) return 'triceps';
    if (muscle.includes('כתף')) return 'shoulders';
    if (muscle.includes('חזה')) return 'chest';
    if (muscle.includes('גב') || muscle.includes('רחב')) return 'back';
    if (muscle.includes('בטן') || muscle.includes('ליבה')) return 'abs';
    return 'generic';
  }

  function muscleEnglish(zone) {
    return {
      calves: 'Gastrocnemius / Soleus', hamstrings: 'Hamstrings', quads: 'Quadriceps', glutes: 'Gluteals',
      biceps: 'Biceps', triceps: 'Triceps', shoulders: 'Deltoids', chest: 'Pectorals', back: 'Back', abs: 'Core', generic: 'Target muscle',
    }[zone];
  }

  function setAnatomy(exercise) {
    const zone = anatomyZone(exercise);
    els.anatomy.className.baseVal = `anatomy-figure zone-${zone}`;
    $('#muscleEnglish').textContent = muscleEnglish(zone);
  }

  function animateExercise() {
    els.workoutContent.classList.remove('exercise-enter');
    void els.workoutContent.offsetWidth;
    els.workoutContent.classList.add('exercise-enter');
  }

  function renderExercise(resetSet = false) {
    const workout = state.workout;
    const exercise = currentExercise();
    const draft = buildDraft(workout, exercise);
    store.setDraft(workout.id, exercise.id, draft);

    if (resetSet) state.setIndex = firstPendingSet(draft);
    state.setIndex = Math.min(Math.max(0, state.setIndex), exercise.sets - 1);

    $('#bigWorkoutTitle').textContent = workout.short;
    $('#exerciseIndex').textContent = `תרגיל ${state.exerciseIndex + 1} מתוך ${workout.exercises.length}`;
    els.title.textContent = exerciseName(exercise);
    $('#muscleChip').textContent = exercise.muscle;
    $('#targetReps').textContent = exercise.reps;

    const previous = lastCompletedSet(exercise.id);
    $('#lastLoad').textContent = previous?.load ? Number(previous.load).toLocaleString('he-IL') : '—';
    setAnatomy(exercise);
    renderSet();
    renderSelector();
    renderNext();
    closeVideo();
    if (!state.restEndsAt) setRestIdle(exercise.rest);
    animateExercise();
  }

  function renderSet() {
    const exercise = currentExercise();
    const draft = buildDraft(state.workout, exercise);
    const set = draft.sets[state.setIndex];
    const finished = finishedSetCount(draft);

    els.ringText.textContent = `${state.setIndex + 1}/${exercise.sets}`;
    els.ring.style.setProperty('--progress', `${(finished / exercise.sets) * 100}%`);
    $('#setProgressCaption').textContent = `מתוך ${exercise.sets} סטים`;
    $('#currentSetLabel').textContent = `סט ${state.setIndex + 1}`;
    $('#setStatePill').textContent = set.status === 'done' ? 'הושלם' : set.status === 'skipped' ? 'דולג' : 'מוכן';
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
    navigator.vibrate?.(skip ? 30 : 45);

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
      setTimeout(finishWorkout, 240);
      return;
    }

    if (!skip) startRest(exercise.rest);
    setTimeout(advanceExercise, 280);
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
      return { exerciseId: exercise.id, name: exercise.name, sets: draft.sets.map((set) => ({ ...set })) };
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
    renderProgress();
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
        return `<button data-pick="${index}" class="${index === state.exerciseIndex ? 'active' : ''}">${index + 1}. ${exerciseName(exercise)} · ${finished}/${exercise.sets}</button>`;
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
    $('#nextExerciseName').textContent = next ? exerciseName(next) : 'סיום האימון';
    $('#workoutNextBtn').disabled = !next;
  }

  function openVideo() {
    const exercise = currentExercise();
    $('#videoFallback').href = exercise.video;
    els.videoPanel.hidden = false;
    $('#openVideoBtn').classList.add('active');
  }

  function closeVideo() {
    els.videoPanel.hidden = true;
    $('#openVideoBtn').classList.remove('active');
  }

  function setRestIdle(seconds) {
    els.restText.textContent = fmtTime(seconds);
    $('#restMetricLabel').textContent = 'מנוחה';
    els.restMetric.classList.remove('active');
    els.restControls.hidden = true;
  }

  function startRest(seconds) {
    stopRest(false);
    state.restEndsAt = Date.now() + seconds * 1000;
    $('#restMetricLabel').textContent = 'מנוחה פעילה';
    els.restMetric.classList.add('active');
    els.restControls.hidden = false;
    tickRest();
    state.restTimer = setInterval(tickRest, 250);
  }

  function tickRest() {
    if (!state.restEndsAt) return;
    const remaining = Math.ceil((state.restEndsAt - Date.now()) / 1000);
    els.restText.textContent = fmtTime(remaining);
    if (remaining <= 0) {
      navigator.vibrate?.([120, 60, 120]);
      showToast('המנוחה הסתיימה');
      const rest = state.workout ? currentExercise().rest : 0;
      stopRest(true);
      setRestIdle(rest);
    }
  }

  function stopRest(hide = true) {
    clearInterval(state.restTimer);
    state.restTimer = null;
    if (hide) {
      state.restEndsAt = 0;
      els.restMetric.classList.remove('active');
      els.restControls.hidden = true;
    }
  }

  function adjustRest(deltaSeconds) {
    if (!state.restEndsAt) return;
    state.restEndsAt += deltaSeconds * 1000;
    tickRest();
  }

  function lastWeeks(count) {
    const current = weekStart(new Date());
    return Array.from({ length: count }, (_, reverseIndex) => {
      const offset = count - 1 - reverseIndex;
      const date = new Date(current);
      date.setDate(date.getDate() - offset * 7);
      return date;
    });
  }

  function weeklySeries(sessions, count = 8) {
    const weeks = lastWeeks(count);
    return weeks.map((week) => {
      const key = weekKey(week);
      const items = sessions.filter((session) => weekKey(session.completedAt || session.startedAt) === key);
      return {
        date: week,
        label: `${week.getDate()}/${week.getMonth() + 1}`,
        sessions: items.length,
        volume: items.reduce((sum, session) => sum + sessionVolume(session), 0),
      };
    });
  }

  function emptyChart(message) {
    return `<div class="empty-chart"><span>⌁</span><strong>${message}</strong><small>הגרף יתעדכן אוטומטית אחרי שתשמור אימונים.</small></div>`;
  }

  function lineChart(values, labels, valueFormatter = (value) => Math.round(value)) {
    if (!values.length || values.every((value) => !value)) return emptyChart('עדיין אין מספיק נתונים');
    const width = 680;
    const height = 230;
    const left = 42;
    const right = 18;
    const top = 18;
    const bottom = 40;
    const innerW = width - left - right;
    const innerH = height - top - bottom;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = Math.max(1, max - min);
    const points = values.map((value, index) => {
      const x = left + (values.length === 1 ? innerW / 2 : (index / (values.length - 1)) * innerW);
      const y = top + ((max - value) / range) * innerH;
      return { x, y, value };
    });
    const polyline = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
    const grid = [0, 0.5, 1].map((ratio) => `<line x1="${left}" y1="${top + ratio * innerH}" x2="${width - right}" y2="${top + ratio * innerH}" class="chart-grid-line"/>`).join('');
    const dots = points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="4" class="chart-dot"><title>${valueFormatter(point.value)}</title></circle>`).join('');
    const xLabels = labels.map((label, index) => {
      const x = left + (labels.length === 1 ? innerW / 2 : (index / (labels.length - 1)) * innerW);
      return `<text x="${x}" y="${height - 12}" text-anchor="middle" class="chart-axis-label">${label}</text>`;
    }).join('');
    return `<svg class="line-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">${grid}<polyline points="${polyline}" class="chart-line"/>${dots}${xLabels}<text x="${left}" y="14" class="chart-value-label">${valueFormatter(max)}</text></svg>`;
  }

  function barChart(values, labels) {
    if (!values.length || values.every((value) => !value)) return emptyChart('עדיין אין מספיק נתונים');
    const width = 680;
    const height = 230;
    const left = 26;
    const right = 16;
    const top = 18;
    const bottom = 40;
    const innerW = width - left - right;
    const innerH = height - top - bottom;
    const max = Math.max(...values, 1);
    const gap = 10;
    const barW = Math.max(18, (innerW - gap * (values.length - 1)) / values.length);
    const bars = values.map((value, index) => {
      const h = (value / max) * innerH;
      const x = left + index * (barW + gap);
      const y = top + innerH - h;
      return `<g class="chart-bar-group"><rect x="${x}" y="${y}" width="${barW}" height="${Math.max(3, h)}" rx="8" class="chart-bar"><title>${value} אימונים</title></rect><text x="${x + barW / 2}" y="${height - 12}" text-anchor="middle" class="chart-axis-label">${labels[index]}</text></g>`;
    }).join('');
    return `<svg class="bar-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">${bars}</svg>`;
  }

  function primaryMuscle(exercise) {
    const muscle = exercise.muscle || '';
    if (muscle.includes('חזה')) return 'חזה';
    if (muscle.includes('גב') || muscle.includes('רחב')) return 'גב';
    if (muscle.includes('כתף')) return 'כתפיים';
    if (muscle.includes('יד קדמית')) return 'יד קדמית';
    if (muscle.includes('יד אחורית')) return 'יד אחורית';
    if (muscle.includes('תאומים')) return 'תאומים';
    if (muscle.includes('המסטרינג')) return 'המסטרינג';
    if (muscle.includes('ארבע') || muscle.includes('רגליים')) return 'ארבע ראשי';
    if (muscle.includes('ישבן')) return 'ישבן';
    if (muscle.includes('בטן') || muscle.includes('ליבה')) return 'בטן';
    return null;
  }

  function exerciseLookup() {
    const map = new Map();
    program.forEach((workout) => workout.exercises.forEach((exercise) => map.set(exercise.id, exercise)));
    return map;
  }

  function renderMuscleVolume(saved) {
    const lookup = exerciseLookup();
    const start = weekStart(new Date()).getTime();
    const counts = new Map();
    saved.sessions
      .filter((session) => new Date(session.completedAt || session.startedAt).getTime() >= start)
      .forEach((session) => {
        (session.exercises || []).forEach((loggedExercise) => {
          const exercise = lookup.get(loggedExercise.exerciseId);
          const muscle = exercise ? primaryMuscle(exercise) : null;
          if (!muscle) return;
          const done = (loggedExercise.sets || []).filter((set) => set.status === 'done').length;
          counts.set(muscle, (counts.get(muscle) || 0) + done);
        });
      });

    const order = ['חזה', 'גב', 'כתפיים', 'יד קדמית', 'יד אחורית', 'ארבע ראשי', 'המסטרינג', 'ישבן', 'תאומים', 'בטן'];
    const rows = order.filter((name) => counts.has(name)).map((name) => [name, counts.get(name)]);
    if (!rows.length) {
      $('#muscleVolumeBars').innerHTML = emptyChart('אין עדיין סטים שנשמרו השבוע');
      return;
    }

    $('#muscleVolumeBars').innerHTML = rows.map(([name, count]) => {
      const pct = Math.min(100, (count / 20) * 100);
      return `<div class="muscle-row"><div class="muscle-row-head"><strong>${name}</strong><span>${count} סטים</span></div><div class="muscle-track"><i style="width:${pct}%"></i><b title="יעד כללי: 10 סטים"></b></div></div>`;
    }).join('');
  }

  function populateStrengthSelect() {
    const select = $('#strengthExerciseSelect');
    const options = [];
    program.forEach((workout) => workout.exercises.forEach((exercise) => options.push(exercise)));
    if (!state.selectedStrengthExercise) state.selectedStrengthExercise = options[0]?.id || null;
    select.innerHTML = options.map((exercise) => `<option value="${exercise.id}" ${exercise.id === state.selectedStrengthExercise ? 'selected' : ''}>${exerciseName(exercise)}</option>`).join('');
  }

  function renderStrengthChart(saved) {
    const exerciseId = state.selectedStrengthExercise;
    const sessions = saved.sessions.slice(-30);
    const points = [];
    sessions.forEach((session) => {
      const exercise = (session.exercises || []).find((item) => item.exerciseId === exerciseId);
      if (!exercise) return;
      const estimates = (exercise.sets || [])
        .filter((set) => set.status === 'done')
        .map((set) => ({ load: safeNumber(set.load), reps: safeNumber(set.reps) }))
        .filter(({ load, reps }) => load > 0 && reps >= 1 && reps <= 12)
        .map(({ load, reps }) => load * (1 + reps / 30));
      if (!estimates.length) return;
      points.push({ value: Math.max(...estimates), date: new Date(session.completedAt || session.startedAt) });
    });
    $('#strengthChart').innerHTML = points.length
      ? lineChart(points.map((point) => point.value), points.map((point) => `${point.date.getDate()}/${point.date.getMonth() + 1}`), (value) => `${value.toFixed(1)} ק״ג`)
      : emptyChart('אין עדיין סטים מתאימים לחישוב e1RM');
  }

  function renderHistory(saved) {
    const sessions = [...saved.sessions].reverse().slice(0, 12);
    $('#historyList').innerHTML = sessions.length
      ? sessions.map((session) => {
          const done = (session.exercises || []).reduce((sum, exercise) => sum + (exercise.sets || []).filter((set) => set.status === 'done').length, 0);
          const volume = sessionVolume(session);
          return `<div class="history-row"><div><strong>${session.short || ''} · ${session.workoutTitle || session.workoutId}</strong><small>${new Date(session.completedAt).toLocaleString('he-IL')}</small></div><div class="history-metrics"><span>${done} סטים</span><span>${fmtCompact(volume)} נפח</span></div></div>`;
        }).join('')
      : '<div class="history-row empty-history">עדיין אין אימונים שמורים.</div>';
  }

  function renderProgress() {
    const saved = store.get();
    const weeks = weeklySeries(saved.sessions, 8);
    const current = weeks[weeks.length - 1] || { sessions: 0, volume: 0 };
    const previous = weeks[weeks.length - 2] || { sessions: 0 };
    const four = weeks.slice(-4);
    const average = four.length ? four.reduce((sum, item) => sum + item.sessions, 0) / four.length : 0;

    $('#weekSessionCount').textContent = current.sessions;
    $('#weekVolumeTotal').textContent = fmtCompact(current.volume);
    $('#fourWeekAverage').textContent = average.toFixed(1);
    const delta = current.sessions - previous.sessions;
    $('#weekSessionDelta').textContent = delta === 0 ? 'כמו בשבוע הקודם' : delta > 0 ? `+${delta} מהשבוע הקודם` : `${delta} מהשבוע הקודם`;
    $('#workoutCount').textContent = `${saved.sessions.length} אימונים`;

    $('#weeklySessionsChart').innerHTML = barChart(weeks.map((item) => item.sessions), weeks.map((item) => item.label));
    $('#weeklyVolumeChart').innerHTML = lineChart(weeks.map((item) => item.volume), weeks.map((item) => item.label), (value) => fmtCompact(value));
    renderMuscleVolume(saved);
    populateStrengthSelect();
    renderStrengthChart(saved);

    const weights = saved.bodyWeight.slice(-12);
    const lastWeight = weights[weights.length - 1];
    $('#latestWeight').textContent = lastWeight ? `${Number(lastWeight.value).toFixed(1)} ק״ג` : '—';
    $('#weightChart').innerHTML = weights.length
      ? lineChart(weights.map((item) => Number(item.value)), weights.map((item) => {
          const date = new Date(item.at);
          return `${date.getDate()}/${date.getMonth() + 1}`;
        }), (value) => `${Number(value).toFixed(1)} ק״ג`)
      : emptyChart('עדיין אין מדידות משקל');
    renderHistory(saved);
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
  $('#homeProgressBtn').onclick = () => { renderProgress(); switchView('progress'); };
  $('#sheetStartBtn').onclick = () => startWorkout(state.sheetWorkout, 0);
  $('#closeSheet').onclick = closeSheet;
  els.backdrop.onclick = closeSheet;

  $('#exitWorkoutBtn').onclick = () => {
    persistInputs();
    if (confirm('לצאת מהאימון? הנתונים שהקלדת יישמרו כטיוטה.')) exitWorkout();
  };
  $('#workoutNextBtn').onclick = advanceExercise;
  $('#exercisePickerBtn').onclick = () => { els.selector.hidden = !els.selector.hidden; };
  $('#openVideoBtn').onclick = openVideo;
  $('#closeVideoBtn').onclick = closeVideo;
  $('#completeSetBtn').onclick = () => completeSet(false);
  $('#skipSetBtn').onclick = () => completeSet(true);
  $('#nextExerciseStrip').onclick = advanceExercise;

  [els.load, els.reps, els.rir].forEach((input) => input.addEventListener('input', persistInputs));
  $('#minusRestBtn').onclick = () => adjustRest(-15);
  $('#plusRestBtn').onclick = () => adjustRest(15);
  $('#skipRestBtn').onclick = () => {
    const rest = state.workout ? currentExercise().rest : 0;
    stopRest(true);
    setRestIdle(rest);
  };

  $('#settingsBtn').onclick = () => $('#settingsDialog').showModal();
  $('#exportBtn').onclick = downloadBackup;
  $('#addWeightBtn').onclick = () => $('#weightDialog').showModal();

  $('#weightForm').onsubmit = (event) => {
    event.preventDefault();
    const value = Number.parseFloat($('#weightInput').value);
    if (!Number.isFinite(value) || value < 20) return;
    store.addWeight(value);
    $('#weightInput').value = '';
    $('#weightDialog').close();
    renderProgress();
    renderHome();
    showToast('המשקל נשמר');
  };

  $('#importInput').onchange = async (event) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      store.importData(JSON.parse(await file.text()));
      renderHome();
      renderProgress();
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
    renderProgress();
    $('#settingsDialog').close();
    showToast('הנתונים אופסו');
  };

  $('#strengthExerciseSelect').onchange = (event) => {
    state.selectedStrengthExercise = event.target.value;
    renderStrengthChart(store.get());
  };

  $$('.nav-btn').forEach((button) => {
    button.onclick = () => {
      const nav = button.dataset.nav;
      if (nav === 'home') switchView('home');
      else if (nav === 'progress') { renderProgress(); switchView('progress'); }
      else if (nav === 'workout') {
        if (state.workout) return;
        openSheet(todayWorkout());
      } else if (nav === 'settings') $('#settingsDialog').showModal();
    };
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.restEndsAt) tickRest();
  });

  window.addEventListener('beforeunload', () => {
    if (state.workout) persistInputs();
  });

  renderHome();
  renderProgress();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
})();
