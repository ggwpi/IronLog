/*
 * iOS Safari may pan the layout viewport to keep a focused workout input above
 * the software keyboard, then leave that pan in place after the keyboard closes.
 * Keep the active-workout screen anchored where it was before editing without
 * interfering with the keyboard while it is open.
 */

let editState = null;
let restoreTimers = [];

const viewport = window.visualViewport;

function workoutField(element) {
  return element instanceof HTMLElement
    && element.matches('input, textarea, [contenteditable="true"]')
    && Boolean(element.closest('.active-workout-page'));
}

function clearRestoreTimers() {
  restoreTimers.forEach((timer) => window.clearTimeout(timer));
  restoreTimers = [];
}

function captureScrollState(target) {
  const scrolling = document.scrollingElement;
  const appContent = target.closest('.app-content') || document.querySelector('.app-content');
  const page = target.closest('.active-workout-page');
  const viewportHeight = viewport?.height || window.innerHeight;

  editState = {
    page,
    appContent,
    windowX: window.scrollX || 0,
    windowY: window.scrollY || scrolling?.scrollTop || 0,
    documentTop: scrolling?.scrollTop || 0,
    appContentTop: appContent?.scrollTop || 0,
    pageTop: page?.scrollTop || 0,
    baselineHeight: Math.max(viewportHeight, window.innerHeight || viewportHeight),
    keyboardSeen: false,
    closing: false,
  };
}

function pageStillActive() {
  return Boolean(editState?.page?.isConnected && document.querySelector('.active-workout-page'));
}

function restoreViewport() {
  if (!editState || !pageStillActive()) return;

  const { windowX, windowY, documentTop, appContent, appContentTop, page, pageTop } = editState;
  const scrolling = document.scrollingElement;

  // iOS can retain either a document scroll offset or an internal container
  // offset after the keyboard animation. Restore both because which one moves
  // differs between Safari and standalone/PWA mode.
  if (scrolling) scrolling.scrollTop = documentTop;
  document.documentElement.scrollTop = documentTop;
  document.body.scrollTop = documentTop;
  if (appContent?.isConnected) appContent.scrollTop = appContentTop;
  if (page?.isConnected) page.scrollTop = pageTop;
  window.scrollTo(windowX, windowY);
}

function finishKeyboardCycle() {
  if (!editState || !pageStillActive()) return;
  editState.closing = true;
  document.documentElement.classList.remove('active-workout-keyboard-open');

  clearRestoreTimers();
  // Safari sometimes applies one last viewport pan after focusout. Reassert the
  // original position over the duration of the keyboard-dismiss animation.
  [0, 60, 140, 260, 430, 620].forEach((delay, index, steps) => {
    restoreTimers.push(window.setTimeout(() => {
      restoreViewport();
      if (index === steps.length - 1 && editState?.closing) editState = null;
    }, delay));
  });
}

function viewportHeight() {
  return viewport?.height || window.innerHeight;
}

function onViewportChange() {
  if (!editState || !pageStillActive()) return;
  const height = viewportHeight();
  const keyboardThreshold = Math.max(90, editState.baselineHeight * 0.16);
  const keyboardIsOpen = height < editState.baselineHeight - keyboardThreshold;

  if (keyboardIsOpen) {
    editState.keyboardSeen = true;
    editState.closing = false;
    document.documentElement.classList.add('active-workout-keyboard-open');
    return;
  }

  // Covers the iOS case where the keyboard dismisses but the input remains
  // focused, so focusout never arrives.
  if (editState.keyboardSeen && height >= editState.baselineHeight - 36) {
    finishKeyboardCycle();
  }
}

document.addEventListener('focusin', (event) => {
  if (!workoutField(event.target)) return;
  clearRestoreTimers();
  captureScrollState(event.target);
  requestAnimationFrame(onViewportChange);
}, true);

document.addEventListener('focusout', (event) => {
  if (!workoutField(event.target) || !editState) return;
  window.setTimeout(() => {
    // Moving directly between workout fields should keep the keyboard session
    // alive and must not yank the viewport during the transition.
    if (workoutField(document.activeElement)) return;
    finishKeyboardCycle();
  }, 35);
}, true);

viewport?.addEventListener('resize', onViewportChange, { passive: true });
viewport?.addEventListener('scroll', onViewportChange, { passive: true });

addEventListener('pageshow', () => {
  if (document.querySelector('.active-workout-page') && !workoutField(document.activeElement)) {
    window.setTimeout(() => {
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    }, 0);
  }
});
