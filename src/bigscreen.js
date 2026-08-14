(() => {
  'use strict';

  const program = window.IRONLOG_PROGRAM || [];
  const q = (s) => document.querySelector(s);

  const ASSETS = Object.freeze({
    chest: '/assets/workout-images/muscle-groups/chest.png',
    biceps: '/assets/workout-images/muscle-groups/biceps.png',
    triceps: '/assets/workout-images/muscle-groups/triceps.png',
    shoulders: '/assets/workout-images/muscle-groups/shoulders.png',
    back: '/assets/workout-images/muscle-groups/back.png',
    abs: '/assets/workout-images/muscle-groups/abs-core.png',
    quads: '/assets/workout-images/muscle-groups/quadriceps.png',
    hamstrings: '/assets/workout-images/muscle-groups/hamstrings.png',
    glutes: '/assets/workout-images/muscle-groups/glutes.png',
    calves: '/assets/workout-images/muscle-groups/calves.png',
  });

  const META = Object.freeze({
    chest: { he: 'שרירי החזה', en: 'Pectoralis major' },
    biceps: { he: 'שריר הזרוע הדו־ראשי', en: 'Biceps brachii' },
    triceps: { he: 'שריר הזרוע התלת־ראשי', en: 'Triceps brachii' },
    shoulders: { he: 'שריר הדלתא', en: 'Deltoid' },
    back: { he: 'שרירי הגב', en: 'Latissimus dorsi / Upper back' },
    abs: { he: 'שרירי הבטן והליבה', en: 'Abdominals / Core' },
    quads: { he: 'השריר הארבע־ראשי', en: 'Quadriceps' },
    hamstrings: { he: 'שרירי הירך האחוריים', en: 'Hamstrings' },
    glutes: { he: 'שרירי העכוז', en: 'Gluteals' },
    calves: { he: 'שרירי התאומים', en: 'Gastrocnemius / Soleus' },
  });

  const EXERCISE_MUSCLE = Object.freeze({
    'incline-smith': 'chest',
    'chest-press-machine': 'chest',
    'pec-deck': 'chest',
    'cable-fly': 'chest',
    'ez-curl': 'biceps',
    'incline-db-curl': 'biceps',
    'hammer-curl': 'biceps',

    'hack-squat-heavy': 'quads',
    'romanian-deadlift': 'hamstrings',
    'leg-press-heavy': 'quads',
    'bulgarian-split': 'quads',
    'leg-curl': 'hamstrings',
    'standing-calf': 'calves',
    'hanging-leg-raise': 'abs',
    'cable-crunch': 'abs',

    'pullups': 'back',
    'chest-supported-row': 'back',
    'lat-pulldown': 'back',
    'seated-cable-row': 'back',
    'face-pull': 'shoulders',
    'rope-pushdown': 'triceps',
    'overhead-cable-ext': 'triceps',
    'machine-dips': 'triceps',

    'shoulder-press-machine': 'shoulders',
    'cable-lateral-raise': 'shoulders',
    'rear-delt-fly': 'shoulders',
    'incline-chest-machine': 'chest',
    'cable-fly-b': 'chest',

    'hack-squat-volume': 'quads',
    'leg-press-volume': 'quads',
    'leg-extension': 'quads',
    'seated-leg-curl': 'hamstrings',
    'walking-lunges': 'quads',
    'seated-calf': 'calves',
    'ab-wheel': 'abs',
    'plank': 'abs',

    'barbell-curl': 'biceps',
    'preacher-curl': 'biceps',
    'cable-curl': 'biceps',
    'skull-crushers': 'triceps',
    'rope-pushdown-b': 'triceps',
    'overhead-cable-ext-b': 'triceps',
    'lateral-raise': 'shoulders',
    'rear-delt-machine': 'shoulders',
  });

  const workoutView = q('#workoutView');
  const workoutName = q('#bigWorkoutTitle');
  const exerciseIndex = q('#exerciseIndex');
  const exerciseTitle = q('#exerciseTitle');
  const ring = q('#setRing');
  const ringText = q('#setRingText');
  const anatomyImage = q('#anatomyImage');
  const previewImage = q('#musclePreviewImage');
  const muscleCard = q('.muscle-target-card');
  const muscleChip = q('#muscleChip');
  const muscleEnglish = q('#muscleEnglish');
  const nextThumb = q('#nextExerciseThumb');
  const completeBtn = q('#completeSetBtn');
  const editor = q('.big-entry');
  const cancelEditorBtn = q('#cancelSetEditorBtn');
  const saveEditorBtn = q('#saveSetEditorBtn');
  const restMetric = q('#restMetric');
  const restControls = q('#restControls');
  const videoPanel = q('#videoPanel');

  if (!workoutView || !workoutName || !exerciseIndex || !exerciseTitle || !ring || !ringText || !anatomyImage) {
    return;
  }

  function inferMuscle(exercise) {
    if (!exercise) return 'biceps';
    if (EXERCISE_MUSCLE[exercise.id]) return EXERCISE_MUSCLE[exercise.id];
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
    return 'biceps';
  }

  function currentContext() {
    const short = workoutName.textContent.trim();
    const workout = program.find((item) => item.short === short);
    const match = exerciseIndex.textContent.match(/תרגיל\s+(\d+)/);
    const index = Math.max(0, Number(match?.[1] || 1) - 1);
    return { workout, index, exercise: workout?.exercises?.[index] || null };
  }

  function setImage(img, src) {
    if (!img || !src || img.getAttribute('src') === src) return;
    img.classList.add('is-changing');
    const preload = new Image();
    preload.onload = () => {
      img.src = src;
      requestAnimationFrame(() => img.classList.remove('is-changing'));
    };
    preload.onerror = () => img.classList.remove('is-changing');
    preload.src = src;
  }

  function updateExercisePill() {
    const text = exerciseIndex.textContent;
    const match = text.match(/^(.*?)(\d+)(\s+מתוך\s+\d+)$/);
    if (!match || exerciseIndex.querySelector('.exercise-current')) return;
    exerciseIndex.innerHTML = `${match[1]}<span class="exercise-current">${match[2]}</span>${match[3]}`;
  }

  function updateTitleSizing() {
    const length = exerciseTitle.textContent.trim().length;
    exerciseTitle.classList.toggle('is-long', length > 20 && length <= 27);
    exerciseTitle.classList.toggle('is-very-long', length > 27);
  }

  function updateRing() {
    const match = ringText.textContent.trim().match(/(\d+)\s*\/\s*(\d+)/);
    if (!match) return;
    const current = Number(match[1]);
    const total = Math.max(1, Number(match[2]));
    ring.style.setProperty('--progress', `${Math.max(0, Math.min(100, (current / total) * 100))}%`);
  }

  function renderAnatomy() {
    const { workout, index, exercise } = currentContext();
    if (!exercise) return;

    const key = inferMuscle(exercise);
    const meta = META[key] || META.biceps;
    workoutView.dataset.muscle = key;
    muscleCard.dataset.muscle = key;

    setImage(anatomyImage, ASSETS[key]);
    setImage(previewImage, ASSETS[key]);
    anatomyImage.alt = `${meta.he} מודגשים`;
    previewImage.alt = `${meta.he} מודגשים`;

    muscleChip.textContent = meta.he;
    muscleEnglish.textContent = meta.en;

    const next = workout?.exercises?.[index + 1];
    const nextKey = next ? inferMuscle(next) : key;
    setImage(nextThumb, ASSETS[nextKey]);
    nextThumb.alt = next ? `השריר בתרגיל הבא: ${META[nextKey]?.he || ''}` : 'סיום האימון';

    if (next) {
      const preload = new Image();
      preload.src = ASSETS[nextKey];
    }

    updateExercisePill();
    updateTitleSizing();
    updateRing();
  }

  const ICONS = {
    timer: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v5l3 2M9 2h6M12 5V2"/></svg>',
    reps: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 7h6M9 17h6"/></svg>',
    load: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 13h3l2-6 4 12 3-9 2 6h6"/></svg>',
  };
  document.querySelectorAll('#workoutView [data-icon]').forEach((el) => {
    const icon = ICONS[el.dataset.icon];
    if (icon) el.innerHTML = icon;
  });

  const observer = new MutationObserver(() => {
    if (!workoutView.classList.contains('active')) return;
    queueMicrotask(renderAnatomy);
  });
  [workoutName, exerciseIndex, exerciseTitle, ringText].forEach((el) => {
    observer.observe(el, { childList: true, subtree: true, characterData: true });
  });
  observer.observe(workoutView, { attributes: true, attributeFilter: ['class'] });

  let editorBackdrop = null;
  let appCompleteHandler = completeBtn?.onclick || null;

  function ensureEditorBackdrop() {
    if (editorBackdrop) return editorBackdrop;
    editorBackdrop = document.createElement('div');
    editorBackdrop.className = 'bs-editor-backdrop';
    editorBackdrop.hidden = true;
    editorBackdrop.addEventListener('click', closeEditor);
    document.body.appendChild(editorBackdrop);
    return editorBackdrop;
  }

  function openEditor() {
    if (!editor) return;
    ensureEditorBackdrop().hidden = false;
    editor.classList.add('is-open');
    editor.setAttribute('aria-hidden', 'false');
    const load = q('#loadInput');
    setTimeout(() => load?.focus({ preventScroll: true }), 90);
  }

  function closeEditor() {
    editor?.classList.remove('is-open');
    editor?.setAttribute('aria-hidden', 'true');
    if (editorBackdrop) editorBackdrop.hidden = true;
  }

  if (completeBtn) {
    appCompleteHandler = completeBtn.onclick;
    completeBtn.onclick = null;
    completeBtn.addEventListener('click', (event) => {
      event.preventDefault();
      openEditor();
    });
  }

  cancelEditorBtn?.addEventListener('click', closeEditor);
  saveEditorBtn?.addEventListener('click', () => {
    closeEditor();
    if (typeof appCompleteHandler === 'function') appCompleteHandler.call(completeBtn);
  });

  let manualRestOpen = false;
  let restGuard = false;

  const restObserver = new MutationObserver(() => {
    if (restGuard) return;
    if (restControls.hidden) {
      manualRestOpen = false;
      return;
    }
    if (!manualRestOpen) {
      restGuard = true;
      restControls.hidden = true;
      restGuard = false;
    }
  });

  if (restControls) restObserver.observe(restControls, { attributes: true, attributeFilter: ['hidden'] });

  restMetric?.addEventListener('click', () => {
    if (!restMetric.classList.contains('active') || !restControls) return;
    manualRestOpen = !manualRestOpen;
    restGuard = true;
    restControls.hidden = !manualRestOpen;
    restGuard = false;
  });

  document.addEventListener('click', (event) => {
    if (!manualRestOpen || !restControls || restControls.hidden) return;
    if (restControls.contains(event.target) || restMetric?.contains(event.target)) return;
    manualRestOpen = false;
    restGuard = true;
    restControls.hidden = true;
    restGuard = false;
  }, true);

  const videoObserver = new MutationObserver(() => {
    let backdrop = document.querySelector('.bs-modal-backdrop');
    if (videoPanel && !videoPanel.hidden) {
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'bs-modal-backdrop';
        backdrop.addEventListener('click', () => q('#closeVideoBtn')?.click());
        document.body.appendChild(backdrop);
      }
      backdrop.hidden = false;
    } else if (backdrop) {
      backdrop.hidden = true;
    }
  });
  if (videoPanel) videoObserver.observe(videoPanel, { attributes: true, attributeFilter: ['hidden'] });

  renderAnatomy();
})();
