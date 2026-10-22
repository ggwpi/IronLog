/*
 * Global keyboard session controller for IronLog.
 *
 * This module intentionally does NOT translate the page, rewrite viewport
 * heights, or call scrollTo(). Its only job is to expose a stable keyboard
 * lifecycle to CSS before iOS/WebKit performs its focus pan and to keep the
 * keyboard-safe flow layout active until the visual viewport has genuinely
 * returned to its pre-focus geometry.
 */

const root = document.documentElement;
const viewport = window.visualViewport;
const EDITABLE = [
  'input:not([type="hidden"]):not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[contenteditable="true"]',
].join(',');

let session = null;
let settleTimer = 0;
let settleStartedAt = 0;
let stableSamples = 0;

function isEditable(node) {
  return node instanceof Element && node.matches(EDITABLE);
}

function metrics() {
  return {
    visualHeight: viewport?.height ?? window.innerHeight,
    visualTop: viewport?.offsetTop ?? 0,
    visualPageTop: viewport?.pageTop ?? window.scrollY,
    innerHeight: window.innerHeight,
    scrollY: window.scrollY,
  };
}

function beginSession(target) {
  if (!isEditable(target)) return;

  if (!session) {
    session = {
      target,
      baseline: metrics(),
    };
  } else {
    session.target = target;
  }

  stableSamples = 0;
  window.clearTimeout(settleTimer);
  root.classList.add('ironlog-keyboard-session');
  root.classList.remove('ironlog-keyboard-recovery');
}

function keyboardLooksOpen() {
  if (!session) return false;
  const current = metrics();
  const baseline = session.baseline;
  return current.visualHeight < baseline.visualHeight - Math.max(80, baseline.visualHeight * 0.1);
}

function viewportRecovered() {
  if (!session) return true;
  const current = metrics();
  const baseline = session.baseline;

  const heightOk = Math.abs(current.visualHeight - baseline.visualHeight) <= 3;
  const topOk = Math.abs(current.visualTop - baseline.visualTop) <= 2;

  // pageTop is useful on builds where offsetTop is stale. Compare it after
  // removing real document scroll so intentional scrolling does not count as a
  // viewport error.
  const baselineVisualPan = baseline.visualPageTop - baseline.scrollY;
  const currentVisualPan = current.visualPageTop - current.scrollY;
  const pageTopOk = Math.abs(currentVisualPan - baselineVisualPan) <= 3;

  return heightOk && topOk && pageTopOk;
}

function finishSession() {
  window.clearTimeout(settleTimer);
  settleTimer = 0;
  settleStartedAt = 0;
  stableSamples = 0;
  session = null;
  root.classList.remove(
    'ironlog-keyboard-session',
    'ironlog-keyboard-recovery',
    'ironlog-keyboard-open',
  );
}

function sampleRecovery() {
  if (!session) return;

  if (isEditable(document.activeElement) || keyboardLooksOpen()) {
    stableSamples = 0;
    root.classList.add('ironlog-keyboard-open');
    settleTimer = window.setTimeout(sampleRecovery, 90);
    return;
  }

  root.classList.remove('ironlog-keyboard-open');

  if (viewportRecovered()) {
    stableSamples += 1;
    if (stableSamples >= 3) {
      finishSession();
      return;
    }
  } else {
    stableSamples = 0;
  }

  // Do not force-clear a broken WebKit viewport. If iOS leaves a stale visual
  // viewport behind, keeping the recovery class means the app stays in normal
  // document flow instead of re-entering a clipped/fixed layout.
  if (!settleStartedAt) settleStartedAt = performance.now();
  const delay = performance.now() - settleStartedAt > 1800 ? 220 : 90;
  settleTimer = window.setTimeout(sampleRecovery, delay);
}

function beginRecovery() {
  if (!session) return;
  root.classList.add('ironlog-keyboard-session', 'ironlog-keyboard-recovery');
  root.classList.remove('ironlog-keyboard-open');
  stableSamples = 0;
  settleStartedAt = performance.now();
  window.clearTimeout(settleTimer);
  settleTimer = window.setTimeout(sampleRecovery, 40);
}

// Run before the default tap action focuses an input. This is important on iOS:
// the document must already be unlocked before WebKit starts moving the visual
// viewport for the software keyboard.
document.addEventListener('pointerdown', (event) => {
  if (isEditable(event.target)) beginSession(event.target);
}, true);

document.addEventListener('touchstart', (event) => {
  if (isEditable(event.target)) beginSession(event.target);
}, { capture: true, passive: true });

document.addEventListener('focusin', (event) => {
  if (!isEditable(event.target)) return;
  beginSession(event.target);
  root.classList.toggle('ironlog-keyboard-open', keyboardLooksOpen());
}, true);

document.addEventListener('focusout', (event) => {
  if (!session || !isEditable(event.target)) return;
  window.setTimeout(() => {
    if (isEditable(document.activeElement)) return;
    beginRecovery();
  }, 0);
}, true);

viewport?.addEventListener('resize', () => {
  if (!session) return;
  root.classList.toggle('ironlog-keyboard-open', keyboardLooksOpen());
  if (root.classList.contains('ironlog-keyboard-recovery')) sampleRecovery();
}, { passive: true });

viewport?.addEventListener('scroll', () => {
  if (!session) return;
  if (root.classList.contains('ironlog-keyboard-recovery')) sampleRecovery();
}, { passive: true });

// A route change gives WebKit a fresh layout tree. End an old keyboard session
// so a new screen starts from its own geometry instead of inheriting stale state.
document.addEventListener('ironlog:navigate', finishSession);
window.addEventListener('pagehide', finishSession, { passive: true });
window.addEventListener('orientationchange', finishSession, { passive: true });
