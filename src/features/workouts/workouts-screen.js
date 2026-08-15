import { escapeHtml } from '../../core/escape-html.js';
import { Icon } from '../../components/icons.js';
import { AppPageHeader } from '../../components/app-page-header.js';
import { WORKOUTS, workoutForDay, nextWorkoutFromDay } from './workout-catalog.js';

const DAY_LABELS = Object.freeze(['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳']);
const MONTHS = Object.freeze(['בינו׳','בפבר׳','במרץ','באפר׳','במאי','ביוני','ביולי','באוג׳','בספט׳','באוק׳','בנוב׳','בדצמ׳']);

function weekDates(selectedDay = new Date().getDay()) {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setHours(12,0,0,0);
  sunday.setDate(now.getDate() - now.getDay());
  return DAY_LABELS.map((label,day) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + day);
    return { label, day, date, selected: day === selectedDay };
  });
}
function selectedWorkout(){ const t=new Date().getDay(); return workoutForDay(t)||nextWorkoutFromDay(t); }
function workoutDate(w){ const t=new Date(),s=new Date(t); s.setHours(12,0,0,0); s.setDate(t.getDate()-t.getDay()); const d=new Date(s); d.setDate(s.getDate()+w.day); if(w.day<t.getDay())d.setDate(d.getDate()+7); return d; }
function compactTitle(w){ return w.short.replace(/\s+[AB]$/,''); }
function hebrewTargets(w){ const m={Chest:'חזה',Biceps:'בייספס',Triceps:'טרייספס',Shoulders:'כתפיים',Back:'גב','Rear Delts':'כתף אחורית',Quads:'רגליים',Hamstrings:'המסטרינג',Glutes:'ישבן',Core:'בטן',Calves:'תאומים',Delts:'כתפיים'}; return w.targets.map(t=>m[t]||t).join(' · '); }
function heroSubtitle(w){ const l=compactTitle(w); return l==='ARMS'?'ידיים + כתפיים':l==='PUSH'?'חזה + כתפיים':l==='PULL'?'גב + ידיים':l==='LEGS'?'רגליים + ישבן':hebrewTargets(w); }
function durationRange(m){ return `${Math.max(30,m-16)}–${Math.max(31,m-1)} דק׳`; }
function dayStrip(){ return weekDates().map(({label,date,selected})=>`<div class="training-day ${selected?'is-selected':''}"><span>${label}</span><strong>${String(date.getDate()).padStart(2,'0')}</strong><i></i></div>`).join(''); }
function liveWorkoutFor(w,ws){ return ws.find(i=>i.id===w.id)||null; }
function hero(w,ws,a){ const d=workoutDate(w),today=new Date().toDateString()===d.toDateString(),f=w.images?.[0]||'',b=w.images?.[1]||f,l=liveWorkoutFor(w,ws),id=l?.databaseId||''; return `<section class="training-hero"><div class="training-hero__copy"><div class="training-hero__date"><strong>${today?'היום':'האימון הבא'}</strong><span>• ${DAY_LABELS[w.day]}, ${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]}</span></div><h2>${escapeHtml(compactTitle(w))}</h2><p>${escapeHtml(heroSubtitle(w))}</p><div class="training-hero__chips"><span>${Icon('clock',{size:13})}<b>${escapeHtml(durationRange(w.minutes))}</b></span><span><i class="intensity-bars"><b></b><b></b><b></b></i><b>עצימות גבוהה</b></span></div><button class="training-start" type="button" data-start-workout="${id}"><span>${a?'המשך אימון':'התחל אימון'}</span><i>→</i></button></div><div class="training-hero__art"><img class="training-hero__back" src="${b}" alt=""><img class="training-hero__front" src="${f}" alt=""></div></section>`; }
function summaryTiles(w){ const d=workoutDate(w); return `<section class="training-summary"><article><i class="summary-icon summary-icon--ring"></i><div><strong>4/6</strong><span>אימונים השבוע</span></div></article><article><i class="summary-icon summary-icon--target"></i><div><strong>PPL</strong><span>ספליט פעיל</span></div></article><article><i class="summary-icon summary-icon--clock">${Icon('clock',{size:17})}</i><div><strong>${escapeHtml(compactTitle(w))}</strong><span>אימון הבא</span><small>יום ${DAY_LABELS[w.day]}, ${d.getDate()}</small></div></article></section>`; }
function representative(l){ return WORKOUTS.find(i=>i.id===(l==='PUSH'?'push-a':l==='PULL'?'pull-a':l==='LEGS'?'legs-b':'arms')); }
function programRow(l,s,c,ws,p=''){ const w=representative(l),live=liveWorkoutFor(w,ws),thumb=w?.images?.[0]||'',action=live?.databaseId?`data-open-workout="${live.databaseId}"`:'data-demo-action'; return `<button class="training-plan-row ${c}" type="button" ${action}><span class="training-plan-row__arrow">‹</span><span class="training-plan-row__copy"><strong>${l}</strong><small>${escapeHtml(hebrewTargets(w))}</small></span><span class="training-plan-row__progress"><i><b></b><b></b><b></b><b></b><b></b></i><em>${escapeHtml(p||s)}</em></span><span class="training-plan-row__state">${s==='הושלם'?'✓':s==='רגליים חלקית'?'3/6':''}</span><span class="training-plan-row__thumb"><img src="${thumb}" alt=""></span></button>`; }
function planList(ws){ return `<section class="training-plan"><h3>תוכנית האימונים שלך</h3><div class="training-plan__rows">${programRow('PUSH','הושלם','is-complete',ws)}${programRow('PULL','הושלם','is-complete',ws)}${programRow('LEGS','רגליים חלקית','is-partial',ws,'רגליים חלקית')}${programRow('ARMS','הבא בתור','is-next',ws,'הבא בתור')}</div></section>`; }
function quickStats(){ return `<section class="training-quick"><h3>סטטיסטיקות מהירות</h3><div class="training-quick__grid"><article><i class="quick-ring"></i><div><strong>68%</strong><span>השלמת תוכנית</span></div></article><article><i class="quick-wave">⌁</i><div><strong>12,450</strong><span>ק״ג השבוע</span></div></article><article><i class="quick-trophy">◇</i><div><strong>14</strong><span>רצף ימים</span></div></article></div></section>`; }

function completedSetCount(s){ return s.exercises.reduce((n,e)=>n+e.sets.filter(x=>x.completed).length,0); }
function plannedSetCount(s){ return s.exercises.reduce((n,e)=>n+e.plannedSets,0); }
function completedExerciseCount(s){ return s.exercises.filter(e=>e.sets.filter(x=>x.completed).length>=e.plannedSets).length; }
function currentExercise(s){ return s.exercises.find(e=>e.sets.filter(x=>x.completed).length<e.plannedSets)||s.exercises.at(-1); }
function setMap(e){ return new Map(e.sets.map(s=>[s.setNumber,s])); }
function targetRepDefault(t){ const f=String(t||'').match(/\d+/); return f?Number(f[0]):8; }
function lastCompletedSet(e){ return [...e.sets].filter(s=>s.completed).sort((a,b)=>b.setNumber-a.setNumber)[0]||null; }
function workoutArt(session){ const n=String(session.name||'').toLowerCase(); if(n.includes('arm'))return'/assets/workout-images/plans/arms-front.png'; if(n.includes('leg'))return'/assets/workout-images/plans/legs-b-front.png'; if(n.includes('back')||n.includes('pull'))return'/assets/workout-images/plans/pull-a-front.png'; return'/assets/workout-images/plans/push-a-front.png'; }
function exerciseMuscleLabel(e){ const primary=e.exercise?.muscles?.find(m=>m.role==='primary')||e.exercise?.muscles?.[0]; return primary?.name_he||primary?.nameHe||primary?.name||'שריר מטרה'; }
function normalizedHistoryPoint(point){ return { load:Number(point.load_kg??point.loadKg??0), reps:Number(point.reps??0), at:point.completed_at||point.completedAt||'' }; }
function recentExerciseHistory(exercise,performanceHistory=[]){
  const historical=performanceHistory.filter(p=>Number(p.exercise_id??p.exerciseId)===Number(exercise.exerciseId)).map(normalizedHistoryPoint).filter(p=>p.load>0).sort((a,b)=>new Date(a.at)-new Date(b.at));
  const sessionSets=exercise.sets.filter(s=>s.completed&&Number(s.loadKg)>0).sort((a,b)=>a.setNumber-b.setNumber).map(s=>({load:Number(s.loadKg),reps:Number(s.reps||0),at:''}));
  return [...historical,...sessionSets].slice(-3);
}
function chartData(exercise,load,performanceHistory,activeSet){
  const points=recentExerciseHistory(exercise,performanceHistory);
  const projected=Number(load)||points.at(-1)?.load||0;
  if(!points.length) return { points:[], projected, ready:false, trendUp:false, min:0, max:30, activeSet };
  const values=[...points.map(p=>p.load),projected||points.at(-1).load];
  let min=Math.min(...values),max=Math.max(...values);
  const spread=Math.max(5,max-min);
  min=Math.max(0,Math.floor((min-spread*.4)/2.5)*2.5);
  max=Math.ceil((max+spread*.4)/2.5)*2.5;
  if(max-min<10)max=min+10;
  const trendUp=points.length===3&&points[2].load>points[0].load&&points[2].load>=points[1].load;
  return { points, projected, ready:true, trendUp, min, max, activeSet };
}
function chartY(value,min,max){ return 62-((value-min)/(max-min))*39; }
function chartMarkup(g){
  const gridValues=g.ready?[g.min,(g.min+g.max)/2,g.max]:[0,15,30];
  const grid=gridValues.map(v=>{const y=chartY(v,g.ready?g.min:0,g.ready?g.max:30);return `<line class="live-grid-line" x1="14" y1="${y}" x2="101" y2="${y}"/><text class="live-y-label" x="9" y="${y+1}">${Number(v.toFixed(1))}</text>`}).join('');
  if(!g.ready) return `${grid}<text class="live-empty-label" x="57" y="42">הסטים האחרונים יופיעו כאן</text><circle cx="92" cy="62" r="2.2" class="next"/><text class="live-x-label is-current" x="92" y="78">סט ${g.activeSet}</text>`;
  const historyXs=g.points.length===1?[68]:g.points.length===2?[43,68]:[18,43,68];
  const coords=g.points.map((p,i)=>({x:historyXs[i],y:chartY(p.load,g.min,g.max),v:p.load}));
  const currentX=92,currentY=chartY(g.projected||g.points.at(-1).load,g.min,g.max);
  const path=`M ${coords.map(p=>`${p.x} ${p.y}`).join(' L ')} L ${currentX} ${currentY}`;
  const historyLabels=coords.map((p,i)=>`<text class="live-x-label" x="${p.x}" y="78">${g.points.length===1?'קודם':g.points.length===2?(i===0?'לפני 2':'קודם'):`-${3-i}`}</text>`).join('');
  const pathClass=g.points.length===1?'live-chart-line is-sparse':'live-chart-line';
  return `${grid}<path class="${pathClass}" d="${path}"/>${coords.map((p,i)=>`<circle cx="${p.x}" cy="${p.y}" r="1.9" class="${i===coords.length-1?'hot':''}"/><text class="live-value-label" x="${p.x}" y="${p.y-6}">${p.v}</text>`).join('')}<circle cx="${currentX}" cy="${currentY}" r="2.2" class="next"/>${historyLabels}<text class="live-x-label is-current" x="${currentX}" y="78">סט ${g.activeSet}</text>`;
}

function ActiveWorkoutScreen(session,performanceHistory=[]){
  const e=currentExercise(session); if(!e)return'';
  const map=setMap(e); let active=1;
  for(let n=1;n<=e.plannedSets;n++){ if(!map.get(n)?.completed){active=n;break;} active=e.plannedSets; }
  const prev=lastCompletedSet(e),load=prev?.loadKg??0,reps=prev?.reps??targetRepDefault(e.targetReps),rir=prev?.rir??e.targetRirMax??2;
  const completedSets=completedSetCount(session),plannedSets=plannedSetCount(session),completedExercises=completedExerciseCount(session),percent=plannedSets?Math.round(completedSets/plannedSets*100):0;
  const next=session.exercises.find(i=>i.position>e.position&&i.sets.filter(s=>s.completed).length<i.plannedSets);
  const graph=chartData(e,load,performanceHistory,active),art=workoutArt(session),muscle=exerciseMuscleLabel(e),ringPercent=Math.round((active/e.plannedSets)*100);
  const insight=graph.ready?(graph.trendUp?'3 הסטים האחרונים שלך? <b>אתה על אש!</b>':'שמור על הקצב — הסט הבא שלך מחכה'):'אחרי כמה סטים נציג כאן את המגמה שלך';
  return `<div class="active-workout-page live-minimal" dir="rtl" data-active-session="${session.id}" data-started-at="${escapeHtml(session.startedAt)}">
    <header class="live-workout-header"><button type="button" data-minimize-workout>‹</button><div><strong>${escapeHtml(session.name)}</strong><span><b id="liveWorkoutElapsed">00:00:00</b>　•　${completedExercises}/${session.exercises.length} תרגילים</span></div><button class="live-more">•••</button></header>
    <div class="live-total-progress"><i style="--progress:${percent}%"></i></div>
    <section class="live-hero-flat"><button class="live-ring" type="submit" form="liveSetForm" style="--ring:${ringPercent}%" aria-label="שמור את הסט הנוכחי"><span>סט נוכחי</span><b><em>${active}</em> / ${e.plannedSets}</b></button><div class="live-exercise-name"><h1>${escapeHtml(e.name)}</h1><p>${escapeHtml(muscle)}</p></div><div class="live-muscle-figure"><img src="${art}" alt="" loading="eager"></div></section>
    <section class="live-performance"><svg class="live-chart" viewBox="0 0 108 82" preserveAspectRatio="none"><defs><linearGradient id="liveFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfff12" stop-opacity=".2"/><stop offset="1" stop-color="#cfff12" stop-opacity="0"/></linearGradient></defs>${chartMarkup(graph)}</svg><div class="live-fire-note">${graph.trendUp?'🔥':'✦'} <span>${insight}</span></div></section>
    <form id="liveSetForm" class="live-entry-form" data-set-form data-session-exercise-id="${e.id}" data-set-number="${active}" data-rest-seconds="${e.restMaxSeconds}"><div class="live-inline-fields"><div><label>חזרות</label><input id="liveReps" name="reps" type="number" min="0" value="${reps}" required><p><button type="button" data-step="-1" data-step-target="liveReps">−</button><button type="button" data-step="1" data-step-target="liveReps">＋</button></p></div><div><label>משקל (ק״ג)</label><input id="liveWeight" name="loadKg" type="number" min="0" step="0.25" value="${load}"><p><button type="button" data-step="-2.5" data-step-target="liveWeight">−</button><button type="button" data-step="2.5" data-step-target="liveWeight">＋</button></p></div><div><label>RIR</label><input id="liveRir" name="rir" type="number" min="0" max="10" step="0.5" value="${rir}"><p><button type="button" data-step="-0.5" data-step-target="liveRir">−</button><button type="button" data-step="0.5" data-step-target="liveRir">＋</button></p></div></div><button class="live-save-set" type="submit">שמור סט ✓</button></form>
    <section class="live-rest-flat" id="restTimer" hidden><div class="live-rest-ring"><button type="button" id="skipRestTimer">Ⅱ</button></div><div><span>הזמן מנוחה</span><strong id="restTimerValue">00:00</strong><small>עד הסט הבא</small></div></section>
    <section class="live-next-flat"><div><small>הבא</small><strong>${escapeHtml(next?.name||'סיום האימון')}</strong><span>${next?escapeHtml(next.targetReps||''):''}</span></div><b>‹</b></section><button class="live-finish-flat" type="button" data-complete-session="${session.id}">⚑　סיום אימון</button>
  </div>`;
}

export function WorkoutBuilderExerciseRow(){ return ''; }
export function WorkoutsScreen({workouts=WORKOUTS,workoutData={},ui=null}={}){
  if(workoutData.activeSession&&ui?.type!=='overview') return ActiveWorkoutScreen(workoutData.activeSession,workoutData.performanceHistory||[]);
  const w=selectedWorkout();
  return `<div class="workouts-concept animate-enter" dir="rtl">${AppPageHeader({title:'אימונים',subtitle:'תכנון. ביצוע. התקדמות.',rootClass:'training-header',brandClass:'training-brand',headingClass:'training-heading'})}<section class="training-calendar"><span class="training-calendar__icon">${Icon('calendar',{size:21})}</span><div class="training-calendar__days">${dayStrip()}</div></section>${hero(w,workouts,workoutData.activeSession||null)}${summaryTiles(w)}${planList(workouts)}${quickStats()}</div>`;
}