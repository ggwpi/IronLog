(() => {
  'use strict';

  const css = String.raw`
/* IronLog Big Screen v2 — fixed one-screen workout layout */
.workout-view{
  height:100dvh!important;
  max-height:100dvh!important;
  overflow:hidden!important;
  overscroll-behavior:none!important;
  background:
    radial-gradient(circle at 50% 25%,rgba(207,255,0,.028),transparent 31%),
    linear-gradient(180deg,#04080a 0%,#05090c 56%,#040709 100%)!important;
}
.workout-view.active{display:block!important}
.workout-safe-top{height:var(--safe-top)!important}
.big-header{
  position:relative!important;top:auto!important;
  height:72px!important;min-height:72px!important;
  padding:7px 18px!important;
  border-bottom:1px solid rgba(27,36,43,.72)!important;
  background:rgba(4,8,10,.9)!important;
  -webkit-backdrop-filter:none!important;backdrop-filter:none!important;
  grid-template-columns:54px 1fr 54px!important;
}
.big-round-btn{
  width:48px!important;height:48px!important;
  border-color:#2a343c!important;
  background:linear-gradient(180deg,#0f151a,#080d11)!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 8px 24px rgba(0,0,0,.2)!important;
  font-size:20px!important;
}
.next-round{font-size:38px!important;color:var(--accent)!important}
.big-workout-name{font-size:14px!important;line-height:1!important;letter-spacing:.075em!important}
.exercise-progress-pill{
  margin-top:6px!important;padding:5px 13px!important;
  color:#8d969e!important;background:#080d11!important;border-color:#222d35!important;
  font-size:10px!important;line-height:1!important;
}
.big-workout-content{
  width:min(100%,1020px)!important;
  height:calc(100dvh - var(--safe-top) - 72px)!important;
  min-height:0!important;
  margin:0 auto!important;
  padding:9px 15px calc(var(--safe-bottom) + 8px)!important;
  overflow:hidden!important;
  display:grid!important;
  grid-template-rows:auto minmax(0,1fr) 96px 58px 54px!important;
  gap:8px!important;
  align-content:stretch!important;
}
.big-title-block{margin:0!important;text-align:center!important;align-self:center!important}
.big-title-block h1{
  margin:0 auto 5px!important;
  max-width:92vw!important;
  font-size:clamp(28px,7.6vw,42px)!important;
  line-height:1.02!important;
  letter-spacing:-.045em!important;
  white-space:normal!important;
}
.video-link{font-size:13px!important;line-height:1!important;padding:3px 6px!important}
.video-link span{width:23px!important;height:23px!important;margin:0 4px!important}
.video-link small{font-size:9px!important}

.big-hero-layout{
  min-height:0!important;height:100%!important;margin:0!important;
  display:grid!important;
  grid-template-columns:minmax(0,.9fr) minmax(0,1.18fr)!important;
  grid-template-rows:minmax(0,1fr) minmax(92px,.72fr)!important;
  grid-template-areas:"set anatomy" "muscle anatomy"!important;
  gap:5px 8px!important;
  align-items:center!important;
  direction:ltr!important;
}
.set-progress-panel{align-self:end!important;justify-self:center!important;padding-bottom:5px!important}
.set-progress-panel>span{margin-bottom:5px!important;color:#c2cb88!important;font-size:10px!important}
.set-progress-panel>small{margin-top:5px!important;font-size:9px!important;color:#7e878f!important}
.big-ring{
  width:clamp(98px,27vw,116px)!important;
  height:clamp(98px,27vw,116px)!important;
  background:conic-gradient(var(--accent) var(--progress),#172129 0)!important;
  box-shadow:0 0 34px rgba(207,255,0,.025)!important;
}
.big-ring:after{inset:7px!important;background:#050a0d!important;box-shadow:inset 0 0 0 1px #121a20!important}
.big-ring strong{font-size:clamp(31px,8.6vw,39px)!important}

.anatomy-stage{
  min-height:0!important;height:100%!important;align-self:stretch!important;
  display:flex!important;align-items:center!important;justify-content:center!important;
  overflow:hidden!important;
}
.anatomy-figure{
  height:min(100%,300px)!important;
  width:auto!important;max-width:100%!important;
  filter:drop-shadow(0 18px 25px rgba(0,0,0,.52)) contrast(1.05)!important;
}
.anatomy-glow{width:145px!important;height:205px!important;opacity:.8!important}
.body-base{fill:#4d565d!important;stroke:#8d969c!important;stroke-width:.65!important;opacity:.96!important}
.muscle-zone{opacity:.13!important}
.anatomy-figure.zone-calves .zone-calves,
.anatomy-figure.zone-hamstrings .zone-hamstrings,
.anatomy-figure.zone-quads .zone-quads,
.anatomy-figure.zone-glutes .zone-glutes,
.anatomy-figure.zone-biceps .zone-biceps,
.anatomy-figure.zone-triceps .zone-triceps,
.anatomy-figure.zone-shoulders .zone-shoulders,
.anatomy-figure.zone-chest .zone-chest,
.anatomy-figure.zone-back .zone-back,
.anatomy-figure.zone-abs .zone-abs{fill:var(--accent)!important;opacity:1!important}

.muscle-target-card{
  align-self:start!important;justify-self:stretch!important;
  width:100%!important;min-height:0!important;height:100%!important;
  padding:9px 8px!important;border-radius:18px!important;
  background:linear-gradient(155deg,#0d1419,#080e12)!important;
  display:grid!important;
  grid-template-columns:1fr 48px!important;
  grid-template-rows:auto auto auto!important;
  grid-template-areas:"label mini" "name mini" "english mini"!important;
  column-gap:5px!important;align-content:center!important;
  text-align:right!important;
}
.muscle-target-card>span{grid-area:label;font-size:9px!important;justify-self:end!important}
.muscle-target-card strong{grid-area:name;margin:4px 0 1px!important;font-size:15px!important;justify-self:end!important;line-height:1.05!important}
.muscle-target-card small{grid-area:english;font-size:8px!important;justify-self:end!important;color:#9aa3aa!important}
.mini-muscle-bars{display:none!important}
.mini-anatomy-wrap{grid-area:mini;width:44px;height:68px;display:grid;place-items:center;overflow:hidden;justify-self:center}
.mini-anatomy-wrap svg{height:67px;width:auto;filter:none!important}
.mini-anatomy-wrap .body-base{fill:#50585e!important;stroke:#818a90!important;stroke-width:1!important}
.mini-anatomy-wrap .muscle-zone{opacity:.11!important;filter:none!important}
.mini-anatomy-wrap .anatomy-figure.zone-calves .zone-calves,
.mini-anatomy-wrap .anatomy-figure.zone-hamstrings .zone-hamstrings,
.mini-anatomy-wrap .anatomy-figure.zone-quads .zone-quads,
.mini-anatomy-wrap .anatomy-figure.zone-glutes .zone-glutes,
.mini-anatomy-wrap .anatomy-figure.zone-biceps .zone-biceps,
.mini-anatomy-wrap .anatomy-figure.zone-triceps .zone-triceps,
.mini-anatomy-wrap .anatomy-figure.zone-shoulders .zone-shoulders,
.mini-anatomy-wrap .anatomy-figure.zone-chest .zone-chest,
.mini-anatomy-wrap .anatomy-figure.zone-back .zone-back,
.mini-anatomy-wrap .anatomy-figure.zone-abs .zone-abs{fill:var(--accent)!important;opacity:1!important;filter:none!important}

.big-metrics{
  height:96px!important;min-height:96px!important;margin:0!important;
  gap:7px!important;direction:ltr!important;
}
.big-metric{
  min-height:0!important;height:96px!important;
  padding:8px 5px!important;border-radius:18px!important;
  background:linear-gradient(155deg,#0d1419,#080e12)!important;
  direction:rtl!important;
}
.metric-icon{font-size:20px!important;height:22px!important;line-height:1!important}
.big-metric small{font-size:9px!important;margin-top:2px!important}
.big-metric strong{font-size:clamp(24px,7vw,30px)!important;margin:2px 0 0!important;line-height:1!important}
.big-metric em{font-size:8px!important;margin-top:2px!important}

.big-actions{height:58px!important;margin:0!important;gap:8px!important;grid-template-columns:1fr 1.45fr!important}
.dark-action,.lime-action{min-height:0!important;height:58px!important;border-radius:18px!important;font-size:14px!important}
.lime-action{box-shadow:0 8px 26px rgba(207,255,0,.12)!important}
.next-exercise-strip{
  height:54px!important;min-height:54px!important;margin:0!important;padding:7px 12px!important;
  border-radius:17px!important;grid-template-columns:34px 1fr 28px!important;gap:8px!important;
}
.next-exercise-strip .list-icon{font-size:21px!important}
.next-exercise-strip strong{font-size:13px!important;line-height:1!important}
.next-exercise-strip small{font-size:8px!important;margin-top:3px!important}
.next-chev{font-size:29px!important;line-height:1!important}

/* Inputs live in a bottom editor instead of stretching Big Screen */
.set-editor-backdrop{
  position:fixed;z-index:135;inset:0;background:rgba(0,0,0,.68);
  -webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);
}
.big-entry.set-editor-panel{
  position:fixed!important;z-index:140!important;
  left:12px!important;right:12px!important;bottom:calc(var(--safe-bottom) + 10px)!important;
  width:min(calc(100vw - 24px),520px)!important;margin:0 auto!important;
  padding:16px!important;border-radius:24px!important;
  transform:translateY(120%)!important;opacity:.7!important;
  transition:transform .26s cubic-bezier(.2,.8,.25,1),opacity .2s ease!important;
  box-shadow:0 -24px 80px rgba(0,0,0,.68)!important;
}
.big-entry.set-editor-panel.open{transform:translateY(0)!important;opacity:1!important}
.big-entry.set-editor-panel .entry-head h3{font-size:21px!important}
.big-entry.set-editor-panel .entry-grid{margin-top:13px!important;gap:7px!important}
.big-entry.set-editor-panel .entry-grid input{font-size:20px!important;padding:12px 7px!important}
.set-editor-actions{display:grid;grid-template-columns:.8fr 1.4fr;gap:8px;margin-top:12px;direction:ltr}
.set-editor-actions button{height:50px;border-radius:16px;font-weight:900;font-size:13px}
.set-editor-cancel{border:1px solid #2b363e;background:#11181d;color:#c6cdd2}
.set-editor-save{border:1px solid #d7ff14;background:linear-gradient(135deg,#dbff00,#bcf000);color:#090c06}

/* Video becomes an overlay, never a layout-expanding row */
.video-panel:not([hidden]){
  position:fixed!important;z-index:145!important;
  left:16px!important;right:16px!important;top:50%!important;
  width:min(calc(100vw - 32px),620px)!important;margin:auto!important;
  transform:translateY(-50%)!important;
  border-radius:22px!important;box-shadow:0 28px 100px rgba(0,0,0,.8)!important;
}
/* Rest controls float above actions and do not change viewport fit */
.rest-controls:not([hidden]){
  position:fixed!important;z-index:130!important;
  left:50%!important;bottom:calc(var(--safe-bottom) + 126px)!important;
  width:min(calc(100vw - 30px),430px)!important;margin:0!important;
  transform:translateX(-50%)!important;
  padding:6px!important;border:1px solid #34401f!important;border-radius:16px!important;
  background:rgba(10,15,13,.96)!important;box-shadow:0 14px 45px rgba(0,0,0,.5)!important;
}
.exercise-selector{top:calc(var(--safe-top) + 76px)!important;max-height:45dvh!important}

@media (min-width:761px){
  .big-header{height:80px!important;min-height:80px!important;grid-template-columns:64px 1fr 64px!important}
  .big-round-btn{width:54px!important;height:54px!important}
  .big-workout-content{
    height:calc(100dvh - var(--safe-top) - 80px)!important;
    grid-template-rows:auto minmax(0,1fr) 118px 64px 62px!important;
    gap:10px!important;padding:12px 40px calc(var(--safe-bottom) + 12px)!important;
  }
  .big-title-block h1{font-size:clamp(38px,4.5vw,55px)!important}
  .big-hero-layout{
    grid-template-columns:minmax(170px,1fr) minmax(230px,1.35fr) minmax(180px,1fr)!important;
    grid-template-rows:1fr!important;grid-template-areas:"set anatomy muscle"!important;gap:20px!important;
  }
  .set-progress-panel{align-self:center!important}
  .big-ring{width:165px!important;height:165px!important}.big-ring strong{font-size:47px!important}
  .anatomy-figure{height:min(100%,380px)!important}
  .muscle-target-card{height:190px!important;align-self:center!important;grid-template-columns:1fr 76px!important;padding:18px!important}
  .mini-anatomy-wrap{width:72px;height:130px}.mini-anatomy-wrap svg{height:122px}
  .muscle-target-card>span{font-size:11px!important}.muscle-target-card strong{font-size:22px!important}.muscle-target-card small{font-size:10px!important}
  .big-metrics,.big-metric{height:118px!important;min-height:118px!important}.big-metric strong{font-size:34px!important}
  .big-actions,.dark-action,.lime-action{height:64px!important}.next-exercise-strip{height:62px!important}
}

@media (max-height:760px) and (max-width:760px){
  .big-header{height:64px!important;min-height:64px!important;padding-block:5px!important}
  .big-round-btn{width:43px!important;height:43px!important}
  .big-workout-content{
    height:calc(100dvh - var(--safe-top) - 64px)!important;
    grid-template-rows:auto minmax(0,1fr) 84px 52px 48px!important;
    gap:6px!important;padding-top:6px!important;
  }
  .big-title-block h1{font-size:clamp(24px,7vw,32px)!important;margin-bottom:3px!important}
  .video-link{font-size:11px!important}.video-link span{width:20px!important;height:20px!important}
  .big-ring{width:88px!important;height:88px!important}.big-ring strong{font-size:28px!important}
  .set-progress-panel>span,.set-progress-panel>small{font-size:8px!important}
  .muscle-target-card{grid-template-columns:1fr 40px!important;padding:7px!important}.mini-anatomy-wrap{width:38px;height:58px}.mini-anatomy-wrap svg{height:56px}
  .anatomy-figure{height:min(100%,245px)!important}
  .big-metrics,.big-metric{height:84px!important;min-height:84px!important}.metric-icon{font-size:17px!important;height:18px!important}.big-metric strong{font-size:23px!important}
  .big-actions,.dark-action,.lime-action{height:52px!important}.dark-action,.lime-action{font-size:12px!important}
  .next-exercise-strip{height:48px!important;min-height:48px!important}
}
`;

  const style = document.createElement('style');
  style.id = 'ironlog-bigscreen-v2';
  style.textContent = css;
  document.head.appendChild(style);

  const ready = () => {
    const editor = document.querySelector('.big-entry');
    const completeBtn = document.getElementById('completeSetBtn');
    const mainAnatomy = document.getElementById('anatomyFigure');
    const muscleCard = document.querySelector('.muscle-target-card');
    if (!editor || !completeBtn || !mainAnatomy || !muscleCard) return;

    // Reference uses forward/right chevrons.
    const topNext = document.getElementById('workoutNextBtn');
    const stripNext = document.querySelector('.next-chev');
    if (topNext) topNext.textContent = '›';
    if (stripNext) stripNext.textContent = '›';

    // Move set inputs out of the fixed Big Screen composition.
    const backdrop = document.createElement('div');
    backdrop.className = 'set-editor-backdrop';
    backdrop.hidden = true;
    editor.classList.add('set-editor-panel');

    const editorActions = document.createElement('div');
    editorActions.className = 'set-editor-actions';
    editorActions.innerHTML = '<button type="button" class="set-editor-cancel">חזרה</button><button type="button" class="set-editor-save">שמור וסיים את הסט ✓</button>';
    editor.appendChild(editorActions);
    document.body.appendChild(backdrop);
    document.body.appendChild(editor);

    const cancelBtn = editorActions.querySelector('.set-editor-cancel');
    const saveBtn = editorActions.querySelector('.set-editor-save');
    const originalComplete = completeBtn.onclick;

    const openEditor = () => {
      backdrop.hidden = false;
      requestAnimationFrame(() => editor.classList.add('open'));
      editor.setAttribute('aria-hidden', 'false');
      setTimeout(() => document.getElementById('loadInput')?.focus({ preventScroll: true }), 180);
    };
    const closeEditor = () => {
      editor.classList.remove('open');
      editor.setAttribute('aria-hidden', 'true');
      setTimeout(() => { backdrop.hidden = true; }, 220);
    };

    completeBtn.onclick = (event) => {
      event?.preventDefault?.();
      openEditor();
    };
    cancelBtn.onclick = closeEditor;
    backdrop.onclick = closeEditor;
    saveBtn.onclick = () => {
      closeEditor();
      originalComplete?.call(completeBtn);
    };

    // Tapping "last load" can also pre-enter/edit the current set.
    document.getElementById('lastLoad')?.closest('.big-metric')?.addEventListener('click', openEditor);

    // Match the reference ring: 1/4 visually means 25%, not 0% completed.
    const syncRing = () => {
      const ring = document.getElementById('setRing');
      const text = document.getElementById('setRingText')?.textContent || '';
      const match = text.match(/(\d+)\s*\/\s*(\d+)/);
      if (!ring || !match) return;
      const current = Number(match[1]);
      const total = Math.max(1, Number(match[2]));
      ring.style.setProperty('--progress', `${Math.min(100, (current / total) * 100)}%`);
    };
    const ringObserver = new MutationObserver(syncRing);
    ringObserver.observe(document.getElementById('setRingText'), { childList: true, characterData: true, subtree: true });
    syncRing();

    // Put a miniature synchronized anatomy figure in the target-muscle card.
    const miniWrap = document.createElement('div');
    miniWrap.className = 'mini-anatomy-wrap';
    const mini = mainAnatomy.cloneNode(true);
    mini.removeAttribute('id');
    mini.querySelector('defs')?.remove();
    miniWrap.appendChild(mini);
    muscleCard.appendChild(miniWrap);

    const syncMini = () => {
      mini.setAttribute('class', mainAnatomy.getAttribute('class') || 'anatomy-figure zone-generic');
    };
    const anatomyObserver = new MutationObserver(syncMini);
    anatomyObserver.observe(mainAnatomy, { attributes: true, attributeFilter: ['class'] });
    syncMini();

    // Prevent any residual scroll position from previous versions.
    const workoutView = document.getElementById('workoutView');
    const activeObserver = new MutationObserver(() => {
      if (workoutView?.classList.contains('active')) workoutView.scrollTop = 0;
    });
    if (workoutView) activeObserver.observe(workoutView, { attributes: true, attributeFilter: ['class'] });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
})();
