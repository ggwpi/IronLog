(() => {
  'use strict';

  if (window.__IRONLOG_BIGSCREEN_V5__) return;
  window.__IRONLOG_BIGSCREEN_V5__ = true;

  const FRONT_IMG = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Muscular_system.svg/500px-Muscular_system.svg.png';
  const BACK_IMG = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Muscular_system-back.svg/500px-Muscular_system-back.svg.png';

  const thumbIds = {
    'preacher-curl': 'Zbs3ko8ycyg',
    'overhead-cable-ext': 'GzmlxvSFE7A',
    'overhead-cable-ext-b': 'GzmlxvSFE7A',
    'rear-delt-machine': 'o5OvdIVV61M'
  };

  const backZones = new Set(['back', 'triceps', 'hamstrings', 'glutes', 'calves']);
  const cropByZone = {
    shoulders: '90 120 820 480',
    chest: '180 170 640 520',
    back: '150 110 700 650',
    biceps: '70 220 860 560',
    triceps: '70 220 860 560',
    abs: '250 300 500 620',
    glutes: '220 570 560 420',
    quads: '200 620 600 560',
    hamstrings: '200 620 600 570',
    calves: '230 900 540 460',
    generic: '0 0 1000 1400'
  };

  const css = document.createElement('style');
  css.id = 'ironlog-bigscreen-v5-assets';
  css.textContent = String.raw`
.workout-view{background:radial-gradient(ellipse 38% 34% at 50% 43%,rgba(196,224,232,.055),transparent 70%),radial-gradient(ellipse 42% 36% at 50% 45%,rgba(207,255,0,.025),transparent 72%),linear-gradient(180deg,#030709 0%,#050a0d 51%,#030709 100%)!important}
.big-header{border-bottom-color:rgba(35,45,51,.09)!important}
.big-workout-content{grid-template-rows:80px minmax(0,1fr) 116px 59px 69px!important;gap:7px!important;padding-top:6px!important}
.big-title-block{padding-top:0!important;align-content:start!important}.big-title-block h1{margin-bottom:7px!important;font-size:clamp(31px,8.25vw,43px)!important;line-height:.96!important}.big-title-block h1.title-long{font-size:clamp(25px,6.7vw,34px)!important}.big-title-block h1.title-very-long{font-size:clamp(22px,5.9vw,29px)!important}
.video-link{font-size:12.5px!important}.video-link small{font-size:9.5px!important;color:#7f888e!important}
.big-hero-layout{align-items:center!important;grid-template-columns:minmax(108px,.98fr) minmax(146px,1.22fr) minmax(112px,.93fr)!important;gap:2px!important}.set-progress-panel{transform:translateY(5%)!important}
.big-ring{width:clamp(121px,32.5vw,145px)!important;height:clamp(121px,32.5vw,145px)!important}.big-ring:after{inset:9px!important}
.anatomy-stage{transform:none!important;overflow:visible!important}.anatomy-figure.real-anatomy{height:min(100%,390px)!important;width:min(100%,278px)!important;max-width:none!important;overflow:visible!important;filter:drop-shadow(0 24px 34px rgba(0,0,0,.66)) drop-shadow(0 0 18px rgba(208,222,229,.06))!important}.real-anatomy .anatomy-base-image{filter:url(#v5mono)}.real-anatomy .anatomy-accent-image{filter:url(#v5green);opacity:.98}
.muscle-target-card{height:166px!important;transform:translateY(5%)!important;padding:13px 8px 8px!important;border-color:rgba(59,71,79,.37)!important}.muscle-target-card strong{font-size:14px!important;line-height:1.08!important;margin-top:7px!important}.mini-anatomy-wrap{width:82px!important;height:80px!important;overflow:hidden!important;border-radius:13px!important}.mini-anatomy-wrap svg.real-anatomy{width:100%!important;height:100%!important;max-width:none!important;filter:none!important;transform:none!important}
.big-metrics,.big-metric{height:116px!important;min-height:116px!important}.big-metric{border-color:rgba(52,64,71,.37)!important;border-radius:19px!important;background:linear-gradient(150deg,rgba(13,20,24,.78),rgba(7,12,15,.91))!important}.big-metric strong{font-size:clamp(26px,7.15vw,33px)!important;font-weight:820!important}
.dark-action,.lime-action{height:59px!important}.lime-action{background:linear-gradient(135deg,#cbff00,#b8ed00)!important;border-color:#c5f50a!important;box-shadow:0 8px 23px rgba(192,237,0,.09)!important}
.next-exercise-strip{height:69px!important;min-height:69px!important;padding-top:7px!important;padding-bottom:7px!important;grid-template-columns:35px minmax(0,1fr) 52px 25px!important}.next-thumb{width:49px!important;height:49px!important}.next-thumb img{width:100%!important;height:100%!important;object-fit:cover!important;transform:scale(1.06)!important;filter:saturate(.82) contrast(1.06) brightness(.78)!important}.next-exercise-strip strong{font-size:15px!important}.next-exercise-strip small{font-size:9px!important;color:#899198!important}
.anatomy-credit{margin:12px 0 0;color:#657078;font-size:10px;line-height:1.45;text-align:center}.anatomy-credit a{color:#89959c;text-decoration:none}
@media(max-width:390px){.big-workout-content{grid-template-rows:78px minmax(0,1fr) 112px 57px 66px!important;gap:6px!important}.big-hero-layout{grid-template-columns:minmax(102px,.96fr) minmax(138px,1.20fr) minmax(106px,.91fr)!important}.anatomy-figure.real-anatomy{height:min(100%,370px)!important;width:min(100%,264px)!important}.big-ring{width:clamp(116px,31.5vw,136px)!important;height:clamp(116px,31.5vw,136px)!important}.muscle-target-card{height:158px!important}.mini-anatomy-wrap{width:76px!important;height:74px!important}.big-metrics,.big-metric{height:112px!important;min-height:112px!important}.next-exercise-strip{height:66px!important;min-height:66px!important}}
@media(max-height:760px){.big-workout-content{grid-template-rows:70px minmax(0,1fr) 96px 51px 56px!important;gap:5px!important}.anatomy-figure.real-anatomy{height:min(100%,318px)!important;width:min(100%,228px)!important}.big-ring{width:108px!important;height:108px!important}.muscle-target-card{height:132px!important}.big-metrics,.big-metric{height:96px!important;min-height:96px!important}.next-exercise-strip{height:56px!important;min-height:56px!important}}
`;
  document.head.appendChild(css);

  function zoneFromClass(node){if(!node)return'generic';const hit=Array.from(node.classList).find(c=>c.startsWith('zone-')&&c!=='zone-generic');return hit?hit.slice(5):'generic'}
  function clipDefs(){return String.raw`<clipPath id="v5clip-shoulders"><ellipse cx="215" cy="285" rx="135" ry="105"/><ellipse cx="785" cy="285" rx="135" ry="105"/></clipPath><clipPath id="v5clip-chest"><path d="M265 260 Q500 180 735 260 L700 510 Q500 580 300 510Z"/></clipPath><clipPath id="v5clip-back"><path d="M245 235 Q500 130 755 235 L705 650 Q500 760 295 650Z"/></clipPath><clipPath id="v5clip-biceps"><ellipse cx="190" cy="485" rx="92" ry="175"/><ellipse cx="810" cy="485" rx="92" ry="175"/></clipPath><clipPath id="v5clip-triceps"><ellipse cx="185" cy="495" rx="88" ry="185"/><ellipse cx="815" cy="495" rx="88" ry="185"/></clipPath><clipPath id="v5clip-abs"><path d="M370 430 Q500 385 630 430 L610 795 Q500 850 390 795Z"/></clipPath><clipPath id="v5clip-glutes"><ellipse cx="405" cy="785" rx="135" ry="105"/><ellipse cx="595" cy="785" rx="135" ry="105"/></clipPath><clipPath id="v5clip-quads"><ellipse cx="385" cy="900" rx="105" ry="245"/><ellipse cx="615" cy="900" rx="105" ry="245"/></clipPath><clipPath id="v5clip-hamstrings"><ellipse cx="385" cy="925" rx="100" ry="240"/><ellipse cx="615" cy="925" rx="100" ry="240"/></clipPath><clipPath id="v5clip-calves"><ellipse cx="390" cy="1180" rx="82" ry="205"/><ellipse cx="610" cy="1180" rx="82" ry="205"/></clipPath><clipPath id="v5clip-generic"><rect width="0" height="0"/></clipPath>`}
  function rendererMarkup(zone,mini=false){const back=backZones.has(zone);const src=back?BACK_IMG:FRONT_IMG;return{viewBox:mini?(cropByZone[zone]||cropByZone.generic):'0 0 1000 1400',html:String.raw`<defs><filter id="v5mono" x="-20%" y="-20%" width="140%" height="140%"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope=".64" intercept=".025"/><feFuncG type="linear" slope=".68" intercept=".028"/><feFuncB type="linear" slope=".72" intercept=".035"/></feComponentTransfer></filter><filter id="v5green" x="-20%" y="-20%" width="140%" height="140%"><feColorMatrix values=".12 .12 .04 0 .18  .28 .56 .10 0 .30  .02 .05 .01 0 .00  0 0 0 1 0"/><feComponentTransfer><feFuncR type="linear" slope="1.15"/><feFuncG type="linear" slope="1.35"/><feFuncB type="linear" slope=".55"/></feComponentTransfer></filter>${clipDefs()}</defs><image class="anatomy-base-image" href="${src}" x="0" y="0" width="1000" height="1400" preserveAspectRatio="xMidYMid meet"/><image class="anatomy-accent-image" href="${src}" x="0" y="0" width="1000" height="1400" preserveAspectRatio="xMidYMid meet" clip-path="url(#v5clip-${zone})"/>`}}
  function renderMain(){const svg=document.getElementById('anatomyFigure');if(!svg)return;const zone=zoneFromClass(svg);const key=`${zone}:${backZones.has(zone)?'back':'front'}`;if(svg.dataset.v5Key===key)return;const r=rendererMarkup(zone,false);svg.innerHTML=r.html;svg.setAttribute('viewBox',r.viewBox);svg.classList.add('real-anatomy');svg.dataset.v4='1';svg.dataset.v5Key=key;svg.setAttribute('data-view',backZones.has(zone)?'back':'front')}
  function renderMini(){const main=document.getElementById('anatomyFigure');const mini=document.querySelector('.mini-anatomy-wrap svg');if(!main||!mini)return;const zone=zoneFromClass(main);if(mini.dataset.v5Key===zone)return;const r=rendererMarkup(zone,true);mini.innerHTML=r.html;mini.setAttribute('viewBox',r.viewBox);mini.setAttribute('class',`anatomy-figure real-anatomy zone-${zone}`);mini.dataset.v4='1';mini.dataset.v5Key=zone;mini.setAttribute('data-view',backZones.has(zone)?'back':'front')}
  function workoutContext(){const program=window.IRONLOG_PROGRAM||[];const short=(document.getElementById('bigWorkoutTitle')?.textContent||'').trim();const indexText=document.getElementById('exerciseIndex')?.textContent||'';const match=indexText.match(/תרגיל\s+(\d+)/);const index=match?Number(match[1])-1:0;const workout=program.find(w=>String(w.short).trim()===short)||program.find(w=>String(w.title).trim()===short);return{workout,index}}
  function realNextThumbnail(){const thumb=document.querySelector('.next-thumb');if(!thumb)return;const{workout,index}=workoutContext();const next=workout?.exercises?.[index+1];if(!next)return;const videoId=thumbIds[next.id];if(!videoId)return;const desired=`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;const img=thumb.querySelector('img');if(img?.src===desired)return;thumb.innerHTML=`<img src="${desired}" alt="${String(next.name||'Next exercise').replace(/"/g,'&quot;')}" loading="eager" referrerpolicy="no-referrer">`}
  function polishTitle(){const title=document.getElementById('exerciseTitle');if(!title)return;const len=(title.textContent||'').trim().length;title.classList.toggle('title-long',len>18);title.classList.toggle('title-very-long',len>27)}
  function addCredits(){const dialog=document.querySelector('#settingsDialog form');if(!dialog||dialog.querySelector('.anatomy-credit'))return;const p=document.createElement('p');p.className='anatomy-credit';p.innerHTML='Anatomy imagery: <a href="https://commons.wikimedia.org/wiki/File:Muscular_system.svg" target="_blank" rel="noopener">Termininja / Wikimedia Commons</a>, CC BY-SA 3.0.';dialog.appendChild(p)}
  function refresh(){renderMain();renderMini();realNextThumbnail();polishTitle()}
  function boot(){addCredits();refresh();const target=document.getElementById('workoutView');if(target)new MutationObserver(()=>requestAnimationFrame(refresh)).observe(target,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','data-view']});document.addEventListener('click',e=>{if(e.target.closest('#sheetStartBtn,[data-sheet-ex],#workoutNextBtn,#nextExerciseStrip,[data-pick],#completeSetBtn,#skipSetBtn'))setTimeout(refresh,35)});setInterval(()=>{if(document.getElementById('workoutView')?.classList.contains('active'))refresh()},1000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();