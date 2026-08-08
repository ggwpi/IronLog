(() => {
  'use strict';
  if (window.__IRONLOG_CLEAN_ANATOMY__) return;
  window.__IRONLOG_CLEAN_ANATOMY__ = true;

  const backZones = new Set(['back','triceps','hamstrings','glutes','calves']);
  const cropByZone = {
    shoulders:'32 58 176 120', chest:'48 72 144 148', back:'42 66 156 190',
    biceps:'18 78 204 190', triceps:'18 78 204 190', abs:'72 142 96 190',
    glutes:'66 244 108 105', quads:'54 262 132 170', hamstrings:'54 262 132 170',
    calves:'58 352 124 146', generic:'0 0 240 520'
  };

  const style = document.createElement('style');
  style.id = 'ironlog-clean-anatomy-style';
  style.textContent = String.raw`
.v6-body-photo,.v6-mini-photo{display:none!important;visibility:hidden!important;opacity:0!important}
.workout-view{background:radial-gradient(ellipse 44% 39% at 50% 44%,rgba(129,145,154,.075),transparent 70%),linear-gradient(180deg,#020608 0%,#04090b 52%,#020608 100%)!important}
.anatomy-glow{background:radial-gradient(circle,rgba(153,169,178,.085),rgba(207,255,0,.012) 50%,transparent 74%)!important;filter:blur(16px)!important}
.anatomy-stage>.anatomy-figure{height:min(100%,438px)!important;width:min(100%,312px)!important;max-width:none!important;filter:drop-shadow(0 23px 32px rgba(0,0,0,.62))!important;overflow:visible!important}
.clean-anatomy .body-shell{fill:url(#ironBody);stroke:#78848b;stroke-width:1.15}.clean-anatomy .body-panel{fill:url(#ironPanel);stroke:#5e6a71;stroke-width:.75}.clean-anatomy .body-cut{fill:none;stroke:#1d272d;stroke-width:1.15;opacity:.82}.clean-anatomy .body-soft{fill:none;stroke:#59656c;stroke-width:.75;opacity:.52}.clean-anatomy .faceless-head{fill:url(#ironHead);stroke:#78838a;stroke-width:1.1}.clean-anatomy .accent-zone{fill:#cfff00;stroke:#eaff72;stroke-width:1.6;filter:url(#ironGlow);opacity:.98}
.mini-anatomy-wrap{position:relative!important;overflow:hidden!important;background:radial-gradient(circle,rgba(116,132,141,.075),transparent 72%)!important}.mini-anatomy-wrap svg.clean-anatomy{width:100%!important;height:100%!important;max-width:none!important;transform:none!important;filter:none!important}
@media(max-width:390px){.anatomy-stage>.anatomy-figure{height:min(100%,414px)!important;width:min(100%,295px)!important}}
@media(max-height:760px){.anatomy-stage>.anatomy-figure{height:min(100%,326px)!important;width:min(100%,232px)!important}}
`;
  document.head.appendChild(style);

  function zoneOf(node){
    const cls=Array.from(node?.classList||[]).find(c=>c.startsWith('zone-')&&c!=='zone-generic');
    return cls?cls.slice(5):'generic';
  }

  function defs(){return String.raw`<defs>
    <linearGradient id="ironBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#89939a"/><stop offset=".32" stop-color="#505a61"/><stop offset=".7" stop-color="#252f35"/><stop offset="1" stop-color="#68737a"/></linearGradient>
    <linearGradient id="ironPanel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#657077"/><stop offset=".55" stop-color="#333d43"/><stop offset="1" stop-color="#20292e"/></linearGradient>
    <radialGradient id="ironHead" cx="42%" cy="28%" r="80%"><stop offset="0" stop-color="#778188"/><stop offset=".62" stop-color="#3b454b"/><stop offset="1" stop-color="#1d262b"/></radialGradient>
    <filter id="ironGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>`}

  function body(back){
    const torso=back
      ?'<path class="body-shell" d="M82 84 Q120 63 158 84 L169 123 Q157 182 150 230 Q143 257 120 274 Q97 257 90 230 Q83 182 71 123Z"/>'
      :'<path class="body-shell" d="M82 84 Q120 66 158 84 L169 123 Q160 181 150 230 Q143 255 120 272 Q97 255 90 230 Q80 181 71 123Z"/>';
    const detail=back
      ?'<path class="body-panel" d="M89 99 Q120 76 151 99 L145 175 Q120 198 95 175Z"/><path class="body-cut" d="M120 82V237M94 116Q120 132 146 116M94 145Q120 158 146 145M99 178Q120 190 141 178"/>'
      :'<path class="body-panel" d="M91 100 Q120 83 149 100 L145 151 Q120 165 95 151Z"/><path class="body-panel" d="M101 158 H139 L136 230 Q120 241 104 230Z"/><path class="body-cut" d="M120 83V236M96 121Q120 132 144 121M105 177H135M106 198H134M108 218H132"/>';
    return `${defs()}<ellipse class="faceless-head" cx="120" cy="39" rx="24" ry="29"/><path class="body-panel" d="M109 64 L131 64 L136 84 Q120 93 104 84Z"/>${torso}${detail}
      <path class="body-shell" d="M73 100 Q55 109 48 139 L39 232 Q40 250 55 252 L66 178 L82 119Z"/><path class="body-shell" d="M167 100 Q185 109 192 139 L201 232 Q200 250 185 252 L174 178 L158 119Z"/>
      <path class="body-panel" d="M49 137 Q61 121 72 130 L63 189 Q54 198 44 188Z"/><path class="body-panel" d="M191 137 Q179 121 168 130 L177 189 Q186 198 196 188Z"/>
      <path class="body-shell" d="M92 242 Q120 226 148 242 L151 281 Q120 300 89 281Z"/>
      <path class="body-shell" d="M91 276 Q76 306 78 360 L88 426 Q93 445 105 438 L112 354 L117 291Z"/><path class="body-shell" d="M149 276 Q164 306 162 360 L152 426 Q147 445 135 438 L128 354 L123 291Z"/>
      <path class="body-shell" d="M88 421 Q82 454 92 492 L108 492 L112 436Z"/><path class="body-shell" d="M152 421 Q158 454 148 492 L132 492 L128 436Z"/>
      <path class="body-cut" d="M91 290Q102 313 112 329M149 290Q138 313 128 329M91 359Q101 378 108 398M149 359Q139 378 132 398"/><path class="body-soft" d="M53 154Q62 165 64 181M187 154Q178 165 176 181M96 265Q120 279 144 265"/>`;
  }

  function accent(zone){
    const m={
      shoulders:'<ellipse class="accent-zone" cx="72" cy="111" rx="20" ry="29"/><ellipse class="accent-zone" cx="168" cy="111" rx="20" ry="29"/>',
      chest:'<path class="accent-zone" d="M91 101 Q105 88 119 99 L117 146 Q102 151 94 139Z"/><path class="accent-zone" d="M149 101 Q135 88 121 99 L123 146 Q138 151 146 139Z"/>',
      back:'<path class="accent-zone" d="M91 97 Q120 76 149 97 L145 174 Q120 196 95 174Z"/>',
      biceps:'<ellipse class="accent-zone" cx="58" cy="159" rx="12" ry="31"/><ellipse class="accent-zone" cx="182" cy="159" rx="12" ry="31"/>',
      triceps:'<ellipse class="accent-zone" cx="55" cy="166" rx="11" ry="33"/><ellipse class="accent-zone" cx="185" cy="166" rx="11" ry="33"/>',
      abs:'<path class="accent-zone" d="M104 158 H136 L134 229 Q120 240 106 229Z"/>',
      glutes:'<ellipse class="accent-zone" cx="103" cy="265" rx="18" ry="18"/><ellipse class="accent-zone" cx="137" cy="265" rx="18" ry="18"/>',
      quads:'<path class="accent-zone" d="M92 282 Q81 311 83 356 Q91 378 106 360 L114 294Z"/><path class="accent-zone" d="M148 282 Q159 311 157 356 Q149 378 134 360 L126 294Z"/>',
      hamstrings:'<path class="accent-zone" d="M93 286 Q82 318 84 365 Q93 382 106 361 L114 295Z"/><path class="accent-zone" d="M147 286 Q158 318 156 365 Q147 382 134 361 L126 295Z"/>',
      calves:'<path class="accent-zone" d="M88 411 Q82 446 93 475 Q104 480 109 452 L111 423Z"/><path class="accent-zone" d="M152 411 Q158 446 147 475 Q136 480 131 452 L129 423Z"/>'
    };return m[zone]||'';
  }

  function paint(svg,zone,mini){
    const key=`clean:${zone}:${mini?'mini':'main'}`;
    if(svg.dataset.cleanKey===key)return;
    svg.innerHTML=body(backZones.has(zone))+accent(zone);
    svg.setAttribute('viewBox',mini?(cropByZone[zone]||cropByZone.generic):'0 0 240 520');
    svg.setAttribute('class',`anatomy-figure clean-anatomy zone-${zone}`);
    svg.setAttribute('data-view',backZones.has(zone)?'back':'front');
    svg.dataset.cleanKey=key;
  }

  let painting=false;
  function refresh(){
    if(painting)return;painting=true;
    try{
      document.querySelectorAll('.v6-body-photo,.v6-mini-photo').forEach(n=>n.remove());
      const main=document.getElementById('anatomyFigure');
      if(!main)return;
      const zone=zoneOf(main);
      paint(main,zone,false);
      let wrap=document.querySelector('.mini-anatomy-wrap');
      if(!wrap){
        const card=document.querySelector('.muscle-target-card');
        if(card){wrap=document.createElement('div');wrap.className='mini-anatomy-wrap';wrap.innerHTML='<svg aria-hidden="true"></svg>';card.appendChild(wrap)}
      }
      const mini=wrap?.querySelector('svg');if(mini)paint(mini,zone,true);
    }finally{painting=false}
  }

  function boot(){
    refresh();
    const view=document.getElementById('workoutView');
    if(view)new MutationObserver(()=>requestAnimationFrame(refresh)).observe(view,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-view']});
    document.addEventListener('click',()=>setTimeout(refresh,45));
    setInterval(()=>{if(view?.classList.contains('active'))refresh()},700);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
