/*
 * IronLog global mobile keyboard / VisualViewport stabilizer.
 *
 * iOS Safari can pan the visual viewport while the software keyboard is open
 * and, on some versions, keep one-edge position:fixed controls at that panned
 * offset after the keyboard closes. The important detail is that removing our
 * compensation immediately after dismissal can re-introduce Safari's offset.
 *
 * This runtime is intentionally route-agnostic. It handles every editable
 * control and every visible top/bottom fixed layer across the app.
 */

const viewport = window.visualViewport;
const root = document.documentElement;

const EDITABLE_SELECTOR = [
  'textarea',
  'select',
  '[contenteditable="true"]',
  '[contenteditable="plaintext-only"]',
  'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="hidden"]):not([type="file"]):not([type="color"])',
].join(',');

const RECOVERY_DELAYS = [0, 40, 90, 160, 250, 380, 560, 800, 1100, 1500, 2100];
const managedFixed = new Map();

let session = null;
let recoveryTimers = [];
let manuallyScrolled = false;
let preFocus = null;
let postKeyboardUntil = 0;

function isEditable(element) {
  if (!(element instanceof Element)) return false;
  if (!element.matches(EDITABLE_SELECTOR)) return false;
  if (element.matches('input[type="hidden"], input[type="file"], input[type="color"]')) return false;
  return !element.hasAttribute('disabled') && element.getAttribute('aria-disabled') !== 'true';
}

function metrics() {
  const vv = viewport;
  const height = Math.max(1, vv?.height || window.innerHeight || root.clientHeight || 1);
  const top = Math.max(0, vv?.offsetTop || 0);
  const left = Math.max(0, vv?.offsetLeft || 0);

  return {
    height,
    width: Math.max(1, vv?.width || window.innerWidth || root.clientWidth || 1),
    top,
    left,
    bottom: top + height,
    windowHeight: Math.max(1, window.innerHeight || root.clientHeight || height),
  };
}

function keyboardThreshold(baselineHeight) {
  return Math.max(96, baselineHeight * 0.14);
}

function keyboardIsOpen(current, state = session) {
  if (!state) return false;
  return current.height < state.baseline.height - keyboardThreshold(state.baseline.height);
}

function fixedAnchor(element) {
  if (!(element instanceof HTMLElement) || !element.isConnected) return null;
  if (element.closest('.app-bottom-sheet-layer')) return null;
  if (element.dataset.ironlogViewportManaged === 'self') return null;

  const style = getComputedStyle(element);
  if (style.position !== 'fixed' || style.display === 'none' || style.visibility === 'hidden') return null;

  const hasTop = style.top !== 'auto';
  const hasBottom = style.bottom !== 'auto';

  if (hasBottom && !hasTop) return 'bottom';
  if (hasTop && !hasBottom) return 'top';
  return null;
}

function canUseIndividualTranslate(element) {
  if (managedFixed.has(element)) return true;
  const computed = getComputedStyle(element).translate;
  return !computed || computed === 'none' || computed === '0px' || computed === '0px 0px';
}

function restoreOriginalTranslate(record) {
  const { element, originalValue, originalPriority } = record;
  if (!element?.isConnected) return;
  if (originalValue) element.style.setProperty('translate', originalValue, originalPriority);
  else element.style.removeProperty('translate');
}

function applyShift(record, nextShift) {
  if (!record.element?.isConnected || !Number.isFinite(nextShift)) return;

  const rounded = Math.abs(nextShift) < 0.75 ? 0 : Math.round(nextShift * 2) / 2;
  record.shift = rounded;

  if (rounded === 0 && !record.keepManaged) {
    restoreOriginalTranslate(record);
    return;
  }

  record.element.style.setProperty('translate', `0px ${rounded}px`, 'important');
}

function captureFixedElement(element, baseline) {
  const anchor = fixedAnchor(element);
  if (!anchor || !canUseIndividualTranslate(element)) return null;

  const rect = element.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return null;

  const existing = managedFixed.get(element);
  const originalValue = existing?.originalValue ?? element.style.getPropertyValue('translate');
  const originalPriority = existing?.originalPriority ?? element.style.getPropertyPriority('translate');
  const shift = existing?.shift || 0;

  const item = {
    element,
    anchor,
    baselineGap: anchor === 'bottom'
      ? baseline.bottom - rect.bottom
      : rect.top - baseline.top,
    shift,
    originalValue,
    originalPriority,
    keepManaged: true,
  };

  managedFixed.set(element, item);
  return item;
}

function captureFixedElements(baseline) {
  const result = [];
  document.querySelectorAll('body *').forEach((element) => {
    const item = captureFixedElement(element, baseline);
    if (item) result.push(item);
  });
  return result;
}

function refreshSessionFixedElements() {
  if (!session) return;
  const known = new Set(session.fixed.map((item) => item.element));
  document.querySelectorAll('body *').forEach((element) => {
    if (known.has(element)) return;
    const item = captureFixedElement(element, session.baseline);
    if (item) session.fixed.push(item);
  });
}

function captureScrollState(target) {
  const nodes = new Set();
  const scrolling = document.scrollingElement;

  if (scrolling) nodes.add(scrolling);
  nodes.add(document.documentElement);
  nodes.add(document.body);

  let current = target instanceof Element ? target.parentElement : null;
  while (current) {
    if (current.scrollHeight > current.clientHeight + 1 || current.scrollWidth > current.clientWidth + 1) {
      nodes.add(current);
    }
    current = current.parentElement;
  }

  document.querySelectorAll('.app-content,[data-scroll-container]').forEach((element) => nodes.add(element));

  return [...nodes]
    .filter(Boolean)
    .map((element) => ({
      element,
      top: element.scrollTop || 0,
      left: element.scrollLeft || 0,
    }));
}

function restoreScrollState() {
  if (!session || manuallyScrolled) return;

  session.scrollState.forEach(({ element, top, left }) => {
    if (!element?.isConnected) return;
    if (typeof element.scrollTo === 'function') element.scrollTo({ top, left, behavior: 'auto' });
    else {
      element.scrollTop = top;
      element.scrollLeft = left;
    }
  });

  window.scrollTo(session.windowX, session.windowY);
}

function desiredEdge(item, current) {
  return item.anchor === 'bottom'
    ? current.bottom - item.baselineGap
    : current.top + item.baselineGap;
}

function syncOneFixed(item, current) {
  if (!item.element?.isConnected) return;
  const rect = item.element.getBoundingClientRect();
  const actual = item.anchor === 'bottom' ? rect.bottom : rect.top;
  const desired = desiredEdge(item, current);
  applyShift(item, item.shift + (desired - actual));
}

function syncFixedElements() {
  if (!session) return;

  refreshSessionFixedElements();
  const current = metrics();
  const open = keyboardIsOpen(current);
  if (open) session.keyboardSeen = true;

  session.fixed.forEach((item) => syncOneFixed(item, current));
  root.classList.toggle('ironlog-keyboard-open', open);
}

function pruneManagedFixed() {
  for (const [element, record] of managedFixed) {
    if (!element.isConnected) managedFixed.delete(element);
    else if (!fixedAnchor(element)) {
      restoreOriginalTranslate(record);
      managedFixed.delete(element);
    }
  }
}

function syncPersistedFixed() {
  if (session) return;
  pruneManagedFixed();
  if (!managedFixed.size) return;

  const current = metrics();
  for (const record of managedFixed.values()) syncOneFixed(record, current);
}

function clearRecoveryTimers() {
  recoveryTimers.forEach((timer) => window.clearTimeout(timer));
  recoveryTimers = [];
}

function finishSession() {
  if (!session) return;

  // Do NOT remove the final translate here. On affected iOS versions that is
  // exactly what makes the fixed button jump back to Safari's stale offset.
  // Keep the small residual correction and continue syncing it to the visual
  // viewport. A later route/orientation change safely drops stale records.
  session.fixed.forEach((item) => {
    item.keepManaged = true;
    managedFixed.set(item.element, item);
  });

  session = null;
  manuallyScrolled = false;
  postKeyboardUntil = performance.now() + 3500;
  clearRecoveryTimers();
  root.classList.remove('ironlog-keyboard-session', 'ironlog-keyboard-open', 'ironlog-keyboard-recovering');

  requestAnimationFrame(() => requestAnimationFrame(syncPersistedFixed));
}

function beginRecovery() {
  if (!session || session.recovering) return;

  session.recovering = true;
  root.classList.remove('ironlog-keyboard-open');
  root.classList.add('ironlog-keyboard-recovering');
  clearRecoveryTimers();

  RECOVERY_DELAYS.forEach((delay, index) => {
    recoveryTimers.push(window.setTimeout(() => {
      if (!session) return;

      restoreScrollState();
      syncFixedElements();
      void document.documentElement.offsetHeight;

      if (index === RECOVERY_DELAYS.length - 1) {
        requestAnimationFrame(() => {
          if (!session) return;
          restoreScrollState();
          syncFixedElements();
          requestAnimationFrame(finishSession);
        });
      }
    }, delay));
  });
}

function startSession(target) {
  clearRecoveryTimers();

  const prepared = preFocus
    && preFocus.target === target
    && performance.now() - preFocus.at < 1000
      ? preFocus
      : null;
  const baseline = prepared?.baseline || metrics();

  session = {
    target,
    baseline,
    keyboardSeen: false,
    recovering: false,
    fixed: captureFixedElements(baseline),
    scrollState: prepared?.scrollState || captureScrollState(target),
    windowX: prepared?.windowX ?? (window.scrollX || 0),
    windowY: prepared?.windowY ?? (window.scrollY || 0),
  };
  preFocus = null;

  manuallyScrolled = false;
  root.classList.add('ironlog-keyboard-session');
  root.classList.remove('ironlog-keyboard-recovering');
  syncFixedElements();
}

function onViewportChange() {
  if (session) {
    const current = metrics();
    const open = keyboardIsOpen(current);

    syncFixedElements();

    if (
      session.keyboardSeen
      && !open
      && current.height >= session.baseline.height - 36
      && !session.recovering
    ) {
      beginRecovery();
    }
    return;
  }

  if (managedFixed.size) syncPersistedFixed();
}

function prepareFocus(event) {
  if (!isEditable(event.target) || session) return;
  preFocus = {
    target: event.target,
    baseline: metrics(),
    scrollState: captureScrollState(event.target),
    windowX: window.scrollX || 0,
    windowY: window.scrollY || 0,
    at: performance.now(),
  };
}

document.addEventListener('pointerdown', prepareFocus, true);
document.addEventListener('touchstart', prepareFocus, { passive: true, capture: true });

document.addEventListener('focusin', (event) => {
  if (!isEditable(event.target)) return;

  if (session && !session.recovering) {
    session.target = event.target;
    return;
  }

  startSession(event.target);
  requestAnimationFrame(onViewportChange);
}, true);

document.addEventListener('focusout', (event) => {
  if (!session || !isEditable(event.target)) return;

  window.setTimeout(() => {
    if (!session) return;
    if (isEditable(document.activeElement)) return;
    beginRecovery();
  }, 45);
}, true);

document.addEventListener('touchmove', () => {
  if (session) manuallyScrolled = true;
}, { passive: true, capture: true });

viewport?.addEventListener('resize', onViewportChange, { passive: true });
viewport?.addEventListener('scroll', onViewportChange, { passive: true });
window.addEventListener('resize', onViewportChange, { passive: true });

// Safari can finish moving its toolbar after the keyboard animation itself.
// Keep checking briefly even when it emits no final VisualViewport event.
window.setInterval(() => {
  if (!session && managedFixed.size && performance.now() < postKeyboardUntil) {
    syncPersistedFixed();
  }
}, 120);

window.addEventListener('orientationchange', () => {
  preFocus = null;
  if (session) {
    session.fixed.forEach((item) => {
      restoreOriginalTranslate(item);
      managedFixed.delete(item.element);
    });
    session = null;
  }
  for (const record of managedFixed.values()) restoreOriginalTranslate(record);
  managedFixed.clear();
  clearRecoveryTimers();
  root.classList.remove('ironlog-keyboard-session', 'ironlog-keyboard-open', 'ironlog-keyboard-recovering');
}, { passive: true });

window.addEventListener('pageshow', () => {
  preFocus = null;
  if (session) beginRecovery();
  else syncPersistedFixed();
});
