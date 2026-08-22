import { WORKOUTS } from './workout-catalog.js';
import { escapeHtml } from '../../core/escape-html.js';

const START_TIMEOUT_MS = 15000;
const READY_HOLD_MS = 300;
const REMOVE_MS = 460;

const TARGET_HE = Object.freeze({
  Chest:'חזה', Biceps:'יד קדמית', Triceps:'יד אחורית', Shoulders:'כתפיים', Delts:'כתפיים',
  Back:'גב', 'Rear Delts':'כתף אחורית', Quads:'ארבע ראשי', Hamstrings:'המסטרינג',
  Glutes:'ישבן', Core:'בטן', Calves:'תאומים',
});

const FOCUS = Object.freeze({
  'push-a':'שמור שכמות יציבות וטווח תנועה מלא. אל תשרוף את הסט הראשון — השאר 1–2 חזרות במיכל.',
  'push-b':'שליטה בכתף לפני משקל. שמור על מסלול נקי וקצב אחיד גם כשהעומס עולה.',
  'pull-a':'תחשוב על משיכה מהמרפקים, לא מהידיים. בית חזה יציב וטווח מלא בכל חזרה.',
  'legs-a':'יום כבד: תן למנוחות להיות מלאות ושמור טכניקה לפני שאתה רודף אחרי עוד משקל.',
  'legs-b':'היפרטרופיה: שליטה בירידה, טווח מלא ומתח רציף חשובים יותר מקצב מהיר.',
  arms:'מרפקים יציבים, בלי תנופה מיותרת. תן לשריר לעבוד ושמור איכות גם בסטים האחרונים.',
});

let current = null;
let observer = null;
let watchTimer = 0;
let bypassNextButton = null;

function reducedMotion() {
  return Boolean(document.documentElement.classList.contains('reduce-motion') || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

function clean(value) {
  return String(value || '').trim();
}

function workoutFromButton(button) {
  const root = button.closest('.training-hero,.training-plan-row');
  const image = root?.querySelector('img')?.getAttribute('src') || '';
  const byImage = WORKOUTS.find((workout) => workout.images?.some((path) => image.includes(path)));
  if (byImage) return byImage;

  const title = clean(root?.querySelector('h2,strong')?.textContent).toUpperCase();
  return WORKOUTS.find((workout) => {
    const short = clean(workout.short).replace(/\s+[AB]$/i, '').toUpperCase();
    return short === title || clean(workout.title).toUpperCase() === title;
  }) || null;
}

function contextFor(button) {
  const root = button.closest('.training-hero,.training-plan-row');
  const catalog = workoutFromButton(button);
  const title = clean(root?.querySelector('h2,strong')?.textContent) || clean(catalog?.short) || 'WORKOUT';
  const subtitle = clean(root?.querySelector('p,small')?.textContent)
    || (catalog?.targets || []).map((target) => TARGET_HE[target] || target).join(' + ')
    || 'האימון שלך';
  const image = root?.querySelector('img')?.getAttribute('src') || catalog?.images?.[0] || '/assets/workout-images/plans/push-a-front.png';
  const targets = catalog?.targets?.length
    ? catalog.targets.map((target) => TARGET_HE[target] || target)
    : subtitle.split(/[+·]/).map((item) => item.trim()).filter(Boolean).slice(0,4);

  return {
    title,
    subtitle,
    image,
    targets,
    exercises: Number(catalog?.exercises) || null,
    sets: Number(catalog?.sets) || null,
    minutes: Number(catalog?.minutes) || null,
    focus: FOCUS[catalog?.id] || 'פתח בשליטה, שמור על טכניקה נקייה והתאם את העומס לפי היכולת שלך היום.',
  };
}

function metric(value, label) {
  return `<div class="workout-launch__metric"><strong>${value == null ? '—' : value}</strong><span>${escapeHtml(label)}</span></div>`;
}

function htmlFor(context) {
  const targetMarkup = context.targets.slice(0,4).map((target) => `<span>${escapeHtml(target)}</span>`).join('');
  return `<div class="workout-launch" role="dialog" aria-modal="true" aria-labelledby="workoutLaunchTitle" data-workout-launch>
    <div class="workout-launch__top">
      <div class="workout-launch__brand"><i aria-hidden="true"></i><span>IRONLOG / SESSION</span></div>
      <span class="workout-launch__status" data-launch-status>מוכן כשתהיה מוכן</span>
    </div>
    <div class="workout-launch__main">
      <section class="workout-launch__copy">
        <span class="workout-launch__eyebrow">האימון של היום</span>
        <h1 id="workoutLaunchTitle">${escapeHtml(context.title)}</h1>
        <p>${escapeHtml(context.subtitle)}</p>
        <div class="workout-launch__targets">${targetMarkup}</div>
        <div class="workout-launch__metrics">
          ${metric(context.exercises,'תרגילים')}
          ${metric(context.sets,'סטים')}
          ${metric(context.minutes,'דקות')}
        </div>
        <div class="workout-launch__focus"><small>דגש להיום</small><strong>${escapeHtml(context.focus)}</strong></div>
      </section>
      <div class="workout-launch__art"><img src="${escapeHtml(context.image)}" alt="" loading="eager"></div>
    </div>
    <div class="workout-launch__footer">
      <div class="workout-launch__progress" aria-hidden="true"><i></i></div>
      <p data-launch-message>קח את הזמן לעבור על הדגשים. האימון והטיימר יתחילו רק כשתלחץ.</p>
      <div class="workout-launch__actions">
        <button class="workout-launch__back" type="button" data-launch-cancel>חזור</button>
        <button class="workout-launch__start" type="button" data-launch-confirm><span>אני מוכן</span><strong>התחל אימון</strong><b aria-hidden="true">←</b></button>
      </div>
    </div>
  </div>`;
}

function clearWatch() {
  window.clearInterval(watchTimer);
  watchTimer = 0;
  observer?.disconnect();
  observer = null;
}

function removeCurrent() {
  if (!current) return;
  clearWatch();
  current.overlay?.remove();
  current = null;
  bypassNextButton = null;
  document.documentElement.classList.remove('workout-launch-active');
}

function leaveCurrent() {
  if (!current) return;
  current.overlay.classList.add('is-leaving');
  window.setTimeout(removeCurrent, reducedMotion() ? 30 : REMOVE_MS);
}

function revealLiveScreen() {
  const page = document.querySelector('.active-workout-page');
  if (!page) return;
  page.classList.remove('motion-first-mount','workout-launch-reveal','motion-session-enter');
  void page.offsetWidth;
  page.classList.add('workout-launch-reveal','motion-session-enter');
  window.setTimeout(() => page.classList.remove('workout-launch-reveal','motion-session-enter'), reducedMotion() ? 30 : 1250);
}

function completeLaunch() {
  if (!current || current.phase !== 'starting') return;
  current.phase = 'ready';
  clearWatch();
  current.overlay.classList.remove('is-starting');
  current.overlay.classList.add('is-ready');
  current.overlay.querySelector('[data-launch-status]')?.replaceChildren('מוכן');
  current.overlay.querySelector('[data-launch-message]')?.replaceChildren('הכול מוכן. נכנסים לאימון.');

  window.setTimeout(() => {
    if (!current || current.phase !== 'ready') return;
    revealLiveScreen();
    leaveCurrent();
  }, reducedMotion() ? 40 : READY_HOLD_MS);
}

function failLaunch(message = 'לא הצלחנו להתחיל את האימון') {
  if (!current || current.phase !== 'starting') return;
  current.phase = 'error';
  clearWatch();
  current.overlay.classList.remove('is-starting');
  current.overlay.classList.add('is-error');
  current.overlay.querySelector('[data-launch-status]')?.replaceChildren('לא הצלחנו להתחיל');
  current.overlay.querySelector('[data-launch-message]')?.replaceChildren(message);
  const start = current.overlay.querySelector('[data-launch-confirm]');
  const back = current.overlay.querySelector('[data-launch-cancel]');
  if (start) {
    start.disabled = false;
    start.querySelector('span')?.replaceChildren('חזרה');
    start.querySelector('strong')?.replaceChildren('חזור לאימונים');
  }
  if (back) back.hidden = true;
}

function watchForResult(sourceButton) {
  let sawDisabled = false;
  const check = () => {
    if (!current || current.phase !== 'starting') return;
    if (document.querySelector('.active-workout-page')) {
      completeLaunch();
      return;
    }
    if (sourceButton?.isConnected && sourceButton.disabled) sawDisabled = true;
    if (sawDisabled && sourceButton?.isConnected && !sourceButton.disabled && performance.now() - current.confirmedAt > 450) {
      failLaunch('השרת לא הצליח לפתוח את האימון. נסה שוב בעוד רגע.');
      return;
    }
    if (performance.now() - current.confirmedAt > START_TIMEOUT_MS) {
      failLaunch('פתיחת האימון לוקחת יותר מדי זמן. חזור ונסה שוב.');
    }
  };

  observer = new MutationObserver(check);
  const app = document.querySelector('#app');
  if (app) observer.observe(app, { childList:true, subtree:true });
  watchTimer = window.setInterval(check, 140);
  check();
}

function confirmCurrent() {
  if (!current) return;
  if (current.phase === 'error') {
    leaveCurrent();
    return;
  }
  if (current.phase !== 'reading') return;

  const sourceButton = current.sourceButton;
  if (!sourceButton?.isConnected) {
    failLaunch('מסך האימונים השתנה. חזור ונסה שוב.');
    return;
  }

  current.phase = 'starting';
  current.confirmedAt = performance.now();
  current.overlay.classList.add('is-starting');
  current.overlay.querySelector('[data-launch-status]')?.replaceChildren('מתחיל עכשיו');
  current.overlay.querySelector('[data-launch-message]')?.replaceChildren('יוצר את האימון ומסנכרן את הסטים שלך…');
  const start = current.overlay.querySelector('[data-launch-confirm]');
  const back = current.overlay.querySelector('[data-launch-cancel]');
  if (start) {
    start.disabled = true;
    start.querySelector('span')?.replaceChildren('רק רגע');
    start.querySelector('strong')?.replaceChildren('פותח את האימון…');
  }
  if (back) back.disabled = true;

  watchForResult(sourceButton);
  bypassNextButton = sourceButton;
  requestAnimationFrame(() => sourceButton.click());
}

function cancelCurrent() {
  if (!current || current.phase !== 'reading') return;
  leaveCurrent();
}

function beginLaunch(button) {
  if (!button || current) return;
  const context = contextFor(button);
  document.body.insertAdjacentHTML('beforeend', htmlFor(context));
  const overlay = document.querySelector('[data-workout-launch]');
  if (!overlay) return;

  document.documentElement.classList.add('workout-launch-active');
  current = { overlay, sourceButton: button, phase:'reading', confirmedAt:0 };
  overlay.querySelector('[data-launch-confirm]')?.addEventListener('click', confirmCurrent);
  overlay.querySelector('[data-launch-cancel]')?.addEventListener('click', cancelCurrent);
}

/* Prevent the briefing from ever becoming a scroll surface on touch devices. */
function preventLaunchScroll(event) {
  if (!current?.overlay) return;
  if (current.overlay.contains(event.target)) event.preventDefault();
}
document.addEventListener('touchmove', preventLaunchScroll, { capture:true, passive:false });
document.addEventListener('wheel', preventLaunchScroll, { capture:true, passive:false });

/*
 * Intercept a NEW-workout click before app.js starts the backend session. The
 * briefing can therefore stay on screen indefinitely without the workout timer
 * running underneath it. Once the user confirms, the same button is clicked
 * programmatically with a one-shot bypass so the existing app start flow remains
 * the single source of truth for creating the session.
 */
document.addEventListener('click', (event) => {
  const button = event.target.closest?.('[data-start-workout]');
  if (!button || button.disabled) return;

  if (bypassNextButton === button) {
    bypassNextButton = null;
    return;
  }

  const label = clean(button.textContent);
  if (label.includes('המשך אימון')) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  beginLaunch(button);
}, true);

window.addEventListener('pagehide', removeCurrent, { passive:true });
window.addEventListener('orientationchange', () => {
  if (current?.phase === 'reading') leaveCurrent();
}, { passive:true });
