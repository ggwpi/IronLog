/*
 * IronLog global mobile keyboard / VisualViewport stabilizer.
 *
 * iOS Safari can move or resize the layout viewport while an input is focused
 * and occasionally leaves position:fixed UI at the keyboard-adjusted offset
 * after the keyboard closes. This runtime is intentionally route-agnostic:
 * every editable control and every top/bottom fixed layer is handled the same
 * way across the app.
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

const RECOVERY_DELAYS = [0, 48, 110, 190, 300, 450, 650, 900, 1200];

let session = null;
let recoveryTimers = [];
let manuallyScrolled = false;
let preFocus = null;

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
  if (style.position !== 'fixed') return null;

  // Full-viewport layers (both top and bottom set) already define their own
  // viewport box. We only compensate one-edge fixed controls/docks.
  const hasTop = style.top !== 'auto';
  const hasBottom = style.bottom !== 'auto';

  if (hasBottom && !hasTop) return 'bottom';
  if (hasTop && !hasBottom) return 'top';
  return null;
}

function canUseIndividualTranslate(element) {
  const style = getComputedStyle(element);
  const computed = style.translate;
  return !computed || computed === 'none' || computed === '0px' || computed === '0px 0px';
}

function captureFixedElement(element, baseline) {
  const anchor = fixedAnchor(element);
  if (!anchor || !canUseIndividualTranslate(element)) return null;

  const rect = element.getBoundingClientRect();
  const inlineValue = element.style.getPropertyValue('translate');
  const inlinePriority = element.style.getPropertyPriority('translate');

  return {
    element,
    anchor,
    baselineRect: {
      top: rect.top,
      bottom: rect.bottom,
    },
    baselineGap: anchor === 'bottom'
      ? baseline.bottom - rect.bottom
      : rect.top - baseline.top,
    shift: 0,
    inlineValue,
    inlinePriority,
  };
}

function captureFixedElements(baseline) {
  const result = [];
  document.querySelectorAll('body *').forEach((element) => {
    const item = captureFixedElement(element, baseline);
    if (item) result.push(item);
  });
  return result;
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
    if (typeof element.scrollTo === 'function') {
      element.scrollTo({ top, left, behavior: 'auto' });
    } else {
      element.scrollTop = top;
      element.scrollLeft = left;
    }
  });

  window.scrollTo(session.windowX, session.windowY);
}

function setTranslate(item, nextShift) {
  if (!item.element?.isConnected) return;
  if (!Number.isFinite(nextShift)) return;

  // Avoid sub-pixel jitter from VisualViewport animation events.
  const rounded = Math.abs(nextShift) < 0.75 ? 0 : Math.round(nextShift * 2) / 2;
  item.shift = rounded;
  item.element.style.setProperty('translate', `0px ${rounded}px`, 'important');
}

function restoreInlineTranslate(item) {
  if (!item.element?.isConnected) return;
  if (item.inlineValue) {
    item.element.style.setProperty('translate', item.inlineValue, item.inlinePriority);
  } else {
    item.element.style.removeProperty('translate');
  }
}

function syncFixedElements({ recovering = false } = {}) {
  if (!session) return;

  const current = metrics();
  const open = keyboardIsOpen(current);

  if (open) session.keyboardSeen = true;

  for (const item of session.fixed) {
    if (!item.element?.isConnected) continue;

    const rect = item.element.getBoundingClientRect();
    let desired;

    if (recovering || session.recovering) {
      // Return every fixed control to the exact pre-keyboard screen position.
      desired = item.anchor === 'bottom' ? item.baselineRect.bottom : item.baselineRect.top;
    } else if (open) {
      // While typing, keep the same edge gap but anchor it to the *visual*
      // viewport so Safari's keyboard pan cannot strand the control.
      desired = item.anchor === 'bottom'
        ? current.bottom - item.baselineGap
        : current.top + item.baselineGap;
    } else {
      desired = item.anchor === 'bottom' ? item.baselineRect.bottom : item.baselineRect.top;
    }

    const actual = item.anchor === 'bottom' ? rect.bottom : rect.top;
    setTranslate(item, item.shift + (desired - actual));
  }

  root.classList.toggle('ironlog-keyboard-open', open);
}

function clearRecoveryTimers() {
  recoveryTimers.forEach((timer) => window.clearTimeout(timer));
  recoveryTimers = [];
}

function finishSession() {
  if (!session) return;

  session.fixed.forEach(restoreInlineTranslate);
  session = null;
  manuallyScrolled = false;
  clearRecoveryTimers();
  root.classList.remove('ironlog-keyboard-session', 'ironlog-keyboard-open', 'ironlog-keyboard-recovering');
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
      syncFixedElements({ recovering: true });

      // A layout read followed by another frame makes Safari commit its final
      // viewport geometry instead of keeping the keyboard-sized fixed layer.
      void document.documentElement.offsetHeight;

      if (index === RECOVERY_DELAYS.length - 1) {
        requestAnimationFrame(() => {
          if (!session) return;
          restoreScrollState();
          syncFixedElements({ recovering: true });
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
  if (!session) return;

  const current = metrics();
  const open = keyboardIsOpen(current);

  syncFixedElements();

  // iOS can dismiss the keyboard while the input remains focused (Done key).
  // Detect the viewport returning to its baseline and run the same recovery.
  if (
    session.keyboardSeen
    && !open
    && current.height >= session.baseline.height - 36
    && !session.recovering
  ) {
    beginRecovery();
  }
}

document.addEventListener('pointerdown', (event) => {
  if (!isEditable(event.target) || session) return;
  preFocus = {
    target: event.target,
    baseline: metrics(),
    scrollState: captureScrollState(event.target),
    windowX: window.scrollX || 0,
    windowY: window.scrollY || 0,
    at: performance.now(),
  };
}, true);

document.addEventListener('focusin', (event) => {
  if (!isEditable(event.target)) return;

  // Moving between inputs while the keyboard is already up must keep the
  // original pre-keyboard baseline.
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

// If the user deliberately scrolls the form while editing, do not yank the
// document back on keyboard dismissal. Fixed UI is still restored.
document.addEventListener('touchmove', () => {
  if (session) manuallyScrolled = true;
}, { passive: true, capture: true });

viewport?.addEventListener('resize', onViewportChange, { passive: true });
viewport?.addEventListener('scroll', onViewportChange, { passive: true });
window.addEventListener('resize', onViewportChange, { passive: true });

window.addEventListener('orientationchange', () => {
  preFocus = null;
  if (session) finishSession();
}, { passive: true });

window.addEventListener('pageshow', () => {
  preFocus = null;
  if (session) finishSession();
});
