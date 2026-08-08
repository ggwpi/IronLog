(() => {
  'use strict';

  const css = String.raw`
/* IronLog Big Screen v3 — reference composition */
.workout-view{
  height:100dvh!important;max-height:100dvh!important;overflow:hidden!important;overscroll-behavior:none!important;
  background:
    radial-gradient(ellipse at 50% 38%,rgba(187,255,0,.035),transparent 34%),
    radial-gradient(ellipse at 50% 100%,rgba(255,255,255,.018),transparent 45%),
    linear-gradient(180deg,#04080a 0%,#05090c 52%,#040709 100%)!important;
}
.workout-view.active{display:block!important}
.workout-safe-top{height:var(--safe-top)!important}
.big-header{
  position:relative!important;top:auto!important;height:76px!important;min-height:76px!important;
  padding:7px 18px!important;border-bottom:1px solid rgba(29,39,46,.45)!important;background:rgba(4,8,10,.72)!important;
  -webkit-backdrop-filter:none!important;backdrop-filter:none!important;grid-template-columns:58px 1fr 58px!important;
}
.big-round-btn{
  width:52px!important;height:52px!important;border:1px solid #2a343c!important;background:linear-gradient(180deg,#10161b,#090e12)!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 10px 28px rgba(0,0,0,.22)!important;font-size:21px!important;
}
.next-round{font-size:41px!important;color:var(--accent)!important}
.big-workout-name{font-size:14px!important;line-height:1!important;letter-spacing:.085em!important;color:var(--accent)!important}
.exercise-progress-pill{margin-top:7px!important;padding:6px 15px!important;font-size:10px!important;line-height:1!important;color:#8f989f!important;background:#080d11!important;border-color:#263039!important}
.exercise-progress-pill .exercise-current{color:var(--accent);font-weight:950}

.big-workout-content{
  width:min(100%,1040px)!important;height:calc(100dvh - var(--safe-top) - 76px)!important;min-height:0!important;margin:0 auto!important;
  padding:11px 12px calc(var(--safe-bottom) + 10px)!important;overflow:hidden!important;display:grid!important;
  grid-template-rows:82px minmax(0,1fr) 116px 64px 62px!important;gap:9px!important;align-content:stretch!important;
}
.big-title-block{margin:0!important;text-align:center!important;display:grid!important;align-content:center!important;justify-items:center!important}
.big-title-block h1{margin:0 auto 8px!important;max-width:92vw!important;font-size:clamp(30px,8.5vw,44px)!important;line-height:.98!important;letter-spacing:-.045em!important}
.video-link{border:0!important;background:transparent!important;color:#9da5ab!important;font-size:13px!important;font-weight:760!important;padding:2px 4px!important;line-height:1!important}
.video-link span{display:inline!important;width:auto!important;height:auto!important;margin:0 7px!important;border-radius:0!important;background:transparent!important;color:var(--accent)!important;font-size:17px!important;vertical-align:-1px!important}
.video-link small{font-size:9px!important;color:#707980!important;font-weight:500!important}

.big-hero-layout{
  min-height:0!important;height:100%!important;margin:0!important;display:grid!important;
  grid-template-columns:minmax(100px,.92fr) minmax(118px,1.10fr) minmax(104px,.96fr)!important;
  grid-template-areas:"set anatomy muscle"!important;grid-template-rows:1fr!important;gap:6px!important;align-items:center!important;direction:ltr!important;
}
.set-progress-panel{grid-area:set!important;align-self:center!important;justify-self:center!important;direction:rtl!important;padding:0!important}
.set-progress-panel>span,.set-progress-panel>small{display:none!important}
.big-ring{
  width:clamp(108px,29vw,132px)!important;height:clamp(108px,29vw,132px)!important;background:conic-gradient(var(--accent) var(--progress),#18222a 0)!important;
  box-shadow:0 0 42px rgba(207,255,0,.025)!important;position:relative!important;display:grid!important;place-items:center!important;
}
.big-ring:after{inset:8px!important;background:#050a0d!important;box-shadow:inset 0 0 0 1px #11191e!important}
.big-ring strong{font-size:clamp(34px,9vw,43px)!important;letter-spacing:-.065em!important;z-index:2!important;line-height:1!important}
.big-ring .ring-label,.big-ring .ring-caption{position:absolute!important;z-index:3!important;left:0!important;right:0!important;text-align:center!important}
.big-ring .ring-label{top:20%!important;color:#c8d68d!important;font-size:9px!important;font-weight:650!important}
.big-ring .ring-caption{bottom:19%!important;color:#7e878e!important;font-size:8px!important}

.anatomy-stage{grid-area:anatomy!important;position:relative!important;min-height:0!important;height:100%!important;display:grid!important;place-items:center!important;overflow:visible!important}
.anatomy-glow{position:absolute!important;width:145px!important;height:235px!important;border-radius:50%!important;background:radial-gradient(circle,rgba(207,255,0,.065),transparent 70%)!important;filter:blur(12px)!important;pointer-events:none!important}
.anatomy-figure{position:relative!important;z-index:1!important;height:min(100%,310px)!important;width:auto!important;max-width:100%!important;filter:drop-shadow(0 19px 28px rgba(0,0,0,.58))!important;overflow:visible!important}
.anatomy-figure .body-front,.anatomy-figure .body-back{display:none}
.anatomy-figure[data-view="front"] .body-front{display:block}
.anatomy-figure[data-view="back"] .body-back{display:block}
.anatomy-figure .body-shell{fill:#3f484f;stroke:#778188;stroke-width:1.15}
.anatomy-figure .body-mid{fill:#4c555c;stroke:#717b82;stroke-width:.9}
.anatomy-figure .anatomy-line{fill:none;stroke:#273038;stroke-width:1.25;opacity:.9}
.anatomy-figure .muscle-zone{fill:#596269;stroke:#7a848a;stroke-width:.65;opacity:.5;transition:fill .25s ease,opacity .25s ease,filter .25s ease}
.anatomy-figure.zone-calves .zone-calves,.anatomy-figure.zone-hamstrings .zone-hamstrings,.anatomy-figure.zone-quads .zone-quads,.anatomy-figure.zone-glutes .zone-glutes,.anatomy-figure.zone-biceps .zone-biceps,.anatomy-figure.zone-triceps .zone-triceps,.anatomy-figure.zone-shoulders .zone-shoulders,.anatomy-figure.zone-chest .zone-chest,.anatomy-figure.zone-back .zone-back,.anatomy-figure.zone-abs .zone-abs{fill:var(--accent)!important;stroke:#e4ff62!important;opacity:1!important;filter:drop-shadow(0 0 8px rgba(207,255,0,.65))!important}

.muscle-target-card{
  grid-area:muscle!important;align-self:center!important;justify-self:stretch!important;width:100%!important;height:158px!important;min-height:0!important;
  padding:13px 8px 8px!important;border:1px solid rgba(53,65,73,.75)!important;border-radius:20px!important;background:linear-gradient(155deg,rgba(15,22,27,.92),rgba(8,13,17,.94))!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.02),0 16px 36px rgba(0,0,0,.16)!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;text-align:center!important;direction:rtl!important;
}
.muscle-target-card>span{font-size:9px!important;color:#8e979f!important;line-height:1!important}
.muscle-target-card>span i{width:8px!important;height:8px!important;margin-inline-start:4px!important}
.muscle-target-card strong{font-size:14px!important;line-height:1.12!important;margin:8px 0 3px!important;max-width:100%!important}
.muscle-target-card small{font-size:8px!important;color:#a1a9af!important;direction:ltr!important;line-height:1!important}
.mini-muscle-bars{display:none!important}
.mini-anatomy-wrap{margin-top:auto!important;width:72px!important;height:72px!important;display:grid!important;place-items:center!important;overflow:hidden!important;border-radius:12px!important;background:radial-gradient(circle,rgba(255,255,255,.035),transparent 68%)!important}
.mini-anatomy-wrap svg{width:72px!important;height:72px!important;max-width:none!important;filter:none!important}
.mini-anatomy-wrap .body-shell{fill:#454e55!important;stroke:#707a81!important}.mini-anatomy-wrap .body-mid{fill:#505960!important}.mini-anatomy-wrap .muscle-zone{opacity:.42!important;filter:none!important}
.mini-anatomy-wrap .anatomy-figure.zone-calves .zone-calves,.mini-anatomy-wrap .anatomy-figure.zone-hamstrings .zone-hamstrings,.mini-anatomy-wrap .anatomy-figure.zone-quads .zone-quads,.mini-anatomy-wrap .anatomy-figure.zone-glutes .zone-glutes,.mini-anatomy-wrap .anatomy-figure.zone-biceps .zone-biceps,.mini-anatomy-wrap .anatomy-figure.zone-triceps .zone-triceps,.mini-anatomy-wrap .anatomy-figure.zone-shoulders .zone-shoulders,.mini-anatomy-wrap .anatomy-figure.zone-chest .zone-chest,.mini-anatomy-wrap .anatomy-figure.zone-back .zone-back,.mini-anatomy-wrap .anatomy-figure.zone-abs .zone-abs{fill:var(--accent)!important;stroke:#e4ff62!important;opacity:1!important;filter:none!important}

.big-metrics{height:116px!important;min-height:116px!important;margin:0!important;display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:8px!important;direction:ltr!important}
.big-metric{height:116px!important;min-height:0!important;padding:11px 6px!important;border:1px solid rgba(45,57,65,.75)!important;border-radius:20px!important;background:linear-gradient(155deg,rgba(14,21,26,.95),rgba(8,13,17,.96))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.018)!important;direction:rtl!important;display:grid!important;place-items:center!important;align-content:center!important}
.metric-icon{width:23px!important;height:23px!important;display:grid!important;place-items:center!important;color:var(--accent)!important;margin-bottom:2px!important}
.metric-icon svg{width:23px!important;height:23px!important;stroke:currentColor!important;fill:none!important;stroke-width:1.9!important;stroke-linecap:round!important;stroke-linejoin:round!important}
.big-metric small{margin-top:3px!important;color:#89929a!important;font-size:9px!important}
.big-metric strong{font-size:clamp(27px,7.5vw,34px)!important;margin:4px 0 1px!important;line-height:.95!important;letter-spacing:-.035em!important}
.big-metric em{font-style:normal!important;color:#7e878f!important;font-size:8px!important}
.big-metric.active{border-color:#4c5b24!important;background:linear-gradient(150deg,#131c0e,#09100c)!important}

.big-entry.set-editor-panel{position:fixed!important;z-index:140!important;left:12px!important;right:12px!important;bottom:calc(var(--safe-bottom) + 10px)!important;width:min(calc(100vw - 24px),520px)!important;margin:0 auto!important;padding:16px!important;border-radius:24px!important;transform:translateY(120%)!important;opacity:.7!important;transition:transform .26s cubic-bezier(.2,.8,.25,1),opacity .2s ease!important;box-shadow:0 -24px 80px rgba(0,0,0,.68)!important}
.big-entry.set-editor-panel.open{transform:translateY(0)!important;opacity:1!important}.set-editor-backdrop{position:fixed;z-index:135;inset:0;background:rgba(0,0,0,.68);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px)}
.big-entry.set-editor-panel .entry-head h3{font-size:21px!important}.big-entry.set-editor-panel .entry-grid{margin-top:13px!important;gap:7px!important}.big-entry.set-editor-panel .entry-grid input{font-size:20px!important;padding:12px 7px!important}
.set-editor-actions{display:grid;grid-template-columns:.8fr 1.4fr;gap:8px;margin-top:12px;direction:ltr}.set-editor-actions button{height:50px;border-radius:16px;font-weight:900;font-size:13px}.set-editor-cancel{border:1px solid #2b363e;background:#11181d;color:#c6cdd2}.set-editor-save{border:1px solid #d7ff14;background:linear-gradient(135deg,#dbff00,#bcf000);color:#090c06}
.video-panel:not([hidden]){position:fixed!important;z-index:145!important;left:16px!important;right:16px!important;top:50%!important;width:min(calc(100vw - 32px),620px)!important;margin:auto!important;transform:translateY(-50%)!important;border-radius:22px!important;box-shadow:0 28px 100px rgba(0,0,0,.8)!important}
.rest-controls:not([hidden]){position:fixed!important;z-index:130!important;left:50%!important;bottom:calc(var(--safe-bottom) + 137px)!important;width:min(calc(100vw - 30px),430px)!important;margin:0!important;transform:translateX(-50%)!important;padding:6px!important;border:1px solid #34401f!important;border-radius:16px!important;background:rgba(10,15,13,.96)!important;box-shadow:0 14px 45px rgba(0,0,0,.5)!important}
.exercise-selector{top:calc(var(--safe-top) + 80px)!important;max-height:45dvh!important}

.big-actions{height:64px!important;margin:0!important;display:grid!important;grid-template-columns:1fr 1.45fr!important;gap:9px!important;direction:ltr!important}
.dark-action,.lime-action{height:64px!important;min-height:0!important;border-radius:18px!important;font-size:14px!important;font-weight:950!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:9px!important}
.dark-action{border:1px solid rgba(43,54,62,.75)!important;background:linear-gradient(155deg,#0d1419,#090e12)!important;color:#c7cdd1!important}.dark-action svg{width:21px;height:21px;stroke:#8a949c;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.lime-action{border:1px solid #d7ff14!important;background:linear-gradient(135deg,#dbff00,#bcf000)!important;color:#090c06!important;box-shadow:0 9px 30px rgba(207,255,0,.14)!important}.lime-action svg{width:23px;height:23px;stroke:#090c06;fill:none;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}

.next-exercise-strip{height:62px!important;min-height:62px!important;margin:0!important;padding:7px 12px!important;border:1px solid rgba(42,53,61,.72)!important;border-radius:18px!important;background:linear-gradient(155deg,#0d1419,#080d11)!important;color:#fff!important;display:grid!important;grid-template-columns:34px minmax(0,1fr) 45px 26px!important;align-items:center!important;gap:7px!important;text-align:right!important;direction:ltr!important}
.next-exercise-strip .list-icon{width:27px;height:27px;display:grid;place-items:center;color:var(--accent)!important}.next-exercise-strip .list-icon svg{width:25px;height:25px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round}
.next-exercise-strip div{direction:rtl!important;min-width:0!important}.next-exercise-strip strong{display:block!important;font-size:14px!important;line-height:1!important}.next-exercise-strip small{display:block!important;margin-top:4px!important;color:#7e878f!important;font-size:8px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.next-thumb{width:43px;height:43px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:#11181d;border:1px solid #2b353d}.next-thumb svg{width:48px;height:48px;max-width:none;filter:none!important}.next-chev{font-size:31px!important;color:var(--accent)!important;line-height:1!important}

@media (max-width:350px){
  .big-workout-content{padding-left:8px!important;padding-right:8px!important;grid-template-rows:76px minmax(0,1fr) 102px 58px 56px!important;gap:7px!important}
  .big-hero-layout{grid-template-columns:88px minmax(105px,1fr) 92px!important;gap:4px!important}
  .big-ring{width:96px!important;height:96px!important}.big-ring strong{font-size:31px!important}.big-ring .ring-label{top:18%!important;font-size:8px!important}.big-ring .ring-caption{bottom:17%!important;font-size:7px!important}
  .muscle-target-card{height:140px!important;padding-left:5px!important;padding-right:5px!important}.muscle-target-card strong{font-size:12px!important}.mini-anatomy-wrap{width:62px!important;height:62px!important}.mini-anatomy-wrap svg{width:62px!important;height:62px!important}
  .anatomy-figure{height:min(100%,270px)!important}.big-metrics,.big-metric{height:102px!important}.big-metric strong{font-size:25px!important}.big-actions,.dark-action,.lime-action{height:58px!important}.next-exercise-strip{height:56px!important;min-height:56px!important}
}
@media (max-height:760px) and (max-width:760px){
  .big-header{height:66px!important;min-height:66px!important}.big-round-btn{width:44px!important;height:44px!important}.big-workout-content{height:calc(100dvh - var(--safe-top) - 66px)!important;grid-template-rows:68px minmax(0,1fr) 92px 54px 50px!important;gap:6px!important;padding-top:5px!important;padding-bottom:calc(var(--safe-bottom) + 5px)!important}
  .big-title-block h1{font-size:clamp(25px,7.6vw,34px)!important;margin-bottom:4px!important}.video-link{font-size:11px!important}.video-link span{font-size:14px!important}.big-ring{width:90px!important;height:90px!important}.big-ring strong{font-size:29px!important}.big-ring .ring-label{font-size:7px!important}.big-ring .ring-caption{font-size:7px!important}
  .muscle-target-card{height:128px!important;padding-top:8px!important}.muscle-target-card strong{font-size:12px!important;margin-top:5px!important}.mini-anatomy-wrap{width:54px!important;height:54px!important}.mini-anatomy-wrap svg{width:54px!important;height:54px!important}.anatomy-figure{height:min(100%,245px)!important}
  .big-metrics,.big-metric{height:92px!important}.metric-icon,.metric-icon svg{width:18px!important;height:18px!important}.big-metric strong{font-size:23px!important}.big-actions,.dark-action,.lime-action{height:54px!important}.dark-action,.lime-action{font-size:12px!important}.next-exercise-strip{height:50px!important;min-height:50px!important}.next-thumb{width:35px!important;height:35px!important}.next-thumb svg{width:40px!important;height:40px!important}
}
@media (min-width:761px){
  .big-header{height:82px!important;min-height:82px!important;grid-template-columns:68px 1fr 68px!important}.big-round-btn{width:58px!important;height:58px!important}.big-workout-content{height:calc(100dvh - var(--safe-top) - 82px)!important;grid-template-rows:92px minmax(0,1fr) 124px 68px 66px!important;gap:11px!important;padding:14px 44px calc(var(--safe-bottom) + 14px)!important}.big-title-block h1{font-size:clamp(40px,4.8vw,58px)!important}.big-hero-layout{grid-template-columns:minmax(175px,1fr) minmax(240px,1.25fr) minmax(185px,1fr)!important;gap:20px!important}.big-ring{width:175px!important;height:175px!important}.big-ring strong{font-size:50px!important}.anatomy-figure{height:min(100%,400px)!important}.muscle-target-card{height:205px!important;padding:19px!important}.muscle-target-card strong{font-size:22px!important}.muscle-target-card>span{font-size:11px!important}.muscle-target-card small{font-size:10px!important}.mini-anatomy-wrap{width:100px!important;height:100px!important}.mini-anatomy-wrap svg{width:100px!important;height:100px!important}.big-metrics,.big-metric{height:124px!important}.big-metric strong{font-size:36px!important}.big-actions,.dark-action,.lime-action{height:68px!important}.next-exercise-strip{height:66px!important;min-height:66px!important}
}
`;

  const ANATOMY_MARKUP = `
    <g class="body-front">
      <ellipse class="body-shell" cx="120" cy="35" rx="24" ry="30"/>
      <path class="body-shell" d="M101 66 Q120 57 139 66 L151 91 Q157 119 150 164 L143 221 Q138 247 134 266 L142 328 L137 417 L128 493 L112 493 L103 417 L98 328 L106 266 Q102 247 97 221 L90 164 Q83 119 89 91Z"/>
      <path class="body-shell" d="M91 83 Q66 90 59 121 L49 214 L60 219 L72 143 L86 114Z"/><path class="body-shell" d="M149 83 Q174 90 181 121 L191 214 L180 219 L168 143 L154 114Z"/>
      <path class="body-mid" d="M101 68 Q120 60 139 68 L143 111 Q120 121 97 111Z"/>
      <path class="muscle-zone zone-shoulders" d="M91 78 Q76 79 70 94 Q75 112 91 116 L99 92Z"/><path class="muscle-zone zone-shoulders" d="M149 78 Q164 79 170 94 Q165 112 149 116 L141 92Z"/>
      <path class="muscle-zone zone-chest" d="M99 91 Q108 78 119 84 L118 122 Q103 127 95 116Z"/><path class="muscle-zone zone-chest" d="M141 91 Q132 78 121 84 L122 122 Q137 127 145 116Z"/>
      <path class="muscle-zone zone-biceps" d="M76 116 Q64 129 64 159 Q66 176 73 181 Q82 161 84 127Z"/><path class="muscle-zone zone-biceps" d="M164 116 Q176 129 176 159 Q174 176 167 181 Q158 161 156 127Z"/>
      <path class="body-mid" d="M67 181 Q61 199 60 216 L72 220 Q78 205 77 183Z"/><path class="body-mid" d="M173 181 Q179 199 180 216 L168 220 Q162 205 163 183Z"/>
      <path class="muscle-zone zone-abs" d="M106 126 Q120 121 134 126 L132 221 Q120 235 108 221Z"/>
      <path class="anatomy-line" d="M120 128 V219 M107 151 H133 M108 176 H132 M109 201 H131"/>
      <path class="muscle-zone zone-quads" d="M104 252 Q93 281 99 337 Q101 365 110 383 Q117 353 117 282Z"/><path class="muscle-zone zone-quads" d="M136 252 Q147 281 141 337 Q139 365 130 383 Q123 353 123 282Z"/>
      <path class="body-mid" d="M103 384 Q99 412 106 456 L112 493 H120 L117 393Z"/><path class="body-mid" d="M137 384 Q141 412 134 456 L128 493 H120 L123 393Z"/>
      <path class="anatomy-line" d="M120 238 V488 M101 310 Q109 326 116 338 M139 310 Q131 326 124 338"/>
    </g>
    <g class="body-back">
      <ellipse class="body-shell" cx="120" cy="35" rx="24" ry="30"/>
      <path class="body-shell" d="M101 66 Q120 57 139 66 L151 91 Q157 119 150 164 L143 221 Q138 247 134 266 L142 328 L137 417 L128 493 L112 493 L103 417 L98 328 L106 266 Q102 247 97 221 L90 164 Q83 119 89 91Z"/>
      <path class="body-shell" d="M91 83 Q66 90 59 121 L49 214 L60 219 L72 143 L86 114Z"/><path class="body-shell" d="M149 83 Q174 90 181 121 L191 214 L180 219 L168 143 L154 114Z"/>
      <path class="muscle-zone zone-shoulders" d="M91 78 Q76 79 70 94 Q75 113 92 116 L101 91Z"/><path class="muscle-zone zone-shoulders" d="M149 78 Q164 79 170 94 Q165 113 148 116 L139 91Z"/>
      <path class="body-mid" d="M104 67 L120 95 L136 67 Q130 108 120 124 Q110 108 104 67Z"/>
      <path class="muscle-zone zone-back" d="M98 93 Q105 108 107 129 L99 204 Q107 225 118 230 L118 124 Q107 110 98 93Z"/><path class="muscle-zone zone-back" d="M142 93 Q135 108 133 129 L141 204 Q133 225 122 230 L122 124 Q133 110 142 93Z"/>
      <path class="muscle-zone zone-triceps" d="M76 115 Q65 132 65 161 Q67 180 73 185 Q82 163 83 128Z"/><path class="muscle-zone zone-triceps" d="M164 115 Q175 132 175 161 Q173 180 167 185 Q158 163 157 128Z"/>
      <path class="body-mid" d="M67 183 Q61 201 60 216 L72 220 Q78 205 77 184Z"/><path class="body-mid" d="M173 183 Q179 201 180 216 L168 220 Q162 205 163 184Z"/>
      <path class="muscle-zone zone-glutes" d="M105 229 Q91 243 99 271 Q107 283 118 274 L118 235Z"/><path class="muscle-zone zone-glutes" d="M135 229 Q149 243 141 271 Q133 283 122 274 L122 235Z"/>
      <path class="muscle-zone zone-hamstrings" d="M103 272 Q94 302 100 351 Q103 374 111 386 Q117 351 117 286Z"/><path class="muscle-zone zone-hamstrings" d="M137 272 Q146 302 140 351 Q137 374 129 386 Q123 351 123 286Z"/>
      <path class="muscle-zone zone-calves" d="M105 382 Q98 400 104 437 Q106 461 113 477 Q119 450 117 401Z"/><path class="muscle-zone zone-calves" d="M135 382 Q142 400 136 437 Q134 461 127 477 Q121 450 123 401Z"/>
      <path class="anatomy-line" d="M120 93 V490 M102 145 Q120 161 138 145 M102 244 Q120 257 138 244 M102 329 Q111 339 117 350 M138 329 Q129 339 123 350"/>
    </g>`;

  const style = document.createElement('style');
  style.id = 'ironlog-bigscreen-v3';
  style.textContent = css;
  document.head.appendChild(style);

  const ZONE_META = {
    calves:{he:'שריר התאומים',en:'Gastrocnemius',view:'back',crop:'70 345 100 155'},
    hamstrings:{he:'שרירי הירך האחוריים',en:'Hamstrings',view:'back',crop:'72 250 96 155'},
    quads:{he:'השריר הארבע־ראשי',en:'Quadriceps',view:'front',crop:'72 245 96 160'},
    glutes:{he:'שרירי העכוז',en:'Gluteus maximus',view:'back',crop:'72 205 96 100'},
    biceps:{he:'שריר הזרוע הדו־ראשי',en:'Biceps brachii',view:'front',crop:'45 82 150 125'},
    triceps:{he:'שריר הזרוע התלת־ראשי',en:'Triceps brachii',view:'back',crop:'45 82 150 125'},
    shoulders:{he:'שריר הדלתא',en:'Deltoid',view:'front',crop:'55 60 130 105'},
    chest:{he:'שריר החזה הגדול',en:'Pectoralis major',view:'front',crop:'72 70 96 100'},
    back:{he:'הרחב גבי',en:'Latissimus dorsi',view:'back',crop:'70 75 100 165'},
    abs:{he:'הישר הבטני',en:'Rectus abdominis',view:'front',crop:'85 105 70 145'},
    generic:{he:'שריר מטרה',en:'Target muscle',view:'front',crop:'55 60 130 170'}
  };

  const zoneFromMuscle = (muscle='') => {
    if(muscle.includes('תאומים')) return 'calves';
    if(muscle.includes('המסטרינג')) return 'hamstrings';
    if(muscle.includes('ארבע') || muscle.includes('רגליים')) return 'quads';
    if(muscle.includes('ישבן')) return 'glutes';
    if(muscle.includes('יד קדמית')) return 'biceps';
    if(muscle.includes('יד אחורית')) return 'triceps';
    if(muscle.includes('כתף')) return 'shoulders';
    if(muscle.includes('חזה')) return 'chest';
    if(muscle.includes('גב') || muscle.includes('רחב')) return 'back';
    if(muscle.includes('בטן') || muscle.includes('ליבה')) return 'abs';
    return 'generic';
  };

  const icon = (name) => ({
    timer:'<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 13V8m0 5 4 2M9 2h6"/></svg>',
    reps:'<svg viewBox="0 0 24 24"><rect x="6" y="4" width="12" height="16" rx="1"/><path d="M9 7h6M9 17h6"/></svg>',
    load:'<svg viewBox="0 0 24 24"><path d="M3 13h3l2-5 3 10 3-13 3 8h4"/></svg>',
    grid:'<svg viewBox="0 0 24 24"><path d="M5 6h5M14 6h5M5 12h5M14 12h5M5 18h5M14 18h5"/></svg>',
    undo:'<svg viewBox="0 0 24 24"><path d="M8 7H4V3M4 7a8 8 0 1 1-1 8"/></svg>',
    check:'<svg viewBox="0 0 24 24"><path d="m5 12 4 4 10-10"/></svg>'
  })[name];

  const workoutContext = () => {
    const short = document.getElementById('bigWorkoutTitle')?.textContent?.trim();
    const text = document.getElementById('exerciseIndex')?.textContent || '';
    const match = text.match(/תרגיל\s*(\d+)\s*מתוך\s*(\d+)/);
    const workout = window.IRONLOG_PROGRAM?.find(item => item.short === short);
    const index = match ? Number(match[1]) - 1 : 0;
    return {workout,index,exercise:workout?.exercises?.[index],next:workout?.exercises?.[index+1]};
  };

  const buildMini = (source, zone, className='') => {
    const meta = ZONE_META[zone] || ZONE_META.generic;
    const mini = source.cloneNode(true);
    mini.removeAttribute('id');
    mini.classList.add('mini-anatomy',className);
    mini.dataset.view = meta.view;
    mini.setAttribute('viewBox',meta.crop);
    mini.setAttribute('preserveAspectRatio','xMidYMid meet');
    return mini;
  };

  const ready = () => {
    const editor = document.querySelector('.big-entry');
    const completeBtn = document.getElementById('completeSetBtn');
    const anatomy = document.getElementById('anatomyFigure');
    const muscleCard = document.querySelector('.muscle-target-card');
    const ring = document.getElementById('setRing');
    if(!editor || !completeBtn || !anatomy || !muscleCard || !ring) return;

    anatomy.setAttribute('viewBox','0 0 240 510');
    anatomy.innerHTML = ANATOMY_MARKUP;
    anatomy.dataset.view = 'front';

    const label = document.querySelector('.set-progress-panel>span');
    const caption = document.getElementById('setProgressCaption');
    if(label && !label.classList.contains('ring-label')){label.classList.add('ring-label');ring.prepend(label);}
    if(caption && !caption.classList.contains('ring-caption')){caption.classList.add('ring-caption');ring.append(caption);}

    const topNext = document.getElementById('workoutNextBtn');
    const stripNext = document.querySelector('.next-chev');
    if(topNext) topNext.textContent='›';
    if(stripNext) stripNext.textContent='›';

    const metricIcons = document.querySelectorAll('.metric-icon');
    if(metricIcons[0]) metricIcons[0].innerHTML = icon('timer');
    if(metricIcons[1]) metricIcons[1].innerHTML = icon('reps');
    if(metricIcons[2]) metricIcons[2].innerHTML = icon('load');
    const listIcon = document.querySelector('.next-exercise-strip .list-icon');
    if(listIcon) listIcon.innerHTML = icon('grid');
    document.getElementById('skipSetBtn').innerHTML = `${icon('undo')}<span>דלג סט</span>`;
    completeBtn.innerHTML = `<span>סיימתי את הסט</span>${icon('check')}`;

    let nextThumb = document.querySelector('.next-thumb');
    if(!nextThumb){
      nextThumb = document.createElement('span');
      nextThumb.className='next-thumb';
      document.querySelector('.next-exercise-strip')?.insertBefore(nextThumb,stripNext);
    }

    let miniWrap = muscleCard.querySelector('.mini-anatomy-wrap');
    if(!miniWrap){miniWrap=document.createElement('div');miniWrap.className='mini-anatomy-wrap';muscleCard.appendChild(miniWrap);}

    const syncRing = () => {
      const text=document.getElementById('setRingText')?.textContent||'';
      const m=text.match(/(\d+)\s*\/\s*(\d+)/);if(!m)return;
      ring.style.setProperty('--progress',`${Math.min(100,(Number(m[1])/Math.max(1,Number(m[2])))*100)}%`);
    };

    let syncing=false;
    const syncContext = () => {
      if(syncing)return;syncing=true;
      const {exercise,next}=workoutContext();
      const zone=zoneFromMuscle(exercise?.muscle||'');
      const meta=ZONE_META[zone]||ZONE_META.generic;
      anatomy.dataset.view = (exercise?.muscle||'').includes('אחורית') ? 'back' : meta.view;
      const chip=document.getElementById('muscleChip');const en=document.getElementById('muscleEnglish');
      if(chip) chip.textContent=meta.he;if(en) en.textContent=meta.en;
      miniWrap.replaceChildren(buildMini(anatomy,zone));
      const nextZone=zoneFromMuscle(next?.muscle||'');
      nextThumb.replaceChildren(buildMini(anatomy,nextZone,'next-anatomy'));
      const pill=document.getElementById('exerciseIndex');
      if(pill && !pill.querySelector('.exercise-current')){
        const t=pill.textContent;const m=t.match(/תרגיל\s*(\d+)\s*מתוך\s*(\d+)/);
        if(m) pill.innerHTML=`תרגיל <span class="exercise-current">${m[1]}</span> מתוך ${m[2]}`;
      }
      syncing=false;
    };

    const backdrop=document.createElement('div');backdrop.className='set-editor-backdrop';backdrop.hidden=true;
    editor.classList.add('set-editor-panel');
    const editorActions=document.createElement('div');editorActions.className='set-editor-actions';editorActions.innerHTML='<button type="button" class="set-editor-cancel">חזרה</button><button type="button" class="set-editor-save">שמור וסיים את הסט ✓</button>';
    editor.appendChild(editorActions);document.body.append(backdrop,editor);
    const originalComplete=completeBtn.onclick;
    const openEditor=()=>{backdrop.hidden=false;requestAnimationFrame(()=>editor.classList.add('open'));editor.setAttribute('aria-hidden','false');};
    const closeEditor=()=>{editor.classList.remove('open');editor.setAttribute('aria-hidden','true');setTimeout(()=>backdrop.hidden=true,220);};
    completeBtn.onclick=e=>{e?.preventDefault?.();openEditor();};
    editorActions.querySelector('.set-editor-cancel').onclick=closeEditor;backdrop.onclick=closeEditor;
    editorActions.querySelector('.set-editor-save').onclick=()=>{closeEditor();originalComplete?.call(completeBtn);};
    document.getElementById('lastLoad')?.closest('.big-metric')?.addEventListener('click',openEditor);

    const ringObs=new MutationObserver(syncRing);ringObs.observe(document.getElementById('setRingText'),{childList:true,characterData:true,subtree:true});
    const indexObs=new MutationObserver(()=>requestAnimationFrame(syncContext));indexObs.observe(document.getElementById('exerciseIndex'),{childList:true,characterData:true,subtree:true});
    const anatomyObs=new MutationObserver(()=>requestAnimationFrame(syncContext));anatomyObs.observe(anatomy,{attributes:true,attributeFilter:['class']});
    const nextObs=new MutationObserver(()=>requestAnimationFrame(syncContext));const nextName=document.getElementById('nextExerciseName');if(nextName)nextObs.observe(nextName,{childList:true,characterData:true,subtree:true});
    const workoutView=document.getElementById('workoutView');
    const activeObs=new MutationObserver(()=>{if(workoutView?.classList.contains('active')){workoutView.scrollTop=0;requestAnimationFrame(()=>{syncRing();syncContext();});}});if(workoutView)activeObs.observe(workoutView,{attributes:true,attributeFilter:['class']});

    syncRing();syncContext();
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
