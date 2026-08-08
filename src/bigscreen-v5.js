(() => {
  'use strict';
  if (window.__IRONLOG_BIGSCREEN_V5__) return;
  window.__IRONLOG_BIGSCREEN_V5__ = true;

  const FRONT = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Muscles_anterior.png/500px-Muscles_anterior.png';
  const BACK = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Muscles_posterior.png/500px-Muscles_posterior.png';
  const commons = name => `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(name)}?width=640`;

  const exerciseThumbs = {
    'preacher-curl': commons('Preacher curl.webp'),
    'leg-press-heavy': commons('Leg Press 1.jpg'),
    'leg-press-volume': commons('Leg Press 1.jpg'),
    'shoulder-press-machine': commons('ShoulderPressMachineExercise.JPG'),
    'walking-lunges': commons('Walking-lunges-3.png'),
    'standing-calf': commons('Calf-raises-1.png'),
    'seated-calf': commons('SeatedCalfRaiseMachineExercise.JPG')
  };

  const style = document.createElement('style');
  style.id = 'ironlog-bigscreen-v5';
  style.textContent = String.raw`
/* v5 — final reference fit */
.workout-view{background:radial-gradient(ellipse 54% 42% at 50% 42%,rgba(88,102,111,.075),transparent 68%),radial-gradient(ellipse 40% 34% at 50% 43%,rgba(204,255,0,.025),transparent 72%),linear-gradient(180deg,#020608 0%,#05090b 53%,#030709 100%)!important}
.big-header{border-bottom-color:rgba(55,67,74,.08)!important;background:transparent!important}
.big-round-btn{border-color:rgba(76,89,97,.38)!important;box-shadow:inset 0 1px rgba(255,255,255,.02),0 12px 30px rgba(0,0,0,.16)!important}
.big-workout-content{grid-template-rows:78px minmax(0,1fr) 118px 58px 70px!important;gap:8px!important;padding-top:6px!important}
.big-title-block{padding-top:0!important;align-content:start!important}.big-title-block h1{font-size:clamp(32px,8.8vw,46px)!important;line-height:.95!important;margin-bottom:9px!important}.big-title-block h1.title-long{font-size:clamp(26px,7vw,36px)!important}.big-title-block h1.title-very-long{font-size:clamp(23px,6.1vw,31px)!important}
.video-link{font-size:13px!important}.video-link small{font-size:9.5px!important;color:#737c82!important}
.big-hero-layout{grid-template-columns:minmax(112px,1fr) minmax(132px,1.16fr) minmax(112px,.94fr)!important;gap:3px!important;align-items:center!important}
.set-progress-panel{transform:translateY(10%)!important}.big-ring{width:clamp(126px,33vw,148px)!important;height:clamp(126px,33vw,148px)!important}.big-ring:after{inset:9px!important}.big-ring strong{font-size:clamp(39px,10vw,49px)!important}.big-ring .ring-label{top:19%!important;font-size:10px!important}.big-ring .ring-caption{bottom:18%!important;font-size:9px!important}
.anatomy-stage{transform:translateY(-7%)!important;isolation:isolate!important}.real-anatomy-photo{position:absolute!important;z-index:1!important;height:min(100%,356px)!important;width:auto!important;max-width:180px!important;object-fit:contain!important;opacity:.94!important;filter:grayscale(1) invert(1) contrast(1.22) brightness(.67)!important;mix-blend-mode:screen!important;pointer-events:none!important;transition:opacity .2s ease!important}.anatomy-stage .anatomy-glow{z-index:0!important;width:190px!important;height:290px!important;background:radial-gradient(circle,rgba(107,122,132,.095),rgba(204,255,0,.025) 44%,transparent 72%)!important;filter:blur(15px)!important}.anatomy-stage>.anatomy-figure{z-index:2!important;height:min(100%,350px)!important;width:auto!important;filter:none!important}.anatomy-stage>.anatomy-figure .body-shell,.anatomy-stage>.anatomy-figure .body-mid,.anatomy-stage>.anatomy-figure .body-highlight,.anatomy-stage>.anatomy-figure .anatomy-line{opacity:0!important}.anatomy-stage>.anatomy-figure .muscle-zone{opacity:0!important}.anatomy-stage>.anatomy-figure.zone-calves .zone-calves,.anatomy-stage>.anatomy-figure.zone-hamstrings .zone-hamstrings,.anatomy-stage>.anatomy-figure.zone-quads .zone-quads,.anatomy-stage>.anatomy-figure.zone-glutes .zone-glutes,.anatomy-stage>.anatomy-figure.zone-biceps .zone-biceps,.anatomy-stage>.anatomy-figure.zone-triceps .zone-triceps,.anatomy-stage>.anatomy-figure.zone-shoulders .zone-shoulders,.anatomy-stage>.anatomy-figure.zone-chest .zone-chest,.anatomy-stage>.anatomy-figure.zone-back .zone-back,.anatomy-stage>.anatomy-figure.zone-abs .zone-abs{opacity:.92!important;fill:#cfff00!important;stroke:#eaff69!important;filter:drop-shadow(0 0 5px rgba(207,255,0,.85)) drop-shadow(0 0 11px rgba(207,255,0,.35))!important}
.muscle-target-card{height:158px!important;transform:translateY(10%)!important;border-color:rgba(61,73,81,.38)!important;background:linear-gradient(145deg,rgba(15,21,25,.78),rgba(6,11,14,.88))!important;box-shadow:0 14px 34px rgba(0,0,0,.1),inset 0 1px rgba(255,255,255,.012)!important}.muscle-target-card strong{font-size:13px!important;line-height:1.08!important}.muscle-target-card small{font-size:8.5px!important}.mini-anatomy-wrap{position:relative!important;width:82px!important;height:78px!important;overflow:hidden!important;background:radial-gradient(circle,rgba(100,116,126,.075),transparent 70%)!important}.mini-real-anatomy{position:absolute!important;z-index:1!important;left:50%!important;top:50%!important;height:118px!important;width:auto!important;transform:translate(-50%,-50%) scale(1.05)!important;filter:grayscale(1) invert(1) contrast(1.18) brightness(.63)!important;mix-blend-mode:screen!important;opacity:.9!important}.mini-anatomy-wrap svg{position:relative!important;z-index:2!important}.mini-anatomy-wrap svg .body-shell,.mini-anatomy-wrap svg .body-mid,.mini-anatomy-wrap svg .body-highlight,.mini-anatomy-wrap svg .anatomy-line,.mini-anatomy-wrap svg .muscle-zone{opacity:0!important}.mini-anatomy-wrap svg.zone-calves .zone-calves,.mini-anatomy-wrap svg.zone-hamstrings .zone-hamstrings,.mini-anatomy-wrap svg.zone-quads .zone-quads,.mini-anatomy-wrap svg.zone-glutes .zone-glutes,.mini-anatomy-wrap svg.zone-biceps .zone-biceps,.mini-anatomy-wrap svg.zone-triceps .zone-triceps,.mini-anatomy-wrap svg.zone-shoulders .zone-shoulders,.mini-anatomy-wrap svg.zone-chest .zone-chest,.mini-anatomy-wrap svg.zone-back .zone-back,.mini-anatomy-wrap svg.zone-abs .zone-abs{opacity:.96!important;fill:#cfff00!important;stroke:#eaff69!important}
.big-metrics{height:118px!important;min-height:118px!important;gap:8px!important}.big-metric{height:118px!important;border-color:rgba(56,68,76,.36)!important;border-radius:19px!important;background:linear-gradient(150deg,rgba(13,19,23,.78),rgba(6,11,14,.9))!important;padding:10px 5px!important}.big-metric strong{font-size:clamp(27px,7.5vw,34px)!important;font-weight:820!important}.big-metric small{color:#929ba1!important;font-size:9.5px!important}.big-metric em{color:#828b91!important;font-size:8.5px!important}
.big-actions{height:58px!important}.dark-action,.lime-action{height:58px!important;font-size:13.5px!important}.dark-action{border-color:rgba(56,68,76,.38)!important}.lime-action{background:linear-gradient(135deg,#d4f300,#b9df00)!important;border-color:#d0ef13!important;box-shadow:0 7px 21px rgba(196,230,0,.08)!important}
.next-exercise-strip{height:70px!important;min-height:70px!important;border-color:rgba(56,68,76,.35)!important;background:linear-gradient(150deg,rgba(13,19,23,.8),rgba(6,11,14,.91))!important;padding:7px 12px!important;grid-template-columns:34px minmax(0,1fr) 52px 26px!important}.next-exercise-strip strong{font-size:15px!important}.next-exercise-strip small{font-size:9px!important;color:#858e94!important}.next-thumb{width:50px!important;height:50px!important;border-color:rgba(72,84,92,.38)!important}.next-thumb img{transform:none!important;filter:saturate(.7) contrast(1.08) brightness(.74)!important}
@media(max-width:390px){.big-workout-content{grid-template-rows:76px minmax(0,1fr) 112px 56px 66px!important;gap:7px!important}.big-hero-layout{grid-template-columns:minmax(105px,1fr) minmax(122px,1.14fr) minmax(104px,.92fr)!important}.big-ring{width:clamp(118px,32vw,136px)!important;height:clamp(118px,32vw,136px)!important}.real-anatomy-photo{height:min(100%,330px)!important;max-width:168px!important}.anatomy-stage>.anatomy-figure{height:min(100%,326px)!important}.muscle-target-card{height:150px!important}.big-metrics,.big-metric{height:112px!important;min-height:112px!important}.next-exercise-strip{height:66px!important;min-height:66px!important}.next-thumb{width:47px!important;height:47px!important}}
@media(max-height:760px){.big-workout-content{grid-template-rows:68px minmax(0,1fr) 96px 50px 56px!important}.big-title-block h1{font-size:clamp(26px,7vw,35px)!important}.big-title-block h1.title-long{font-size:clamp(22px,5.9vw,29px)!important}.real-anatomy-photo{height:min(100%,286px)!important}.anatomy-stage>.anatomy-figure{height:min(100%,280px)!important}.big-metrics,.big-metric{height:96px!important;min-height:96px!important}.big-actions,.dark-action,.lime-action{height:50px!important}.next-exercise-strip{height:56px!important;min-height:56px!important}.muscle-target-card{height:130px!important}}
`;
  document.head.appendChild(style);

  function context() {
    const p = window.IRONLOG_PROGRAM || [];
    const short = (document.getElementById('bigWorkoutTitle')?.textContent || '').trim();
    const ixText = document.getElementById('exerciseIndex')?.textContent || '';
    const match = ixText.match(/תרגיל\s+(\d+)/);
    const index = match ? Number(match[1]) - 1 : 0;
    const workout = p.find(w => String(w.short).trim() === short);
    return {workout,index};
  }

  function currentView() {
    return document.getElementById('anatomyFigure')?.getAttribute('data-view') === 'back' ? 'back' : 'front';
  }

  function ensurePhotos() {
    const stage = document.querySelector('.anatomy-stage');
    if (stage && !stage.querySelector('.real-anatomy-photo')) {
      const img = document.createElement('img');
      img.className = 'real-anatomy-photo';
      img.alt = '';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      stage.prepend(img);
    }
    const mini = document.querySelector('.mini-anatomy-wrap');
    if (mini && !mini.querySelector('.mini-real-anatomy')) {
      const img = document.createElement('img');
      img.className = 'mini-real-anatomy';
      img.alt = '';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      mini.prepend(img);
    }
  }

  function syncPhotos() {
    ensurePhotos();
    const src = currentView() === 'back' ? BACK : FRONT;
    const main = document.querySelector('.real-anatomy-photo');
    const mini = document.querySelector('.mini-real-anatomy');
    if (main && main.src !== src) main.src = src;
    if (mini && mini.src !== src) mini.src = src;
  }

  function syncThumb() {
    const {workout,index} = context();
    const next = workout?.exercises?.[index + 1];
    const thumb = document.querySelector('.next-thumb');
    if (!next || !thumb) return;
    const src = exerciseThumbs[next.id];
    if (!src) return;
    thumb.innerHTML = `<img src="${src}" alt="${String(next.name || '').replace(/"/g,'&quot;')}" loading="eager" referrerpolicy="no-referrer">`;
  }

  function keepTitleBalanced() {
    const title = document.getElementById('exerciseTitle');
    if (!title) return;
    const len = (title.textContent || '').trim().length;
    title.classList.toggle('title-long', len > 18);
    title.classList.toggle('title-very-long', len > 29);
  }

  function refresh() {
    syncPhotos();
    syncThumb();
    keepTitleBalanced();
  }

  function boot() {
    refresh();
    const target = document.getElementById('workoutView') || document.body;
    new MutationObserver(() => requestAnimationFrame(refresh)).observe(target,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','data-view']});
    document.addEventListener('click',e=>{if(e.target.closest('#workoutNextBtn,#nextExerciseStrip,[data-pick],[data-sheet-ex],#sheetStartBtn')) setTimeout(refresh,70)});
    window.addEventListener('focus',refresh);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
