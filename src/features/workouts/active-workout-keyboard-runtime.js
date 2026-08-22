/*
 * iOS 26 keyboard/viewport stabilizer for the active-workout screen.
 *
 * WebKit can pan the visual viewport while the keyboard is open and leave that
 * pan partially applied after dismissal. On affected iPhones this is not normal
 * document scrolling: scrollTop can remain 0 while body.getBoundingClientRect()
 * is shifted. We therefore:
 *   1) freeze the active workout's pre-keyboard pixel height, so 100dvh cannot
 *      reflow the screen during the keyboard animation;
 *   2) after blur, detect any residual visual pan and compensate the workout
 *      page by exactly that amount;
 *   3) keep the workaround scoped to the active workout only.
 */

const viewport = window.visualViewport;
const root = document.documentElement;
const EDITABLE = '.active-workout-page input, .active-workout-page textarea, .active-workout-page select, .active-workout-page [contenteditable="true"]';
const RECOVERY_DELAYS = [0, 50, 110, 190, 300, 460, 700, 1000, 1450, 2100, 3000];

let prepared = null;
let session = null;
let recoveryTimers = [];
let mutationFrame = 0;

function activePage() {
  return document.querySelector('.active-workout-page.live-minimal');
}

function isEditable(node) {
  return node instanceof Element && node.matches(EDITABLE);
}

function clearTimers() {
  recoveryTimers.forEach((timer) => clearTimeout(timer));
  recoveryTimers = [];
}

function pageMetrics(page = activePage()) {
  if (!page) return null;
  const appContent = page.closest('.app-content');
  const pageRect = page.getBoundingClientRect();
  const contentRect = appContent?.getBoundingClientRect();
  return {
    page,
    pageHeight: pageRect.height,
    outerHeight: contentRect?.height || window.innerHeight || document.documentElement.clientHeight,
    bodyTop: document.body.getBoundingClientRect().top,
    pageTop: viewport?.pageTop || 0,
    offsetTop: viewport?.offsetTop || 0,
    visualHeight: viewport?.height || window.innerHeight || 0,
    scrollY: window.scrollY || 0,
    width: window.innerWidth || document.documentElement.clientWidth || 0,
  };
}

function lockGeometry(metrics) {
  if (!metrics?.page?.isConnected) return;
  if (metrics.pageHeight > 100) {
    metrics.page.style.setProperty('--aw-stable-height', `${metrics.pageHeight}px`);
  }
  if (metrics.outerHeight > 100) {
    root.style.setProperty('--aw-stable-outer-height', `${metrics.outerHeight}px`);
  }
  if (!metrics.page.style.getPropertyValue('--aw-ios-pan-fix')) {
    metrics.page.style.setProperty('--aw-ios-pan-fix', '0px');
  }
  root.classList.add('aw-viewport-locked');
}

function unlockGeometry() {
  root.classList.remove('aw-viewport-locked', 'aw-keyboard-recovering');
  root.style.removeProperty('--aw-stable-outer-height');
  document.querySelectorAll('.active-workout-page').forEach((page) => {
    page.style.removeProperty('--aw-stable-height');
    page.style.removeProperty('--aw-ios-pan-fix');
  });
}

function currentKeyboardOpen(baseline) {
  if (!baseline) return false;
  const height = viewport?.height || window.innerHeight || baseline.visualHeight;
  return height < baseline.visualHeight - Math.max(90, baseline.visualHeight * 0.12);
}

function residualPan(baseline) {
  const currentBodyTop = document.body.getBoundingClientRect().top;
  const bodyDelta = baseline.bodyTop - currentBodyTop;
  const visualPageDelta = (viewport?.pageTop || 0) - baseline.pageTop - ((window.scrollY || 0) - baseline.scrollY);
  const offsetDelta = (viewport?.offsetTop || 0) - baseline.offsetTop;

  // body.getBoundingClientRect().top is the most direct signal for the iOS 26
  // regression. Use VisualViewport as a fallback when WebKit reports bodyTop as
  // unchanged even though the visual viewport remains panned.
  let value = Math.abs(bodyDelta) >= 1 ? bodyDelta : visualPageDelta;
  if (Math.abs(value) < 1 && Math.abs(offsetDelta) >= 1) value = offsetDelta;

  if (!Number.isFinite(value) || Math.abs(value) < 0.75) return 0;
  return Math.max(-180, Math.min(180, Math.round(value * 2) / 2));
}

function applyRecovery() {
  if (!session?.baseline) return;
  const page = activePage();
  if (!page) return;

  lockGeometry({ ...session.baseline, page });

  // Never counteract Safari while the keyboard is still visibly occupying the
  // screen; that would fight its input-visibility scroll. Compensation starts
  // only once the visual viewport is back near its original height.
  if (currentKeyboardOpen(session.baseline)) {
    page.style.setProperty('--aw-ios-pan-fix', '0px');
    return;
  }

  const pan = residualPan(session.baseline);
  page.style.setProperty('--aw-ios-pan-fix', `${pan}px`);

  // A tiny root scroll reset is harmless here (the workout body is already
  // non-scrollable) and helps Safari discard a stale internal keyboard inset on
  // builds where the viewport eventually becomes writable again.
  if (Math.abs(window.scrollY || 0) < 2) {
    window.scrollTo(0, 0);
  }
}

function beginRecovery() {
  if (!session) return;
  session.recovering = true;
  root.classList.add('aw-keyboard-recovering');
  clearTimers();

  RECOVERY_DELAYS.forEach((delay, index) => {
    recoveryTimers.push(setTimeout(() => {
      if (!session) return;
      if (isEditable(document.activeElement)) return;
      applyRecovery();
      if (index === RECOVERY_DELAYS.length - 1) {
        root.classList.remove('aw-keyboard-recovering');
        session.recovering = false;
      }
    }, delay));
  });
}

function startSession(target) {
  clearTimers();
  const now = performance.now();
  const baseline = prepared && prepared.target === target && now - prepared.at < 1200
    ? prepared.metrics
    : pageMetrics();
  prepared = null;
  if (!baseline) return;

  lockGeometry(baseline);
  baseline.page.style.setProperty('--aw-ios-pan-fix', '0px');
  session = { baseline, target, recovering: false };
}

function prepare(event) {
  if (!isEditable(event.target)) return;
  const metrics = pageMetrics();
  if (!metrics) return;
  lockGeometry(metrics);
  prepared = { target: event.target, metrics, at: performance.now() };
}

function syncMountedPage() {
  mutationFrame = 0;
  const page = activePage();
  if (!page) {
    if (!session) unlockGeometry();
    return;
  }

  if (session?.baseline) {
    lockGeometry({ ...session.baseline, page });
    if (session.recovering) applyRecovery();
    return;
  }

  const metrics = pageMetrics(page);
  if (metrics) lockGeometry(metrics);
}

function scheduleMountedPageSync() {
  if (mutationFrame) return;
  mutationFrame = requestAnimationFrame(syncMountedPage);
}

document.addEventListener('pointerdown', prepare, true);
document.addEventListener('touchstart', prepare, { passive: true, capture: true });

document.addEventListener('focusin', (event) => {
  if (!isEditable(event.target)) return;
  startSession(event.target);
}, true);

document.addEventListener('focusout', (event) => {
  if (!session || !isEditable(event.target)) return;
  setTimeout(() => {
    if (!session || isEditable(document.activeElement)) return;
    beginRecovery();
  }, 20);
}, true);

viewport?.addEventListener('resize', () => {
  if (session?.recovering) applyRecovery();
}, { passive: true });
viewport?.addEventListener('scroll', () => {
  if (session?.recovering) applyRecovery();
}, { passive: true });

window.addEventListener('orientationchange', () => {
  clearTimers();
  prepared = null;
  session = null;
  unlockGeometry();
  setTimeout(scheduleMountedPageSync, 450);
}, { passive: true });

window.addEventListener('pageshow', () => {
  if (session && !isEditable(document.activeElement)) beginRecovery();
  else scheduleMountedPageSync();
});

document.addEventListener('ironlog:navigate', scheduleMountedPageSync);
const app = document.querySelector('#app');
if (app) new MutationObserver(scheduleMountedPageSync).observe(app, { childList: true, subtree: true });

scheduleMountedPageSync();
