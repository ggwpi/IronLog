(() => {
  'use strict';

  if (window.__IRONLOG_BIGSCREEN_V4__) return;
  window.__IRONLOG_BIGSCREEN_V4__ = true;

  const style = document.createElement('style');
  style.id = 'ironlog-bigscreen-v4-polish';
  style.textContent = String.raw`
/* IronLog Big Screen v4 — pixel polish against the approved reference */
.workout-view{
  background:
    radial-gradient(ellipse 48% 37% at 50% 40%,rgba(205,255,0,.045),transparent 68%),
    radial-gradient(ellipse 84% 52% at 50% 79%,rgba(62,77,87,.055),transparent 70%),
    linear-gradient(180deg,#030709 0%,#05090c 48%,#030709 100%)!important;
}
.big-header{
  height:72px!important;min-height:72px!important;padding:5px 17px!important;
  border-bottom-color:rgba(34,45,52,.18)!important;
  background:linear-gradient(180deg,rgba(4,8,10,.82),rgba(4,8,10,.42))!important;
  grid-template-columns:56px 1fr 56px!important;
}
.big-round-btn{
  width:50px!important;height:50px!important;border-color:rgba(72,85,94,.47)!important;
  background:linear-gradient(180deg,rgba(17,24,29,.88),rgba(7,12,15,.9))!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 14px 36px rgba(0,0,0,.18)!important;
}
.big-workout-name{font-size:14px!important;letter-spacing:.105em!important}
.exercise-progress-pill{margin-top:6px!important;padding:6px 17px!important;border-color:rgba(58,70,78,.46)!important;background:rgba(7,12,15,.72)!important}
.big-workout-content{
  height:calc(100dvh - var(--safe-top) - 72px)!important;
  padding:8px 12px calc(var(--safe-bottom) + 8px)!important;
  grid-template-rows:88px minmax(0,1fr) 108px 59px 64px!important;
  gap:8px!important;
}
.big-title-block{align-content:start!important;padding-top:3px!important}
.big-title-block h1{
  max-width:min(94vw,780px)!important;margin:0 auto 8px!important;
  font-size:clamp(30px,8.1vw,42px)!important;line-height:.96!important;
  letter-spacing:-.04em!important;text-wrap:balance!important;
}
.big-title-block h1.title-long{font-size:clamp(25px,6.8vw,35px)!important;line-height:.94!important;max-width:95vw!important}
.big-title-block h1.title-very-long{font-size:clamp(23px,6.2vw,31px)!important;line-height:.93!important}
.video-link{font-size:12px!important;color:#8d959b!important;padding:1px 3px!important;opacity:.92}
.video-link span{font-size:16px!important;margin:0 8px!important;filter:drop-shadow(0 0 7px rgba(207,255,0,.14))}
.video-link small{font-size:9px!important;color:#666f76!important}
.big-hero-layout{
  grid-template-columns:minmax(103px,.97fr) minmax(124px,1.14fr) minmax(106px,.92fr)!important;
  gap:4px!important;align-items:center!important;
}
.set-progress-panel{transform:translateY(8%)!important}
.big-ring{
  width:clamp(116px,31vw,138px)!important;height:clamp(116px,31vw,138px)!important;
  box-shadow:0 0 38px rgba(207,255,0,.018)!important;
}
.big-ring:after{inset:9px!important;background:radial-gradient(circle at 50% 42%,#080e11,#04090c 72%)!important;box-shadow:inset 0 0 0 1px rgba(40,52,59,.35)!important}
.big-ring strong{font-size:clamp(36px,9.4vw,46px)!important}
.big-ring .ring-label{top:19%!important;font-size:9.5px!important;color:#bdc98d!important}
.big-ring .ring-caption{bottom:18%!important;font-size:8.5px!important;color:#788188!important}
.anatomy-stage{transform:translateY(-1%)!important}
.anatomy-glow{width:175px!important;height:270px!important;background:radial-gradient(circle,rgba(207,255,0,.07),rgba(88,106,116,.025) 42%,transparent 72%)!important;filter:blur(14px)!important}
.anatomy-figure{
  height:min(100%,326px)!important;
  filter:drop-shadow(0 22px 30px rgba(0,0,0,.62)) drop-shadow(0 0 18px rgba(120,135,144,.035))!important;
}
.anatomy-figure .body-shell{fill:url(#ironBody)!important;stroke:#7a858c!important;stroke-width:.78!important}
.anatomy-figure .body-mid{fill:url(#ironBodyMid)!important;stroke:#68747c!important;stroke-width:.72!important}
.anatomy-figure .body-highlight{fill:url(#ironHighlight)!important;opacity:.34!important}
.anatomy-figure .anatomy-line{stroke:#1d252a!important;stroke-width:.86!important;opacity:.88!important}
.anatomy-figure .muscle-zone{fill:#485159!important;stroke:#7d888f!important;stroke-width:.58!important;opacity:.36!important}
.anatomy-figure.zone-calves .zone-calves,.anatomy-figure.zone-hamstrings .zone-hamstrings,.anatomy-figure.zone-quads .zone-quads,.anatomy-figure.zone-glutes .zone-glutes,.anatomy-figure.zone-biceps .zone-biceps,.anatomy-figure.zone-triceps .zone-triceps,.anatomy-figure.zone-shoulders .zone-shoulders,.anatomy-figure.zone-chest .zone-chest,.anatomy-figure.zone-back .zone-back,.anatomy-figure.zone-abs .zone-abs{
  fill:url(#ironAccent)!important;stroke:#e9ff75!important;opacity:1!important;
  filter:drop-shadow(0 0 4px rgba(207,255,0,.8)) drop-shadow(0 0 10px rgba(207,255,0,.28))!important;
}
.muscle-target-card{
  transform:translateY(8%)!important;height:154px!important;padding:12px 8px 7px!important;
  border-color:rgba(66,78,86,.48)!important;border-radius:19px!important;
  background:linear-gradient(145deg,rgba(15,22,27,.82),rgba(7,12,15,.9))!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.014),0 14px 36px rgba(0,0,0,.12)!important;
}
.muscle-target-card>span{font-size:9px!important;color:#858e95!important}
.muscle-target-card strong{font-size:13.5px!important;line-height:1.08!important;margin:7px 0 3px!important;text-wrap:balance!important}
.muscle-target-card small{font-size:8px!important;color:#969fa5!important}
.mini-anatomy-wrap{width:75px!important;height:72px!important;margin-top:auto!important;background:radial-gradient(circle,rgba(92,106,115,.085),transparent 68%)!important}
.mini-anatomy-wrap svg{width:78px!important;height:78px!important;transition:transform .2s ease!important}
.mini-anatomy-wrap svg.zone-biceps,.mini-anatomy-wrap svg.zone-triceps,.mini-anatomy-wrap svg.zone-shoulders,.mini-anatomy-wrap svg.zone-chest,.mini-anatomy-wrap svg.zone-back{transform:scale(1.52)!important;transform-origin:50% 29%!important}
.mini-anatomy-wrap svg.zone-abs{transform:scale(1.45)!important;transform-origin:50% 45%!important}
.mini-anatomy-wrap svg.zone-quads,.mini-anatomy-wrap svg.zone-hamstrings,.mini-anatomy-wrap svg.zone-glutes{transform:scale(1.42)!important;transform-origin:50% 67%!important}
.mini-anatomy-wrap svg.zone-calves{transform:scale(1.55)!important;transform-origin:50% 87%!important}
.big-metrics{height:108px!important;min-height:108px!important;gap:8px!important}
.big-metric{
  height:108px!important;padding:8px 5px!important;border-color:rgba(54,66,74,.46)!important;border-radius:18px!important;
  background:linear-gradient(150deg,rgba(14,20,24,.82),rgba(7,12,15,.9))!important;
}
.metric-icon{width:22px!important;height:22px!important;margin-bottom:1px!important}.metric-icon svg{width:22px!important;height:22px!important;stroke-width:1.75!important}
.big-metric small{font-size:9px!important;margin-top:2px!important}.big-metric strong{font-size:clamp(25px,7vw,32px)!important;margin:3px 0 0!important;font-weight:850!important}.big-metric em{font-size:8px!important}
.big-actions{height:59px!important;grid-template-columns:1fr 1.4fr!important;gap:9px!important}
.dark-action,.lime-action{height:59px!important;border-radius:18px!important;font-size:13.5px!important}
.dark-action{border-color:rgba(54,66,74,.5)!important;background:linear-gradient(150deg,rgba(13,19,23,.88),rgba(7,11,14,.94))!important;color:#bcc4c9!important}
.lime-action{border-color:#c9f50a!important;background:linear-gradient(135deg,#cfff00,#afe600)!important;box-shadow:0 8px 24px rgba(193,239,0,.11)!important}
.next-exercise-strip{
  height:64px!important;min-height:64px!important;padding:6px 11px!important;
  border-color:rgba(54,66,74,.44)!important;border-radius:18px!important;
  background:linear-gradient(150deg,rgba(13,19,23,.86),rgba(7,11,14,.94))!important;
  grid-template-columns:34px minmax(0,1fr) 48px 25px!important;
}
.next-exercise-strip strong{font-size:14.5px!important}.next-exercise-strip small{font-size:8.5px!important;margin-top:4px!important}
.next-thumb{width:45px!important;height:45px!important;background:#0b1013!important;border-color:rgba(72,84,91,.48)!important;position:relative!important}
.next-thumb img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important;filter:saturate(.72) contrast(1.07) brightness(.72)!important;transform:scale(1.14)!important}
.next-thumb:has(img):after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,rgba(0,0,0,.22));pointer-events:none}
.next-chev{font-size:29px!important}
@media(max-width:390px){
  .big-workout-content{grid-template-rows:86px minmax(0,1fr) 104px 57px 61px!important;gap:7px!important;padding-left:9px!important;padding-right:9px!important}
  .big-hero-layout{grid-template-columns:minmax(99px,.96fr) minmax(116px,1.13fr) minmax(101px,.91fr)!important;gap:2px!important}
  .big-ring{width:clamp(110px,30vw,126px)!important;height:clamp(110px,30vw,126px)!important}
  .anatomy-figure{height:min(100%,306px)!important}
  .muscle-target-card{height:148px!important;padding-left:6px!important;padding-right:6px!important}.muscle-target-card strong{font-size:12.5px!important}
  .big-metrics,.big-metric{height:104px!important;min-height:104px!important}
  .big-metric strong{font-size:clamp(24px,7.2vw,30px)!important}
  .big-actions,.dark-action,.lime-action{height:57px!important}.next-exercise-strip{height:61px!important;min-height:61px!important}
}
@media(max-height:760px){
  .big-header{height:66px!important;min-height:66px!important}.big-workout-content{height:calc(100dvh - var(--safe-top) - 66px)!important;grid-template-rows:76px minmax(0,1fr) 92px 52px 55px!important;gap:6px!important;padding-top:5px!important}.big-title-block h1{font-size:clamp(26px,7vw,34px)!important}.big-title-block h1.title-long{font-size:clamp(22px,6vw,29px)!important}.big-metrics,.big-metric{height:92px!important;min-height:92px!important}.metric-icon{width:18px!important;height:18px!important}.metric-icon svg{width:18px!important;height:18px!important}.big-metric strong{font-size:25px!important}.big-actions,.dark-action,.lime-action{height:52px!important}.next-exercise-strip{height:55px!important;min-height:55px!important}.anatomy-figure{height:min(100%,270px)!important}.muscle-target-card{height:132px!important}.mini-anatomy-wrap{height:58px!important;width:62px!important}.mini-anatomy-wrap svg{width:64px!important;height:64px!important}
}
`;
  document.head.appendChild(style);

  const enhancedAnatomy = String.raw`
<defs>
  <linearGradient id="ironBody" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#69747b"/><stop offset=".34" stop-color="#3b454c"/><stop offset=".7" stop-color="#252e34"/><stop offset="1" stop-color="#566169"/></linearGradient>
  <linearGradient id="ironBodyMid" x1="0" x2="1"><stop offset="0" stop-color="#4f5a61"/><stop offset=".5" stop-color="#303a40"/><stop offset="1" stop-color="#59646b"/></linearGradient>
  <linearGradient id="ironHighlight" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c8d0d5" stop-opacity=".8"/><stop offset="1" stop-color="#738089" stop-opacity="0"/></linearGradient>
  <linearGradient id="ironAccent" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2ff32"/><stop offset=".46" stop-color="#cbff00"/><stop offset="1" stop-color="#8bd900"/></linearGradient>
</defs>
<g class="body-front">
  <ellipse class="body-shell" cx="90" cy="31" rx="19" ry="25"/>
  <path class="body-mid" d="M78 53 Q90 59 102 53 L107 71 L122 82 Q128 90 127 113 L122 163 Q119 185 111 205 L106 235 L74 235 L69 205 Q61 185 58 163 L53 113 Q52 90 58 82 L73 71Z"/>
  <path class="body-shell" d="M58 82 Q42 88 36 105 L29 157 36 208 46 205 43 158 52 118 65 96Z"/><path class="body-shell" d="M122 82 Q138 88 144 105 L151 157 144 208 134 205 137 158 128 118 115 96Z"/>
  <path class="body-shell" d="M74 231 Q64 252 63 284 L68 345 79 405 90 405 87 335 90 276 93 335 90 405 101 405 112 345 117 284 Q116 252 106 231Z"/>
  <path class="body-highlight" d="M77 57 Q90 64 101 57 L106 77 Q86 70 69 82Z"/>
  <path class="muscle-zone zone-shoulders" d="M58 82 Q47 87 44 100 Q51 109 61 108 L69 89Z"/><path class="muscle-zone zone-shoulders" d="M122 82 Q133 87 136 100 Q129 109 119 108 L111 89Z"/>
  <path class="muscle-zone zone-chest" d="M69 84 Q80 76 89 82 L88 111 Q77 116 67 108Z"/><path class="muscle-zone zone-chest" d="M111 84 Q100 76 91 82 L92 111 Q103 116 113 108Z"/>
  <path class="muscle-zone zone-biceps" d="M48 111 Q41 126 42 151 Q45 164 51 157 L57 125 58 107Z"/><path class="muscle-zone zone-biceps" d="M132 111 Q139 126 138 151 Q135 164 129 157 L123 125 122 107Z"/>
  <path class="muscle-zone zone-triceps" d="M42 119 Q37 140 38 164 L43 173 47 149 50 121Z"/><path class="muscle-zone zone-triceps" d="M138 119 Q143 140 142 164 L137 173 133 149 130 121Z"/>
  <path class="muscle-zone zone-abs" d="M78 116 Q90 120 102 116 L101 192 Q90 202 79 192Z"/>
  <path class="muscle-zone zone-quads" d="M70 243 Q64 270 68 309 L78 333 86 303 86 245Z"/><path class="muscle-zone zone-quads" d="M110 243 Q116 270 112 309 L102 333 94 303 94 245Z"/>
  <path class="muscle-zone zone-hamstrings" d="M72 262 Q69 291 74 321 L82 333 87 291 84 254Z"/><path class="muscle-zone zone-hamstrings" d="M108 262 Q111 291 106 321 L98 333 93 291 96 254Z"/>
  <path class="muscle-zone zone-glutes" d="M73 225 Q80 214 89 222 L88 245 Q77 247 71 239Z"/><path class="muscle-zone zone-glutes" d="M107 225 Q100 214 91 222 L92 245 Q103 247 109 239Z"/>
  <path class="muscle-zone zone-calves" d="M72 329 Q66 349 72 377 L79 390 85 366 83 334Z"/><path class="muscle-zone zone-calves" d="M108 329 Q114 349 108 377 L101 390 95 366 97 334Z"/>
  <path class="anatomy-line" d="M90 60 V205 M70 114 Q90 123 110 114 M76 137 H104 M77 158 H103 M78 179 H102 M90 235 V405 M65 238 Q90 252 115 238"/>
</g>
<g class="body-back">
  <ellipse class="body-shell" cx="90" cy="31" rx="19" ry="25"/>
  <path class="body-mid" d="M78 53 Q90 58 102 53 L108 71 123 82 Q130 94 127 120 L121 170 Q118 190 109 210 L105 235 75 235 71 210 Q62 190 59 170 L53 120 Q50 94 57 82 L72 71Z"/>
  <path class="body-shell" d="M57 82 Q41 90 36 107 L29 158 35 208 46 205 43 159 52 118 65 95Z"/><path class="body-shell" d="M123 82 Q139 90 144 107 L151 158 145 208 134 205 137 159 128 118 115 95Z"/>
  <path class="body-shell" d="M75 231 Q64 251 63 284 L68 345 79 405 90 405 87 335 90 276 93 335 90 405 101 405 112 345 117 284 Q116 251 105 231Z"/>
  <path class="muscle-zone zone-shoulders" d="M58 82 Q47 88 44 101 Q52 109 62 107 L69 88Z"/><path class="muscle-zone zone-shoulders" d="M122 82 Q133 88 136 101 Q128 109 118 107 L111 88Z"/>
  <path class="muscle-zone zone-back" d="M70 79 Q90 65 110 79 L116 102 106 161 90 181 74 161 64 102Z"/>
  <path class="muscle-zone zone-triceps" d="M49 108 Q39 127 41 158 L47 170 54 148 58 112Z"/><path class="muscle-zone zone-triceps" d="M131 108 Q141 127 139 158 L133 170 126 148 122 112Z"/>
  <path class="muscle-zone zone-biceps" d="M47 117 Q42 137 44 154 L49 162 54 139 55 114Z"/><path class="muscle-zone zone-biceps" d="M133 117 Q138 137 136 154 L131 162 126 139 125 114Z"/>
  <path class="muscle-zone zone-glutes" d="M72 213 Q80 203 89 211 L88 242 Q77 249 69 237Z"/><path class="muscle-zone zone-glutes" d="M108 213 Q100 203 91 211 L92 242 Q103 249 111 237Z"/>
  <path class="muscle-zone zone-hamstrings" d="M70 244 Q64 273 69 316 L80 336 87 300 85 247Z"/><path class="muscle-zone zone-hamstrings" d="M110 244 Q116 273 111 316 L100 336 93 300 95 247Z"/>
  <path class="muscle-zone zone-quads" d="M72 256 Q68 281 73 308 L80 325 86 292 84 250Z"/><path class="muscle-zone zone-quads" d="M108 256 Q112 281 107 308 L100 325 94 292 96 250Z"/>
  <path class="muscle-zone zone-calves" d="M70 327 Q63 349 70 378 L79 393 86 363 82 331Z"/><path class="muscle-zone zone-calves" d="M110 327 Q117 349 110 378 L101 393 94 363 98 331Z"/>
  <path class="muscle-zone zone-abs" d="M80 164 Q90 172 100 164 L101 204 Q90 211 79 204Z"/>
  <path class="anatomy-line" d="M90 57 V209 M67 91 Q90 110 113 91 M70 126 Q90 143 110 126 M90 235 V405 M65 239 Q90 252 115 239"/>
</g>`;

  function upgradeAnatomy() {
    const svg = document.getElementById('anatomyFigure');
    if (!svg || svg.dataset.v4 === '1') return;
    svg.innerHTML = enhancedAnatomy;
    svg.dataset.v4 = '1';
  }

  function titlePolish() {
    const title = document.getElementById('exerciseTitle');
    if (!title) return;
    const len = (title.textContent || '').trim().length;
    title.classList.toggle('title-long', len > 18);
    title.classList.toggle('title-very-long', len > 28);
  }

  function youtubeId(url) {
    if (!url) return null;
    const patterns = [/[?&]v=([^&#]+)/, /youtu\.be\/([^?&#/]+)/, /youtube\.com\/shorts\/([^?&#/]+)/, /youtube\.com\/embed\/([^?&#/]+)/];
    for (const pattern of patterns) {
      const match = String(url).match(pattern);
      if (match) return match[1];
    }
    return null;
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

  function updateNextThumbnail() {
    const thumb = document.querySelector('.next-thumb');
    if (!thumb) return;
    const { workout, index } = workoutContext();
    const next = workout?.exercises?.[index + 1];
    if (!next) {
      thumb.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="18" fill="#11181d"/><path d="M15 25l6 6 13-15" fill="none" stroke="#cfff00" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      return;
    }
    const id = youtubeId(next.video);
    if (id) {
      const label = (next.name || 'התרגיל הבא').replace(/"/g, '&quot;');
      thumb.innerHTML = `<img src="https://img.youtube.com/vi/${id}/mqdefault.jpg" alt="${label}" loading="eager" referrerpolicy="no-referrer">`;
    } else {
      thumb.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="7" y="29" width="34" height="4" rx="2" fill="#68747b"/><rect x="10" y="19" width="4" height="17" rx="2" fill="#cfff00"/><rect x="34" y="19" width="4" height="17" rx="2" fill="#cfff00"/><path d="M14 24h20" stroke="#9ca7ad" stroke-width="3" stroke-linecap="round"/></svg>';
    }
  }

  function syncMiniAnatomy() {
    const mini = document.querySelector('.mini-anatomy-wrap svg');
    const main = document.getElementById('anatomyFigure');
    if (!mini || !main) return;
    if (mini.dataset.v4 !== '1') {
      mini.innerHTML = enhancedAnatomy;
      mini.dataset.v4 = '1';
    }
    mini.setAttribute('class', main.getAttribute('class') || 'anatomy-figure zone-generic');
    const view = main.getAttribute('data-view');
    if (view) mini.setAttribute('data-view', view);
  }

  function refresh() {
    upgradeAnatomy();
    titlePolish();
    updateNextThumbnail();
    syncMiniAnatomy();
  }

  function boot() {
    refresh();
    const watch = ['exerciseTitle','exerciseIndex','nextExerciseName','muscleChip','anatomyFigure'];
    for (const id of watch) {
      const node = document.getElementById(id);
      if (!node) continue;
      new MutationObserver(() => requestAnimationFrame(refresh)).observe(node, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['class','data-view'] });
    }
    document.getElementById('workoutView')?.addEventListener('transitionend', refresh);
    document.addEventListener('click', event => {
      if (event.target.closest('#sheetStartBtn,[data-sheet-ex],#workoutNextBtn,#nextExerciseStrip,[data-pick]')) setTimeout(refresh, 40);
    });
    setInterval(() => {
      if (document.getElementById('workoutView')?.classList.contains('active')) refresh();
    }, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
