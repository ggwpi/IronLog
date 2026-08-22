import { WORKOUTS } from './workout-catalog.js';
import { escapeHtml } from '../../core/escape-html.js';

const MIN_VISIBLE_MS = 1550;
const READY_HOLD_MS = 430;
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

function metric(value, label, suffix = '') {
  return `<div class="workout-launch__metric"><strong>${value == null ? '—' : `${value}${suffix}`}</strong><span>${escapeHtml(label)}</span></div>`;
}

function htmlFor(context) {
  const targetMarkup = context.targets.slice(0,4).map((target) => `<span>${escapeHtml(target)}</span>`).join('');
  return `<div class="workout-launch" role="status" aria-live="polite" data-workout-launch>
    <div class="workout-launch__top">
      <div class="workout-launch__brand"><i aria-hidden="true"></i><span>IRONLOG / SESSION</span></div>
      <span class="workout-launch__status" data-launch-status>מכין את האימון</span>
    </div>
    <div class="workout-launch__main">
      <section class="workout-launch__copy">
        <span class="workout-launch__eyebrow">האימון של היום</span>
        <h1>${escapeHtml(context.title)}</h1>
        <p>${escapeHtml(context.subtitle)}</p>
        <div class="workout-launch__targets">${targetMarkup}</div>
        <div class="workout-launch__metrics">
          ${metric(context.exercises,'תרגילים')}
          ${metric(context.sets,'סטים')}
          ${metric(context.minutes,'דקות','')}
        </div>
        <div class="workout-launch__focus"><small>דגש להיום</small><strong>${escapeHtml(context.focus)}</strong></div>
      </section>
      <div class="workout-launch__art"><img src="${escapeHtml(context.image)}" alt="" loading="eager"></div>
    </div>
    <div class="workout-launch__footer">
      <div class="workout-launch__progress"><i></i></div>
      <p data-launch-message>פותח את האימון ומסנכרן את הסטים שלך…</p>
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
  document.documentElement.classList.remove('workout-launch-active');
}

function revealLiveScreen() {
  const page = document.querySelector('.active-workout-page');
  if (!page) return;
  page.classList.remove('workout-launch-reveal');
  void page.offsetWidth;
  page.classList.add('workout-launch-reveal');
  window.setTimeout(() => page.classList.remove('workout-launch-reveal'), reducedMotion() ? 20 : 700);
}

function completeLaunch() {
  if (!current || current.completed) return;
  current.completed = true;
  const elapsed = performance.now() - current.startedAt;
  const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);

  window.setTimeout(() => {
    if (!current) return;
    current.overlay.classList.add('is-ready');
    current.overlay.querySelector('[data-launch-status]')?.replaceChildren('מוכן');
    current.overlay.querySelector('[data-launch-message]')?.replaceChildren('הכול מוכן. מתחילים.');
    revealLiveScreen();

    window.setTimeout(() => {
      if (!current) return;
      current.overlay.classList.add('is-leaving');
      window.setTimeout(removeCurrent, reducedMotion() ? 30 : REMOVE_MS);
    }, reducedMotion() ? 40 : READY_HOLD_MS);
  }, wait);
}

function failLaunch() {
  if (!current || current.completed) return;
  current.completed = true;
  current.overlay.classList.add('is-ready');
  current.overlay.querySelector('[data-launch-status]')?.replaceChildren('לא הצלחנו להתחיל');
  current.overlay.querySelector('[data-launch-message]')?.replaceChildren('חוזר למסך האימונים…');
  window.setTimeout(() => {
    if (!current) return;
    current.overlay.classList.add('is-leaving');
    window.setTimeout(removeCurrent, reducedMotion() ? 30 : REMOVE_MS);
  }, reducedMotion() ? 60 : 700);
}

function watchForResult(sourceButton) {
  let sawDisabled = false;
  const check = () => {
    if (!current) return;
    if (document.querySelector('.active-workout-page')) {
      completeLaunch();
      return;
    }
    if (sourceButton?.isConnected && sourceButton.disabled) sawDisabled = true;
    if (sawDisabled && sourceButton?.isConnected && !sourceButton.disabled && performance.now() - current.startedAt > 450) {
      failLaunch();
    }
  };

  observer = new MutationObserver(check);
  const app = document.querySelector('#app');
  if (app) observer.observe(app, { childList:true, subtree:true });
  watchTimer = window.setInterval(check, 140);
  check();
}

function beginLaunch(button) {
  if (!button || current) return;
  const label = clean(button.textContent);
  if (label.includes('המשך אימון')) return;

  const context = contextFor(button);
  document.body.insertAdjacentHTML('beforeend', htmlFor(context));
  const overlay = document.querySelector('[data-workout-launch]');
  if (!overlay) return;

  document.documentElement.classList.add('workout-launch-active');
  current = { overlay, startedAt: performance.now(), sourceButton: button, completed:false };
  watchForResult(button);
}

document.addEventListener('click', (event) => {
  const button = event.target.closest?.('[data-start-workout]');
  if (!button || button.disabled) return;
  beginLaunch(button);
}, true);

window.addEventListener('pagehide', removeCurrent, { passive:true });
window.addEventListener('orientationchange', removeCurrent, { passive:true });
