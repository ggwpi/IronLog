(() => {
  'use strict';

  if (window.__IRONLOG_BIGSCREEN_V6__) return;
  window.__IRONLOG_BIGSCREEN_V6__ = true;

  const FRONT_IMG = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Muscular_system.svg/500px-Muscular_system.svg.png';
  const BACK_IMG = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Muscular_system-back.svg/500px-Muscular_system-back.svg.png';

  const backZones = new Set(['back', 'triceps', 'hamstrings', 'glutes', 'calves']);
  const crops = {
    shoulders: '80 105 840 500',
    chest: '150 150 700 540',
    back: '120 90 760 700',
    biceps: '35 205 930 610',
    triceps: '35 205 930 610',
    abs: '220 290 560 650',
    glutes: '180 545 640 470',
    quads: '150 590 700 610',
    hamstrings: '150 590 700 620',
    calves: '180 850 640 520',
    generic: '0 0 1000 1400'
  };

  const exactThumbs = {
    'incline-smith': '_ZrCd4IDNSU',
    'chest-press-machine': 'pLofEAcfsO8',
    'barbell-curl': 'dDI8ClxRS04',
    'preacher-curl': 'Zbs3ko8ycyg',
    'cable-curl': 'dDI8ClxRS04',
    'lat-pulldown': 'GL3h256d6JM',
    'seated-cable-row': 'lJoozxC0Rns',
    'cable-crunch': '36HK6uPM_PQ',
    'leg-press-heavy': 'hiI-JdtEGIs',
    'leg-press-volume': 'hiI-JdtEGIs',
    'rear-delt-machine': 'vJYkqD7a0gM',
    'rear-delt-fly': 'vJYkqD7a0gM',
    'overhead-cable-ext': 'GzmlxvSFE7A',
    'overhead-cable-ext-b': 'GzmlxvSFE7A'
  };

  const fallbackThumbs = {
    chest: 'pLofEAcfsO8',
    biceps: 'dDI8ClxRS04',
    triceps: 'GzmlxvSFE7A',
    back: 'GL3h256d6JM',
    shoulders: 'vJYkqD7a0gM',
    legs: 'hiI-JdtEGIs',
    abs: '36HK6uPM_PQ',
    generic: 'pLofEAcfsO8'
  };

  const style = document.createElement('style');
  style.id = 'ironlog-bigscreen-v6-match';
  style.textContent = String.raw`
.workout-view{
  background:
    radial-gradient(ellipse 43% 38% at 50% 43%,rgba(142,158,168,.075),transparent 69%),
    radial-gradient(ellipse 70% 55% at 50% 74%,rgba(33,42,47,.08),transparent 73%),
    linear-gradient(180deg,#020608 0%,#04080b 53%,#020608 100%)!important;
}
.big-header{border-bottom-color:rgba(31,41,47,.035)!important;background:transparent!important}
.big-workout-content{grid-template-rows:76px minmax(0,1fr) 116px 59px 70px!important;gap:7px!important;padding-top:4px!important}
.big-title-block{align-content:start!important;padding-top:0!important}.big-title-block h1{font-size:clamp(32px,8.65vw,45px)!important;line-height:.95!important;margin-bottom:8px!important}.big-title-block h1.title-long{font-size:clamp(25px,6.7vw,35px)!important}.big-title-block h1.title-very-long{font-size:clamp(22px,5.9vw,30px)!important}
.big-hero-layout{grid-template-columns:minmax(116px,1.02fr) minmax(154px,1.32fr) minmax(116px,.97fr)!important;gap:1px!important;align-items:center!important}
.set-progress-panel{transform:translateY(4%)!important}.big-ring{width:clamp(132px,35vw,154px)!important;height:clamp(132px,35vw,154px)!important}.big-ring:after{inset:9px!important}.big-ring strong{font-size:clamp(40px,10.2vw,50px)!important}.big-ring .ring-label{font-size:10px!important}.big-ring .ring-caption{font-size:9px!important}
.anatomy-stage{transform:translateY(-2%)!important;overflow:visible!important;isolation:isolate!important}.anatomy-glow{width:205px!important;height:330px!important;background:radial-gradient(circle,rgba(173,189,198,.08),rgba(207,255,0,.016) 48%,transparent 74%)!important;filter:blur(15px)!important}
.v6-body-photo{position:absolute;z-index:1;left:50%;top:50%;height:min(100%,430px);width:auto;max-width:205px;transform:translate(-50%,-50%);object-fit:contain;filter:grayscale(1) brightness(.39) contrast(1.55) saturate(0);opacity:.98;pointer-events:none;user-select:none;-webkit-user-drag:none;drop-shadow:0 24px 30px rgba(0,0,0,.62)}
.anatomy-stage>.anatomy-figure{z-index:2!important;height:min(100%,430px)!important;width:min(100%,307px)!important;max-width:none!important;filter:drop-shadow(0 0 8px rgba(207,255,0,.08))!important;overflow:visible!important}.anatomy-stage>.anatomy-figure image{display:none!important}.v6-highlight{fill:#cfff00;stroke:#eaff6a;stroke-width:8;opacity:.97;filter:drop-shadow(0 0 13px rgba(207,255,0,.58))}
.muscle-target-card{height:174px!important;transform:translateY(4%)!important;padding:13px 8px 8px!important;border-color:rgba(56,68,75,.32)!important;background:linear-gradient(150deg,rgba(14,20,24,.76),rgba(5,10,13,.9))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.012),0 15px 38px rgba(0,0,0,.11)!important}.muscle-target-card strong{font-size:14px!important;line-height:1.08!important;margin:8px 0 3px!important}.muscle-target-card small{font-size:8.5px!important}.mini-anatomy-wrap{position:relative!important;width:88px!important;height:86px!important;margin-top:auto!important;overflow:hidden!important;border-radius:13px!important;background:radial-gradient(circle,rgba(124,139,148,.075),transparent 71%)!important}.v6-mini-photo{position:absolute;z-index:1;left:50%;top:50%;height:150px;width:auto;max-width:none;object-fit:contain;filter:grayscale(1) brightness(.43) contrast(1.48) saturate(0);transform:translate(-50%,-50%);opacity:.98;pointer-events:none}.mini-anatomy-wrap svg{position:relative!important;z-index:2!important;width:100%!important;height:100%!important;max-width:none!important;transform:none!important;filter:none!important}.mini-anatomy-wrap svg image{display:none!important}.mini-anatomy-wrap .v6-highlight{stroke-width:10;filter:drop-shadow(0 0 10px rgba(207,255,0,.52))}
.big-metrics,.big-metric{height:116px!important;min-height:116px!important}.big-metric{border-color:rgba(49,60,67,.32)!important;background:linear-gradient(150deg,rgba(13,19,23,.76),rgba(5,10,13,.91))!important}.big-metric strong{font-size:clamp(27px,7.25vw,34px)!important;font-weight:805!important}.big-metric.active{border-color:rgba(117,139,43,.48)!important;background:linear-gradient(150deg,rgba(20,29,14,.82),rgba(7,13,9,.94))!important}
.big-actions{height:59px!important}.dark-action,.lime-action{height:59px!important}.lime-action{background:linear-gradient(135deg,#d1f400,#b9df00)!important;border-color:#cce918!important;box-shadow:0 7px 22px rgba(191,229,0,.075)!important}.dark-action{border-color:rgba(50,61,68,.34)!important}
.next-exercise-strip{height:70px!important;min-height:70px!important;border-color:rgba(48,59,66,.31)!important;background:linear-gradient(150deg,rgba(12,18,22,.79),rgba(5,10,13,.92))!important;grid-template-columns:34px minmax(0,1fr) 54px 26px!important}.next-thumb{width:51px!important;height:51px!important;border-color:rgba(74,85,92,.36)!important;background:#0b1013!important}.next-thumb img{width:100%!important;height:100%!important;object-fit:cover!important;transform:none!important;filter:saturate(.72) contrast(1.08) brightness(.75)!important}.next-exercise-strip strong{font-size:15px!important}.next-exercise-strip small{font-size:9px!important}
.rest-controls:not([hidden]){display:none!important}.workout-view.rest-tools-open .rest-controls:not([hidden]){display:grid!important;position:fixed!important;z-index:150!important;left:50%!important;bottom:calc(var(--safe-bottom) + 132px)!important;width:min(calc(100vw - 38px),390px)!important;transform:translateX(-50%)!important;padding:7px!important;border:1px solid rgba(82,98,45,.62)!important;border-radius:17px!important;background:rgba(8,13,11,.98)!important;box-shadow:0 22px 62px rgba(0,0,0,.64)!important}.workout-view.rest-tools-open:after{content:'';position:fixed;z-index:145;inset:0;background:rgba(0,0,0,.22);pointer-events:none}.rest-controls{pointer-events:auto!important}.rest-controls .mini-btn{min-height:43px!important}
@media(max-width:390px){.big-workout-content{grid-template-rows:74px minmax(0,1fr) 112px 57px 66px!important;gap:6px!important;padding-left:8px!important;padding-right:8px!important}.big-hero-layout{grid-template-columns:minmax(108px,1fr) minmax(143px,1.29fr) minmax(108px,.96fr)!important}.big-ring{width:clamp(124px,34vw,143px)!important;height:clamp(124px,34vw,143px)!important}.v6-body-photo{height:min(100%,405px);max-width:193px}.anatomy-stage>.anatomy-figure{height:min(100%,405px)!important;width:min(100%,289px)!important}.muscle-target-card{height:164px!important}.mini-anatomy-wrap{width:82px!important;height:80px!important}.big-metrics,.big-metric{height:112px!important;min-height:112px!important}.next-exercise-strip{height:66px!important;min-height:66px!important}.next-thumb{width:48px!important;height:48px!important}}
@media(max-height:760px){.big-workout-content{grid-template-rows:68px minmax(0,1fr) 96px 51px 57px!important;gap:5px!important}.big-title-block h1{font-size:clamp(26px,7vw,35px)!important}.big-ring{width:112px!important;height:112px!important}.v6-body-photo{height:min(100%,326px);max-width:158px}.anatomy-stage>.anatomy-figure{height:min(100%,326px)!important;width:min(100%,232px)!important}.muscle-target-card{height:134px!important}.mini-anatomy-wrap{width:66px!important;height:64px!important}.v6-mini-photo{height:116px}.big-metrics,.big-metric{height:96px!important;min-height:96px!important}.big-actions,.dark-action,.lime-action{height:51px!important}.next-exercise-strip{height:57px!important;min-height:57px!important}.next-thumb{width:42px!important;height:42px!important}}
`;
  document.head.appendChild(style);

  function zoneFromClass(node) {
    if (!node) return 'generic';
    const cls = Array.from(node.classList).find(c => c.startsWith('zone-') && c !== 'zone-generic');
    return cls ? cls.slice(5) : 'generic';
  }

  function imageForZone(zone) {
    return backZones.has(zone) ? BACK_IMG : FRONT_IMG;
  }

  function highlightMarkup(zone) {
    const shapes = {
      shoulders: '<ellipse class="v6-highlight" cx="215" cy="285" rx="135" ry="105"/><ellipse class="v6-highlight" cx="785" cy="285" rx="135" ry="105"/>',
      chest: '<path class="v6-highlight" d="M265 260 Q500 180 735 260 L700 510 Q500 580 300 510Z"/>',
      back: '<path class="v6-highlight" d="M245 235 Q500 130 755 235 L705 650 Q500 760 295 650Z"/>',
      biceps: '<ellipse class="v6-highlight" cx="190" cy="485" rx="92" ry="175"/><ellipse class="v6-highlight" cx="810" cy="485" rx="92" ry="175"/>',
      triceps: '<ellipse class="v6-highlight" cx="185" cy="495" rx="88" ry="185"/><ellipse class="v6-highlight" cx="815" cy="495" rx="88" ry="185"/>',
      abs: '<path class="v6-highlight" d="M370 430 Q500 385 630 430 L610 795 Q500 850 390 795Z"/>',
      glutes: '<ellipse class="v6-highlight" cx="405" cy="785" rx="135" ry="105"/><ellipse class="v6-highlight" cx="595" cy="785" rx="135" ry="105"/>',
      quads: '<ellipse class="v6-highlight" cx="385" cy="900" rx="105" ry="245"/><ellipse class="v6-highlight" cx="615" cy="900" rx="105" ry="245"/>',
      hamstrings: '<ellipse class="v6-highlight" cx="385" cy="925" rx="100" ry="240"/><ellipse class="v6-highlight" cx="615" cy="925" rx="100" ry="240"/>',
      calves: '<ellipse class="v6-highlight" cx="390" cy="1180" rx="82" ry="205"/><ellipse class="v6-highlight" cx="610" cy="1180" rx="82" ry="205"/>'
    };
    return shapes[zone] || '';
  }

  function ensureMainPhoto() {
    const stage = document.querySelector('.anatomy-stage');
    if (!stage) return null;
    let img = stage.querySelector('.v6-body-photo');
    if (!img) {
      img = document.createElement('img');
      img.className = 'v6-body-photo';
      img.alt = '';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      stage.prepend(img);
    }
    return img;
  }

  function renderMainAnatomy() {
    const svg = document.getElementById('anatomyFigure');
    if (!svg) return;
    const zone = zoneFromClass(svg);
    const img = ensureMainPhoto();
    const src = imageForZone(zone);
    if (img && img.dataset.src !== src) {
      img.src = src;
      img.dataset.src = src;
    }
    const key = `v6:${zone}`;
    if (svg.dataset.v6Key === key) return;
    svg.innerHTML = highlightMarkup(zone);
    svg.setAttribute('viewBox', '0 0 1000 1400');
    svg.dataset.v6Key = key;
    svg.setAttribute('data-view', backZones.has(zone) ? 'back' : 'front');
  }

  function renderMiniAnatomy() {
    const main = document.getElementById('anatomyFigure');
    const wrap = document.querySelector('.mini-anatomy-wrap');
    const mini = wrap?.querySelector('svg');
    if (!main || !wrap || !mini) return;
    const zone = zoneFromClass(main);
    let img = wrap.querySelector('.v6-mini-photo');
    if (!img) {
      img = document.createElement('img');
      img.className = 'v6-mini-photo';
      img.alt = '';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      wrap.prepend(img);
    }
    const src = imageForZone(zone);
    if (img.dataset.src !== src) {
      img.src = src;
      img.dataset.src = src;
    }
    wrap.dataset.zone = zone;
    const crop = crops[zone] || crops.generic;
    mini.innerHTML = highlightMarkup(zone);
    mini.setAttribute('viewBox', crop);
    mini.setAttribute('class', `anatomy-figure zone-${zone}`);
    mini.dataset.v6Key = zone;
    const positioning = {
      shoulders: 'translate(-50%,-34%) scale(1.65)',
      chest: 'translate(-50%,-36%) scale(1.72)',
      back: 'translate(-50%,-35%) scale(1.62)',
      biceps: 'translate(-50%,-35%) scale(1.72)',
      triceps: 'translate(-50%,-35%) scale(1.72)',
      abs: 'translate(-50%,-47%) scale(1.58)',
      glutes: 'translate(-50%,-64%) scale(1.55)',
      quads: 'translate(-50%,-70%) scale(1.52)',
      hamstrings: 'translate(-50%,-70%) scale(1.52)',
      calves: 'translate(-50%,-82%) scale(1.56)',
      generic: 'translate(-50%,-50%) scale(1)'
    };
    img.style.transform = positioning[zone] || positioning.generic;
  }

  function workoutContext() {
    const program = window.IRONLOG_PROGRAM || [];
    const short = (document.getElementById('bigWorkoutTitle')?.textContent || '').trim();
    const indexText = document.getElementById('exerciseIndex')?.textContent || '';
    const match = indexText.match(/תרגיל\s+(\d+)/);
    const index = match ? Number(match[1]) - 1 : 0;
    const workout = program.find(w => String(w.short).trim() === short) || program.find(w => String(w.title).trim() === short);
    return { workout, index };
  }

  function fallbackGroup(exercise) {
    const muscle = String(exercise?.muscle || '');
    if (muscle.includes('חזה')) return 'chest';
    if (muscle.includes('יד קדמית')) return 'biceps';
    if (muscle.includes('יד אחורית')) return 'triceps';
    if (muscle.includes('גב') || muscle.includes('רחב')) return 'back';
    if (muscle.includes('כתף')) return 'shoulders';
    if (muscle.includes('בטן') || muscle.includes('ליבה')) return 'abs';
    if (muscle.includes('רגל') || muscle.includes('ארבע') || muscle.includes('המסטרינג') || muscle.includes('תאומים') || muscle.includes('ישבן')) return 'legs';
    return 'generic';
  }

  function syncNextThumbnail() {
    const thumb = document.querySelector('.next-thumb');
    if (!thumb) return;
    const { workout, index } = workoutContext();
    const next = workout?.exercises?.[index + 1];
    if (!next) {
      thumb.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="18" fill="#10171b"/><path d="M15 25l6 6 13-15" fill="none" stroke="#cfff00" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      return;
    }
    const id = exactThumbs[next.id] || fallbackThumbs[fallbackGroup(next)] || fallbackThumbs.generic;
    const src = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    const existing = thumb.querySelector('img');
    if (existing?.dataset.exerciseId === next.id) return;
    thumb.innerHTML = `<img src="${src}" data-exercise-id="${next.id}" alt="${String(next.name || 'Next exercise').replace(/"/g, '&quot;')}" loading="eager" referrerpolicy="no-referrer">`;
  }

  function setupRestControls() {
    const workoutView = document.getElementById('workoutView');
    const metric = document.getElementById('restMetric');
    const controls = document.getElementById('restControls');
    if (!workoutView || !metric || !controls || metric.dataset.v6Rest === '1') return;
    metric.dataset.v6Rest = '1';
    metric.style.cursor = 'pointer';
    metric.addEventListener('click', () => {
      if (controls.hidden) return;
      workoutView.classList.toggle('rest-tools-open');
    });
    controls.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', e => {
      if (!workoutView.classList.contains('rest-tools-open')) return;
      if (e.target.closest('#restMetric,#restControls')) return;
      workoutView.classList.remove('rest-tools-open');
    });
    new MutationObserver(() => {
      if (controls.hidden) workoutView.classList.remove('rest-tools-open');
    }).observe(controls, { attributes:true, attributeFilter:['hidden'] });
  }

  function refresh() {
    renderMainAnatomy();
    renderMiniAnatomy();
    syncNextThumbnail();
    setupRestControls();
  }

  function boot() {
    refresh();
    const target = document.getElementById('workoutView');
    if (target) {
      new MutationObserver(() => requestAnimationFrame(refresh)).observe(target, {
        subtree:true,
        childList:true,
        characterData:true,
        attributes:true,
        attributeFilter:['class','data-view']
      });
    }
    document.addEventListener('click', e => {
      if (e.target.closest('#sheetStartBtn,[data-sheet-ex],#workoutNextBtn,#nextExerciseStrip,[data-pick],#completeSetBtn,#skipSetBtn')) setTimeout(refresh, 50);
    });
    setInterval(() => {
      if (document.getElementById('workoutView')?.classList.contains('active')) refresh();
    }, 1100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
