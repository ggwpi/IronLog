/*
 * IronLog keyboard guard for the stable app-shell architecture.
 *
 * Persistent UI no longer uses viewport-fixed positioning, so this runtime
 * intentionally does NOT translate fixed elements. Its only job is to keep
 * the outer document pinned at the origin while Safari opens/closes the
 * software keyboard, and to preserve the app's internal scroll position when
 * the user did not deliberately scroll while editing.
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

const RECOVERY_DELAYS = [0, 60, 140, 260, 430, 700, 1100];
let state = null;
let timers = [];

function isEditable(element){
  return element instanceof Element
    && element.matches(EDITABLE_SELECTOR)
    && !element.hasAttribute('disabled')
    && element.getAttribute('aria-disabled') !== 'true';
}

function vvHeight(){
  return Math.max(1, viewport?.height || window.innerHeight || root.clientHeight || 1);
}

function pinDocument(){
  const scrolling = document.scrollingElement;
  if (scrolling) scrolling.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0);
}

function keyboardOpen(){
  if (!state) return false;
  const threshold = Math.max(96, state.baselineHeight * 0.14);
  return vvHeight() < state.baselineHeight - threshold;
}

function clearTimers(){
  timers.forEach((timer) => window.clearTimeout(timer));
  timers = [];
}

function restoreInternalScroll(){
  if (!state || state.userScrolled) return;
  const scroller = state.scroller;
  if (scroller?.isConnected) {
    scroller.scrollTop = state.scrollTop;
    scroller.scrollLeft = state.scrollLeft;
  }
}

function finish(){
  if (!state) return;
  pinDocument();
  restoreInternalScroll();
  state = null;
  clearTimers();
  root.classList.remove('ironlog-keyboard-session','ironlog-keyboard-open','ironlog-keyboard-recovering');
}

function recover(){
  if (!state || state.recovering) return;
  state.recovering = true;
  root.classList.remove('ironlog-keyboard-open');
  root.classList.add('ironlog-keyboard-recovering');
  clearTimers();

  RECOVERY_DELAYS.forEach((delay,index) => {
    timers.push(window.setTimeout(() => {
      if (!state) return;
      pinDocument();
      restoreInternalScroll();
      if (index === RECOVERY_DELAYS.length - 1) {
        requestAnimationFrame(() => requestAnimationFrame(finish));
      }
    }, delay));
  });
}

function start(target){
  clearTimers();
  const scroller = target.closest('.app-content,[data-scroll-container]') || document.querySelector('.app-content');
  state = {
    target,
    scroller,
    scrollTop: scroller?.scrollTop || 0,
    scrollLeft: scroller?.scrollLeft || 0,
    baselineHeight: vvHeight(),
    keyboardSeen:false,
    recovering:false,
    userScrolled:false,
  };
  root.classList.add('ironlog-keyboard-session');
  pinDocument();
}

function sync(){
  pinDocument();
  if (!state) return;
  const open = keyboardOpen();
  if (open) state.keyboardSeen = true;
  root.classList.toggle('ironlog-keyboard-open', open);

  if (state.keyboardSeen && !open && !state.recovering && vvHeight() >= state.baselineHeight - 36) {
    recover();
  }
}

document.addEventListener('focusin',(event) => {
  if (!isEditable(event.target)) return;
  if (state && !state.recovering) {
    state.target = event.target;
    return;
  }
  start(event.target);
  requestAnimationFrame(sync);
},true);

document.addEventListener('focusout',(event) => {
  if (!state || !isEditable(event.target)) return;
  window.setTimeout(() => {
    if (!state || isEditable(document.activeElement)) return;
    recover();
  },45);
},true);

document.addEventListener('touchmove',(event) => {
  if (!state) return;
  if (state.scroller && state.scroller.contains(event.target)) state.userScrolled = true;
},{passive:true,capture:true});

viewport?.addEventListener('resize',sync,{passive:true});
viewport?.addEventListener('scroll',sync,{passive:true});
window.addEventListener('resize',sync,{passive:true});
window.addEventListener('pageshow',() => { pinDocument(); if (state) recover(); });
window.addEventListener('orientationchange',() => { pinDocument(); if (state) finish(); },{passive:true});

pinDocument();
