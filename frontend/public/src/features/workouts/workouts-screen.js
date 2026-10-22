import { escapeHtml } from '../../core/escape-html.js';
import { Icon } from '../../components/icons.js';
import { AppPageHeader } from '../../components/app-page-header.js';
import { WORKOUTS, workoutForDay, nextWorkoutFromDay } from './workout-catalog.js';

const DAY_LABELS = Object.freeze(['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳']);
const MONTHS = Object.freeze(['בינו׳','בפבר׳','במרץ','באפר׳','במאי','ביוני','ביולי','באוג׳','בספט׳','באוק׳','בנוב׳','בדצמ׳']);
const DEFAULT_ART = WORKOUTS.find((item) => item.id === 'push-a')?.images || [];

function isScheduled(workout) {
  if (workout?.day === null || workout?.day === undefined || workout?.day === '') return false;
  const day = Number(workout.day);
  return Number.isInteger(day) && day >= 0 && day <= 6;
}

function scheduledWorkouts(workouts = []) {
  return workouts.filter(isScheduled).sort((a, b) => Number(a.day) - Number(b.day));
}

function weekDates(selectedDay = new Date().getDay()) {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setHours(12, 0, 0, 0);
  sunday.setDate(now.getDate() - now.getDay());
  return DAY_LABELS.map((label, day) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + day);
    return { label, day, date, selected: day === selectedDay };
  });
}

function selectedWorkout(workouts = WORKOUTS) {
  const today = new Date().getDay();
  const scheduled = scheduledWorkouts(workouts);
  return workoutForDay(today, scheduled)
    || nextWorkoutFromDay(today, scheduled)
    || scheduled[0]
    || workouts[0]
    || WORKOUTS[0];
}

function workoutDate(workout) {
  const today = new Date();
  if (!isScheduled(workout)) return today;
  const sunday = new Date(today);
  sunday.setHours(12, 0, 0, 0);
  sunday.setDate(today.getDate() - today.getDay());
  const date = new Date(sunday);
  date.setDate(sunday.getDate() + Number(workout.day));
  if (Number(workout.day) < today.getDay()) date.setDate(date.getDate() + 7);
  return date;
}

function compactTitle(workout) {
  return String(workout?.short || workout?.title || workout?.id || 'אימון').replace(/\s+[AB]$/, '');
}

function hebrewTargets(workout) {
  const map = { Chest:'חזה', Biceps:'בייספס', Triceps:'טרייספס', Shoulders:'כתפיים', Back:'גב', 'Rear Delts':'כתף אחורית', Quads:'רגליים', Hamstrings:'המסטרינג', Glutes:'ישבן', Core:'בטן', Calves:'תאומים', Delts:'כתפיים' };
  return (workout?.targets || []).map((target) => map[target] || target).join(' · ');
}

function heroSubtitle(workout) {
  const label = compactTitle(workout);
  return label === 'ARMS' ? 'ידיים + כתפיים'
    : label === 'PUSH' ? 'חזה + כתפיים'
      : label === 'PULL' ? 'גב + ידיים'
        : label === 'LEGS' ? 'רגליים + ישבן'
          : hebrewTargets(workout) || workout?.description || 'אימון אישי';
}

function durationRange(minutes) {
  const value = Math.max(1, Number(minutes) || 45);
  return `${Math.max(20, value - 16)}–${Math.max(21, value - 1)} דק׳`;
}

function dayStrip() {
  return weekDates().map(({ label, date, selected }) => `<div class="training-day ${selected ? 'is-selected' : ''}"><span>${label}</span><strong>${String(date.getDate()).padStart(2, '0')}</strong><i></i></div>`).join('');
}

function liveWorkoutFor(workout, workouts) {
  return workouts.find((item) => item.id === workout?.id || Number(item.databaseId) === Number(workout?.databaseId)) || null;
}

function hero(workout, workouts, activeSession) {
  const date = workoutDate(workout);
  const today = isScheduled(workout) && new Date().toDateString() === date.toDateString();
  const images = workout?.images?.length ? workout.images : DEFAULT_ART;
  const front = images[0] || '';
  const back = images[1] || front;
  const resolved = liveWorkoutFor(workout, workouts) || workout;
  const id = resolved?.databaseId || '';
  const dateText = isScheduled(workout)
    ? `• ${DAY_LABELS[Number(workout.day)]}, ${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]}`
    : '• ללא יום קבוע';
  return `<section class="training-hero"><div class="training-hero__copy"><div class="training-hero__date"><strong>${today ? 'היום' : 'האימון הבא'}</strong><span>${dateText}</span></div><h2>${escapeHtml(compactTitle(workout))}</h2><p>${escapeHtml(heroSubtitle(workout))}</p><div class="training-hero__chips"><span>${Icon('clock',{size:13})}<b>${escapeHtml(durationRange(workout?.minutes))}</b></span><span><i class="intensity-bars"><b></b><b></b><b></b></i><b>עצימות גבוהה</b></span></div><button class="training-start" type="button" data-start-workout="${id}"><span>${activeSession ? 'המשך אימון' : 'התחל אימון'}</span><i>→</i></button></div><div class="training-hero__art">${front ? `<img class="training-hero__back" src="${escapeHtml(back)}" alt=""><img class="training-hero__front" src="${escapeHtml(front)}" alt="">` : ''}</div></section>`;
}

function weekStart() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());
  return date;
}

function sessionsThisWeek(workoutData = {}) {
  const start = weekStart();
  return (workoutData.sessions || []).filter((session) => new Date(session.completed_at || session.started_at) >= start);
}

function summaryTiles(workout, workouts, workoutData) {
  const date = workoutDate(workout);
  const summary = workoutData?.summary || {};
  const planned = scheduledWorkouts(workouts).length || Number(summary.plannedWorkouts) || workouts.length;
  const completed = Number(summary.completedThisWeek) || 0;
  const dateLabel = isScheduled(workout) ? `יום ${DAY_LABELS[Number(workout.day)]}, ${date.getDate()}` : 'ללא יום קבוע';
  return `<section class="training-summary"><article><i class="summary-icon summary-icon--ring"></i><div><strong>${completed}/${planned}</strong><span>אימונים השבוע</span></div></article><article><i class="summary-icon summary-icon--target"></i><div><strong>${planned}</strong><span>אימונים בתוכנית</span></div></article><article><i class="summary-icon summary-icon--clock">${Icon('clock',{size:17})}</i><div><strong>${escapeHtml(compactTitle(workout))}</strong><span>אימון הבא</span><small>${escapeHtml(dateLabel)}</small></div></article></section>`;
}

function latestSessionForWorkout(workout, sessions) {
  const templateId = Number(workout?.databaseId);
  if (!templateId) return null;
  return sessions.find((session) => Number(session.template_id) === templateId) || null;
}

function programRow(workout, workoutData, selectedId) {
  const sessions = sessionsThisWeek(workoutData);
  const active = workoutData?.activeSession;
  const isActive = active && Number(active.templateId) === Number(workout.databaseId);
  const latest = latestSessionForWorkout(workout, sessions);
  const completed = latest?.status === 'completed';
  const isNext = workout.id === selectedId;
  const className = completed ? 'is-complete' : isActive || isNext ? 'is-next' : '';
  const status = completed ? 'הושלם' : isActive ? 'פעיל עכשיו' : isNext ? 'הבא בתור' : 'מתוכנן';
  const state = completed ? '✓' : isActive ? '•' : '';
  const thumb = workout.images?.[0] || DEFAULT_ART[0] || '';
  const action = workout.databaseId ? `data-start-workout="${workout.databaseId}"` : 'data-demo-action';
  return `<button class="training-plan-row ${className}" type="button" ${action}><span class="training-plan-row__arrow">‹</span><span class="training-plan-row__copy"><strong>${escapeHtml(compactTitle(workout))}</strong><small>${escapeHtml(hebrewTargets(workout) || workout.title || '')}</small></span><span class="training-plan-row__progress"><i><b></b><b></b><b></b><b></b><b></b></i><em>${escapeHtml(status)}</em></span><span class="training-plan-row__state">${state}</span><span class="training-plan-row__thumb">${thumb ? `<img src="${escapeHtml(thumb)}" alt="">` : ''}</span></button>`;
}

function planList(workouts, workoutData, selected) {
  const ordered = [...workouts].sort((a, b) => {
    const aDay = isScheduled(a) ? Number(a.day) : 99;
    const bDay = isScheduled(b) ? Number(b.day) : 99;
    return aDay - bDay;
  });
  return `<section class="training-plan"><h3>תוכנית האימונים שלך</h3><div class="training-plan__rows">${ordered.map((workout) => programRow(workout, workoutData, selected?.id)).join('')}</div></section>`;
}

function quickStats(workoutData = {}) {
  const summary = workoutData.summary || {};
  const completed = Number(summary.completedThisWeek) || 0;
  const load = Math.round(Number(summary.weeklyLoadKg) || 0).toLocaleString('he-IL');
  const custom = Number(summary.customWorkouts) || 0;
  return `<section class="training-quick"><h3>סטטיסטיקות מהירות</h3><div class="training-quick__grid"><article><i class="quick-ring"></i><div><strong>${completed}</strong><span>אימונים השבוע</span></div></article><article><i class="quick-wave">⌁</i><div><strong>${load}</strong><span>ק״ג השבוע</span></div></article><article><i class="quick-trophy">◇</i><div><strong>${custom}</strong><span>אימונים אישיים</span></div></article></div></section>`;
}

function includedExercises(session) {
  return (session.exercises || []).filter((exercise) => !exercise.isSkipped && Number(exercise.plannedSets) > 0);
}

function completedSetCount(session) {
  return includedExercises(session).reduce((count, exercise) => {
    const completed = exercise.sets.filter((set) => set.completed).length;
    return count + Math.min(completed, Number(exercise.plannedSets) || 0);
  }, 0);
}

function plannedSetCount(session) {
  return includedExercises(session).reduce((count, exercise) => count + (Number(exercise.plannedSets) || 0), 0);
}

function completedExerciseCount(session) {
  return includedExercises(session).filter((exercise) => exercise.sets.filter((set) => set.completed).length >= exercise.plannedSets).length;
}

function currentExercise(session) {
  const included = includedExercises(session);
  return included.find((exercise) => exercise.sets.filter((set) => set.completed).length < exercise.plannedSets)
    || included.at(-1)
    || session.exercises?.find((exercise) => !exercise.isSkipped)
    || session.exercises?.at(-1)
    || null;
}

function setMap(exercise){return new Map(exercise.sets.map((set)=>[set.setNumber,set]))}
function targetRepDefault(target){const match=String(target||'').match(/\d+/);return match?Number(match[0]):8}
function lastCompletedSet(exercise){return[...exercise.sets].filter((set)=>set.completed).sort((a,b)=>b.setNumber-a.setNumber)[0]||null}
function workoutArt(session){const name=String(session.name||'').toLowerCase();if(name.includes('arm'))return'/assets/workout-images/plans/arms-front.png';if(name.includes('leg'))return'/assets/workout-images/plans/legs-b-front.png';if(name.includes('back')||name.includes('pull'))return'/assets/workout-images/plans/pull-a-front.png';return'/assets/workout-images/plans/push-a-front.png'}
function exerciseMuscleLabel(exercise){const primary=exercise.exercise?.muscles?.find((muscle)=>muscle.role==='primary')||exercise.exercise?.muscles?.[0];return primary?.name_he||primary?.nameHe||primary?.name||'שריר מטרה'}
function normalizedHistoryPoint(point){return{load:Number(point.load_kg??point.loadKg??0),reps:Number(point.reps??0),at:point.completed_at||point.completedAt||''}}
function recentExerciseHistory(exercise,performanceHistory=[]){return performanceHistory.filter((point)=>Number(point.exercise_id??point.exerciseId)===Number(exercise.exerciseId)).map(normalizedHistoryPoint).filter((point)=>point.load>0).sort((a,b)=>new Date(a.at)-new Date(b.at)).slice(-4)}
function chartData(exercise,load,performanceHistory,activeSet){const planned=Math.max(1,Number(exercise.plannedSets)||1),sessionSets=[...exercise.sets].filter((set)=>set.completed&&Number(set.loadKg)>0).sort((a,b)=>a.setNumber-b.setNumber),history=recentExerciseHistory(exercise,performanceHistory),slots=Array.from({length:planned},(_,index)=>({set:index+1,value:null,state:'future'}));sessionSets.forEach((set)=>{if(slots[set.setNumber-1])slots[set.setNumber-1]={set:set.setNumber,value:Number(set.loadKg),state:'done'}});if(slots[activeSet-1]&&slots[activeSet-1].state!=='done'){const currentLoad=Number(load)||0;slots[activeSet-1]={set:activeSet,value:currentLoad||null,state:'current'}}const currentValues=slots.filter((slot)=>slot.value!==null).map((slot)=>slot.value),reference=history.map((point)=>point.load),scaleValues=currentValues.length?currentValues:reference;let min=0,max=20;if(scaleValues.length){const rawMin=Math.min(...scaleValues),rawMax=Math.max(...scaleValues),spread=Math.max(5,rawMax-rawMin);min=Math.max(0,Math.floor((rawMin-spread*.55)/2.5)*2.5);max=Math.ceil((rawMax+spread*.55)/2.5)*2.5;if(max-min<10)max=min+10}const doneValues=sessionSets.map((set)=>Number(set.loadKg)),trendUp=doneValues.length>=3&&doneValues.at(-1)>doneValues.at(-3)&&doneValues.at(-1)>=doneValues.at(-2);return{slots,history,min,max,trendUp,activeSet,planned,sessionCount:sessionSets.length,latestHistory:history.at(-1)||null}}

const GRAPH={w:360,h:112,left:18,right:342,top:14,bottom:72,labelY:101};
function chartY(value,min,max){return GRAPH.bottom-((value-min)/(max-min))*(GRAPH.bottom-GRAPH.top)}
function chartMarkup(graph){const xFor=(index)=>graph.planned===1?GRAPH.w/2:GRAPH.left+(GRAPH.right-GRAPH.left)*(index/Math.max(1,graph.planned-1)),mid=(graph.min+graph.max)/2,midY=chartY(mid,graph.min,graph.max),guide=`<line class="live-grid-line" x1="${GRAPH.left}" y1="${midY}" x2="${GRAPH.right}" y2="${midY}"/><line class="live-chart-baseline" x1="${GRAPH.left}" y1="${GRAPH.bottom}" x2="${GRAPH.right}" y2="${GRAPH.bottom}"/>`,completed=graph.slots.filter((slot)=>slot.state==='done'||(slot.state==='current'&&slot.value!==null)),coords=completed.map((slot)=>({x:xFor(slot.set-1),y:chartY(slot.value,graph.min,graph.max),value:slot.value,state:slot.state,set:slot.set})),line=coords.length>1?`<path class="live-chart-line" d="M ${coords.map((point)=>`${point.x} ${point.y}`).join(' L ')}"/>`:'';const points=graph.slots.map((slot)=>{const x=xFor(slot.set-1),y=slot.value!==null?chartY(slot.value,graph.min,graph.max):GRAPH.bottom,cls=slot.state==='done'?'done':slot.state==='current'?'current':'future',value=slot.value!==null?`<text class="live-value-label" x="${x}" y="${Math.max(GRAPH.top+8,y-10)}">${Number(slot.value.toFixed(2))}</text>`:'';return`<circle cx="${x}" cy="${y}" r="${slot.state==='future'?4.4:5.2}" class="live-set-point ${cls}"/>${value}<text class="live-x-label ${slot.state==='current'?'is-current':''}" x="${x}" y="${GRAPH.labelY}">סט ${slot.set}</text>`}).join('');return`${guide}${line}${points}`}
function performanceMarkup(graph){if(!graph.sessionCount){const history=graph.latestHistory,historyText=history?`אימון קודם · ${Number(history.load.toFixed(2))} ק״ג${history.reps?` × ${history.reps}`:''}`:'אין עדיין נתונים לתרגיל הזה';return`<section class="live-performance is-empty"><div class="live-performance-empty"><div><span>התקדמות הסטים</span><strong>הגרף יתחיל אחרי הסט הראשון</strong><small>${historyText}</small></div><i aria-hidden="true">↗</i></div></section>`}const note=graph.trendUp?'מגמת עלייה בשלושת הסטים האחרונים':graph.sessionCount>1?'הגרף מתעדכן אחרי כל סט שנשמר':'';return`<section class="live-performance has-data"><div class="live-performance-head"><span>משקל לפי סט</span><small>${graph.sessionCount}/${graph.planned} נשמרו</small></div><svg class="live-chart" viewBox="0 0 ${GRAPH.w} ${GRAPH.h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="גרף התקדמות משקל לפי סט">${chartMarkup(graph)}</svg>${note?`<div class="live-fire-note"><span>${note}</span></div>`:''}</section>`}

function ActiveWorkoutScreen(session, performanceHistory = []) {
  const exercise = currentExercise(session);
  if (!exercise) return '';
  const included = includedExercises(session);
  const map = setMap(exercise);
  let active = 1;
  for (let number = 1; number <= exercise.plannedSets; number += 1) {
    if (!map.get(number)?.completed) {
      active = number;
      break;
    }
    active = exercise.plannedSets;
  }
  const previous = lastCompletedSet(exercise);
  const load = previous?.loadKg ?? 0;
  const reps = previous?.reps ?? targetRepDefault(exercise.targetReps);
  const rir = previous?.rir ?? exercise.targetRirMax ?? 2;
  const completedSets = completedSetCount(session);
  const plannedSets = plannedSetCount(session);
  const completedExercises = completedExerciseCount(session);
  const percent = plannedSets ? Math.round(completedSets / plannedSets * 100) : 0;
  const next = session.exercises.find((item) => !item.isSkipped && Number(item.plannedSets) > 0 && item.position > exercise.position && item.sets.filter((set) => set.completed).length < item.plannedSets);
  const graph = chartData(exercise, load, performanceHistory, active);
  const art = workoutArt(session);
  const muscle = exerciseMuscleLabel(exercise);
  return `<div class="active-workout-page live-minimal" dir="rtl" data-active-session="${session.id}" data-started-at="${escapeHtml(session.startedAt)}"><header class="live-workout-header"><button type="button" data-minimize-workout>‹</button><div><strong>${escapeHtml(session.name)}</strong><span><b id="liveWorkoutElapsed">00:00:00</b>　•　${completedExercises}/${included.length} תרגילים</span></div><div class="live-menu-wrap"><button class="live-more" type="button" data-workout-menu-toggle aria-haspopup="menu" aria-expanded="false" aria-label="אפשרויות אימון">•••</button><div class="live-workout-menu" data-workout-menu role="menu" hidden><button type="button" role="menuitem" data-cancel-session="${session.id}"><span>ביטול אימון</span><small>הסטים שכבר נשמרו יישארו בהיסטוריה</small></button></div></div></header><div class="live-total-progress"><i style="--progress:${percent}%"></i></div><section class="live-hero-flat"><div class="live-exercise-name"><div class="live-ring" aria-label="סט נוכחי ${active} מתוך ${exercise.plannedSets}"><span>סט נוכחי</span><b><em>${active}</em><i>/</i>${exercise.plannedSets}</b></div><h1>${escapeHtml(exercise.name)}</h1><p>${escapeHtml(muscle)}</p></div><div class="live-muscle-figure"><img src="${art}" alt="" loading="eager"></div></section>${performanceMarkup(graph)}<form id="liveSetForm" class="live-entry-form" data-set-form data-session-exercise-id="${exercise.id}" data-set-number="${active}" data-rest-seconds="${exercise.restMaxSeconds}"><div class="live-inline-fields"><div><label>חזרות</label><input id="liveReps" name="reps" type="number" min="0" value="${reps}" required><p><button type="button" data-step="-1" data-step-target="liveReps">−</button><button type="button" data-step="1" data-step-target="liveReps">＋</button></p></div><div><label>משקל (ק״ג)</label><input id="liveWeight" name="loadKg" type="number" min="0" step="0.25" value="${load}"><p><button type="button" data-step="-2.5" data-step-target="liveWeight">−</button><button type="button" data-step="2.5" data-step-target="liveWeight">＋</button></p></div><div><label>RIR</label><input id="liveRir" name="rir" type="number" min="0" max="10" step="0.5" value="${rir}"><p><button type="button" data-step="-0.5" data-step-target="liveRir">−</button><button type="button" data-step="0.5" data-step-target="liveRir">＋</button></p></div></div><button class="live-save-set" type="submit">שמור סט ✓</button></form><section class="live-rest-flat" id="restTimer" hidden><div class="live-rest-ring"><button type="button" id="skipRestTimer">Ⅱ</button></div><div><span>הזמן מנוחה</span><strong id="restTimerValue">00:00</strong><small>עד הסט הבא</small></div></section><section class="live-next-flat"><div><small>הבא</small><strong>${escapeHtml(next?.name||'סיום האימון')}</strong><span>${next?escapeHtml(next.targetReps||''):''}</span></div><b>‹</b></section><button class="live-finish-flat" type="button" data-complete-session="${session.id}">⚑　סיום אימון</button></div>`;
}

export function WorkoutBuilderExerciseRow(){return''}
export function WorkoutsScreen({workouts=WORKOUTS,workoutData={},ui=null}={}){if(workoutData.activeSession&&ui?.type!=='overview')return ActiveWorkoutScreen(workoutData.activeSession,workoutData.performanceHistory||[]);const workout=selectedWorkout(workouts);return`<div class="workouts-concept animate-enter" dir="rtl">${AppPageHeader({title:'אימונים',subtitle:'תכנון. ביצוע. התקדמות.',rootClass:'training-header',brandClass:'training-brand',headingClass:'training-heading'})}<section class="training-calendar"><span class="training-calendar__icon">${Icon('calendar',{size:21})}</span><div class="training-calendar__days">${dayStrip()}</div></section>${hero(workout,workouts,workoutData.activeSession||null)}${summaryTiles(workout,workouts,workoutData)}${planList(workouts,workoutData,workout)}${quickStats(workoutData)}</div>`}
