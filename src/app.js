(function(){
  'use strict';
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const program=window.IRONLOG_PROGRAM, store=window.IronStorage;
  const state={workout:null,exerciseIndex:0,setIndex:0,run:null,restEndsAt:0,restTimer:null,sheetWorkout:null};
  const els={
    home:$('#homeView'),history:$('#historyView'),weight:$('#weightView'),grid:$('#workoutGrid'),
    sheet:$('#workoutSheet'),backdrop:$('#sheetBackdrop'),sheetList:$('#sheetExerciseList'),workoutView:$('#workoutView'),
    selector:$('#exerciseSelector'),title:$('#exerciseTitle'),ring:$('#setRing'),ringText:$('#setRingText'),load:$('#loadInput'),reps:$('#repsInput'),rir:$('#rirInput'),
    restCard:$('#restCard'),restText:$('#restTimerText'),videoPanel:$('#videoPanel'),toast:$('#toast')
  };
  function fmtTime(sec){sec=Math.max(0,Math.round(sec));return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}
  function totalSets(w){return w.exercises.reduce((n,e)=>n+e.sets,0)}
  function estimatedMinutes(w){return Math.round(w.exercises.reduce((m,e)=>m+e.sets*(e.compound?4.2:2.7),0));}
  function todayWorkout(){const day=new Date().getDay();const map={1:0,2:1,3:2,4:3,5:4,6:5};return program[map[day]??0];}
  function showToast(msg){els.toast.textContent=msg;els.toast.hidden=false;clearTimeout(showToast.t);showToast.t=setTimeout(()=>els.toast.hidden=true,2200);}
  function switchView(name){[els.home,els.history,els.weight].forEach(v=>v.classList.remove('active'));({home:els.home,history:els.history,weight:els.weight}[name]).classList.add('active');}
  function renderHome(){
    const st=store.get(), next=todayWorkout();
    $('#nextWorkoutTitle').textContent=next.short+' · '+next.title;
    $('#nextWorkoutMeta').textContent=`${next.exercises.length} תרגילים · ${totalSets(next)} סטים`;
    $('#todaySummary').textContent=new Intl.DateTimeFormat('he-IL',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
    $('#workoutCount').textContent=st.sessions.length;
    const bw=st.bodyWeight.at(-1);$('#latestWeight').textContent=bw?`${bw.value.toFixed(1)} ק״ג`:'—';
    els.grid.innerHTML=program.map((w,i)=>`<button class="workout-card" data-workout="${i}"><div><span class="day">${w.day} · ${w.short}</span><strong>${w.title}</strong><p>${w.subtitle}</p></div><div class="meta"><span>${w.exercises.length} תרגילים</span><span>${totalSets(w)} סטים</span></div></button>`).join('');
    $$('[data-workout]').forEach(b=>b.addEventListener('click',()=>openSheet(program[+b.dataset.workout])));
  }
  function openSheet(w){
    state.sheetWorkout=w;$('#sheetTitle').textContent=w.short+' · '+w.title;$('#sheetExerciseCount').textContent=w.exercises.length;$('#sheetSetCount').textContent=totalSets(w);$('#sheetTime').textContent=`~${estimatedMinutes(w)} דק׳`;
    els.sheetList.innerHTML=w.exercises.map((e,i)=>{const d=store.getDraft(w.id,e.id);const done=d?.sets?.filter(s=>s.status==='done').length||0;return `<button class="sheet-exercise-row" data-sheet-ex="${i}"><span class="exercise-num">${i+1}</span><span class="copy"><strong>${e.name}</strong><small>${e.sets} סטים · ${e.reps} חזרות · ${fmtTime(e.rest)} מנוחה</small></span><span class="${done===e.sets?'done':''}">${done}/${e.sets}</span></button>`}).join('');
    $$('[data-sheet-ex]').forEach(b=>b.addEventListener('click',()=>startWorkout(w,+b.dataset.sheetEx)));
    els.backdrop.hidden=false;els.sheet.classList.add('open');els.sheet.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
  }
  function closeSheet(){els.sheet.classList.remove('open','full');els.sheet.setAttribute('aria-hidden','true');els.backdrop.hidden=true;document.body.style.overflow='';}
  let dragStart=0,dragLast=0;
  $('#sheetGrabber').addEventListener('pointerdown',e=>{dragStart=dragLast=e.clientY;$('#sheetGrabber').setPointerCapture?.(e.pointerId)});
  $('#sheetGrabber').addEventListener('pointermove',e=>{if(!dragStart)return;dragLast=e.clientY});
  $('#sheetGrabber').addEventListener('pointerup',()=>{if(!dragStart)return;const dy=dragLast-dragStart;if(dy<-35)els.sheet.classList.add('full');else if(dy>45&&els.sheet.classList.contains('full'))els.sheet.classList.remove('full');else if(dy>70)closeSheet();dragStart=0});
  function buildDraft(w,e){
    const old=store.getDraft(w.id,e.id);
    if(old&&Array.isArray(old.sets)&&old.sets.length===e.sets)return old;
    return {sets:Array.from({length:e.sets},(_,i)=>old?.sets?.[i]||{status:'pending',load:'',reps:'',rir:'',at:null}),updatedAt:new Date().toISOString()};
  }
  function startWorkout(w,index=0){
    closeSheet();state.workout=w;state.exerciseIndex=Math.min(Math.max(index,0),w.exercises.length-1);state.run={workoutId:w.id,startedAt:new Date().toISOString()};
    els.workoutView.classList.add('active');els.workoutView.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';renderExercise(true);
  }
  function currentExercise(){return state.workout.exercises[state.exerciseIndex]}
  function firstPending(draft){const i=draft.sets.findIndex(s=>s.status==='pending');return i<0?draft.sets.length-1:i}
  function renderExercise(resetSet=false){
    const w=state.workout,e=currentExercise(),draft=buildDraft(w,e);store.setDraft(w.id,e.id,draft);if(resetSet)state.setIndex=firstPending(draft);state.setIndex=Math.min(state.setIndex,e.sets-1);
    $('#bigWorkoutTitle').textContent=w.short;$('#exerciseIndex').textContent=`${state.exerciseIndex+1} מתוך ${w.exercises.length}`;els.title.textContent=e.name;$('#muscleChip').textContent=e.muscle;$('#targetReps').textContent=e.reps;$('#targetRest').textContent=fmtTime(e.rest);
    const previous=store.lastExerciseResult(e.id),lastSet=previous?.sets?.find(s=>s.status==='done');$('#lastLoad').textContent=lastSet?(lastSet.load?`${lastSet.load} ק״ג`:`${lastSet.reps||'—'} חזרות`):'—';
    renderSet();renderSelector();renderNext();closeVideo();stopRest(false);
  }
  function renderSet(){
    const e=currentExercise(),d=buildDraft(state.workout,e),s=d.sets[state.setIndex];
    els.ringText.textContent=`${state.setIndex+1}/${e.sets}`;const done=d.sets.filter(x=>x.status==='done').length;els.ring.style.setProperty('--progress',`${(done/e.sets)*100}%`);
    $('#currentSetLabel').textContent=`סט ${state.setIndex+1}`;$('#setStatePill').textContent=s.status==='done'?'הושלם':s.status==='skipped'?'דולג':'מוכן';$('#setStatePill').className='state-pill'+(s.status==='done'?' done':'');
    els.load.value=s.load??'';els.reps.value=s.reps??'';els.rir.value=s.rir??'';
    const prev=store.lastExerciseResult(e.id)?.sets?.[state.setIndex];$('#previousHint').textContent=prev?`פעם קודמת: ${prev.load||'—'} ק״ג · ${prev.reps||'—'} חזרות · RIR ${prev.rir??'—'}`:'אין נתון קודם לסט הזה';
  }
  function persistInputs(){
    if(!state.workout)return;const e=currentExercise(),d=buildDraft(state.workout,e),s=d.sets[state.setIndex];s.load=els.load.value;s.reps=els.reps.value;s.rir=els.rir.value;d.updatedAt=new Date().toISOString();store.setDraft(state.workout.id,e.id,d);
  }
  function completeSet(skip=false){
    persistInputs();const e=currentExercise(),d=buildDraft(state.workout,e),s=d.sets[state.setIndex];s.status=skip?'skipped':'done';s.at=new Date().toISOString();store.setDraft(state.workout.id,e.id,d);renderSet();
    if(!skip)startRest(e.rest);
    const nextPending=d.sets.findIndex((x,i)=>i>state.setIndex&&x.status==='pending');
    if(nextPending>=0){state.setIndex=nextPending;setTimeout(renderSet,220);return;}
    if(d.sets.every(x=>x.status!=='pending')) setTimeout(()=>advanceExercise(),skip?120:450);
  }
  function advanceExercise(){if(state.exerciseIndex<state.workout.exercises.length-1){state.exerciseIndex++;state.setIndex=0;renderExercise(true);els.workoutView.scrollTo({top:0,behavior:'smooth'});}else finishWorkout();}
  function finishWorkout(){
    const w=state.workout;const exercises=w.exercises.map(e=>{const d=store.getDraft(w.id,e.id)||buildDraft(w,e);return {exerciseId:e.id,name:e.name,sets:d.sets.map(x=>({...x}))};});
    store.addSession({id:(crypto.randomUUID?.()||String(Date.now())),workoutId:w.id,workoutTitle:w.title,short:w.short,startedAt:state.run?.startedAt||new Date().toISOString(),completedAt:new Date().toISOString(),exercises});store.clearWorkoutDrafts(w.id);exitWorkout();renderHome();showToast('האימון נשמר ✓');
  }
  function exitWorkout(){stopRest();closeVideo();els.workoutView.classList.remove('active');els.workoutView.setAttribute('aria-hidden','true');els.selector.hidden=true;document.body.style.overflow='';state.workout=null;state.run=null;}
  function renderSelector(){els.selector.innerHTML=state.workout.exercises.map((e,i)=>{const d=store.getDraft(state.workout.id,e.id);const done=d?.sets?.filter(s=>s.status==='done').length||0;return `<button data-pick="${i}" class="${i===state.exerciseIndex?'active':''}">${i+1}. ${e.name} · ${done}/${e.sets}</button>`}).join('');$$('[data-pick]').forEach(b=>b.onclick=()=>{state.exerciseIndex=+b.dataset.pick;els.selector.hidden=true;renderExercise(true)});}
  function renderNext(){const next=state.workout.exercises[state.exerciseIndex+1];$('#nextExerciseName').textContent=next?next.name:'סיום האימון';}
  function openVideo(){const e=currentExercise();$('#videoFallback').href=e.video;els.videoPanel.hidden=false;$('#openVideoBtn').textContent='↗ הסרטון פתוח';}
  function closeVideo(){els.videoPanel.hidden=true;$('#openVideoBtn').textContent='▶ סרטון תרגיל';}
  function startRest(sec){stopRest(false);state.restEndsAt=Date.now()+sec*1000;els.restCard.hidden=false;tickRest();state.restTimer=setInterval(tickRest,250);}
  function tickRest(){const remaining=Math.ceil((state.restEndsAt-Date.now())/1000);els.restText.textContent=fmtTime(remaining);if(remaining<=0){stopRest();navigator.vibrate?.([120,60,120]);showToast('המנוחה הסתיימה');}}
  function stopRest(hide=true){clearInterval(state.restTimer);state.restTimer=null;if(hide)els.restCard.hidden=true;}
  function adjustRest(delta){state.restEndsAt+=delta*1000;tickRest();}
  function renderHistory(){const items=[...store.get().sessions].reverse();$('#historyList').innerHTML=items.length?items.map(s=>{const done=s.exercises?.reduce((n,e)=>n+(e.sets||[]).filter(x=>x.status==='done').length,0)||0;return `<div class="history-row"><strong>${s.short||''} · ${s.workoutTitle||s.workoutId}</strong><small>${new Date(s.completedAt).toLocaleString('he-IL')} · ${done} סטים הושלמו</small></div>`}).join(''):'<div class="history-row">עדיין אין אימונים שמורים.</div>';}
  function renderWeights(){const items=[...store.get().bodyWeight].reverse();$('#weightList').innerHTML=items.length?items.map(x=>`<div class="history-row"><strong>${Number(x.value).toFixed(1)} ק״ג</strong><small>${new Date(x.at).toLocaleString('he-IL')}</small></div>`).join(''):'<div class="history-row">עדיין אין מדידות.</div>';}
  function downloadBackup(){const blob=new Blob([store.exportData()],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`ironlog-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
  $('#startNextBtn').onclick=()=>openSheet(todayWorkout());$('#sheetStartBtn').onclick=()=>startWorkout(state.sheetWorkout,0);$('#closeSheet').onclick=closeSheet;els.backdrop.onclick=closeSheet;
  $('#exitWorkoutBtn').onclick=()=>{persistInputs();if(confirm('לצאת מהאימון? הנתונים שהקלדת יישמרו כטיוטה.'))exitWorkout()};
  $('#exercisePickerBtn').onclick=()=>{els.selector.hidden=!els.selector.hidden};$('#openVideoBtn').onclick=openVideo;$('#closeVideoBtn').onclick=closeVideo;
  $('#completeSetBtn').onclick=()=>completeSet(false);$('#skipSetBtn').onclick=()=>completeSet(true);$('#nextExerciseStrip').onclick=()=>advanceExercise();
  [els.load,els.reps,els.rir].forEach(i=>i.addEventListener('change',persistInputs));$('#minusRestBtn').onclick=()=>adjustRest(-15);$('#plusRestBtn').onclick=()=>adjustRest(15);$('#skipRestBtn').onclick=()=>stopRest();
  $('#historyBtn').onclick=()=>{renderHistory();switchView('history')};$('#bodyWeightBtn').onclick=()=>{renderWeights();switchView('weight')};$$('[data-back]').forEach(b=>b.onclick=()=>switchView('home'));
  $('#weightForm').onsubmit=e=>{e.preventDefault();const v=parseFloat($('#weightInput').value);if(!Number.isFinite(v)||v<20)return;store.addWeight(v);$('#weightInput').value='';renderWeights();renderHome();showToast('המשקל נשמר')};
  $('#settingsBtn').onclick=()=>$('#settingsDialog').showModal();$('#exportBtn').onclick=downloadBackup;$('#importInput').onchange=async e=>{try{const f=e.target.files?.[0];if(!f)return;store.importData(JSON.parse(await f.text()));renderHome();showToast('הגיבוי נטען');$('#settingsDialog').close();}catch(err){alert('לא ניתן לטעון את הגיבוי')}};
  $('#resetBtn').onclick=()=>{if(confirm('למחוק את כל היסטוריית IronLog מהמכשיר?')){store.reset();renderHome();$('#settingsDialog').close();showToast('הנתונים אופסו')}};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.restEndsAt)tickRest()});
  window.addEventListener('beforeunload',()=>{if(state.workout)persistInputs()});
  renderHome();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});
})();
