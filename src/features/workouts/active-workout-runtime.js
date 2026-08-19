const ACTIVE_KEY='ironlog:active-workout',REST_KEY_PREFIX='ironlog:rest:',REST_TOTAL_KEY_PREFIX='ironlog:rest-total:';
let elapsedInterval=null,restInterval=null,saveTimer=null,hydrateTimer=null,pendingRest=null;

const menuPositionStyle=document.createElement('style');
menuPositionStyle.id='ironlog-active-menu-position';
menuPositionStyle.textContent=`.live-workout-menu{position:fixed!important;right:auto!important;inset-inline:auto!important;width:min(210px,calc(100vw - 32px))!important;z-index:99999!important;transform:none!important;margin:0!important}.live-workout-menu button{text-align:right!important}`;
if(!document.getElementById(menuPositionStyle.id))document.head.appendChild(menuPositionStyle);

const polishStylesheet=document.createElement('link');
polishStylesheet.rel='stylesheet';
polishStylesheet.href='/src/features/workouts/active-workout-polish.css?v=4';
polishStylesheet.dataset.activeWorkoutPolish='true';
if(!document.querySelector('link[data-active-workout-polish]'))document.head.appendChild(polishStylesheet);

function menuHome(){return document.querySelector('.live-menu-wrap')}
function portalWorkoutMenu(menu){if(menu&&menu.parentElement!==document.body)document.body.appendChild(menu)}
function restoreWorkoutMenu(menu){const home=menuHome();if(menu&&home&&menu.parentElement!==home)home.appendChild(menu)}
function positionWorkoutMenu(toggle,menu){if(!toggle||!menu)return;portalWorkoutMenu(menu);const r=toggle.getBoundingClientRect(),vv=window.visualViewport,width=Math.min(210,(vv?.width||window.innerWidth)-32),viewportLeft=vv?.offsetLeft||0,viewportTop=vv?.offsetTop||0,viewportWidth=vv?.width||window.innerWidth;const left=Math.max(viewportLeft+16,Math.min(viewportLeft+viewportWidth-width-16,r.right-width));const top=Math.max(viewportTop+12,r.bottom+8);menu.style.width=`${width}px`;menu.style.left=`${left}px`;menu.style.top=`${top}px`;menu.style.right='auto'}
function formatElapsed(ms){const t=Math.max(0,Math.floor(ms/1000)),h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;return`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function restKey(id){return`${REST_KEY_PREFIX}${id}`}
function restTotalKey(id){return`${REST_TOTAL_KEY_PREFIX}${id}`}
function stopTimers(){if(elapsedInterval)clearInterval(elapsedInterval);if(restInterval)clearInterval(restInterval);elapsedInterval=restInterval=null}
function closeWorkoutMenu(){const menu=document.querySelector('[data-workout-menu]'),toggle=document.querySelector('[data-workout-menu-toggle]');if(menu){menu.hidden=true;restoreWorkoutMenu(menu)}if(toggle)toggle.setAttribute('aria-expanded','false')}
function setText(element,text){if(element&&element.textContent!==text)element.textContent=text}
function defaultRestSeconds(){const seconds=Number(document.querySelector('#liveSetForm')?.dataset.restSeconds||0);return Number.isFinite(seconds)&&seconds>0?seconds:120}

function ensureManualRestButton(){
  const header=document.querySelector('.live-workout-header'),menu=document.querySelector('.live-menu-wrap');
  if(!header||!menu||header.querySelector('[data-manual-rest]'))return;
  const button=document.createElement('button');
  button.type='button';
  button.className='live-manual-rest';
  button.dataset.manualRest='true';
  button.setAttribute('aria-label','התחל מנוחה');
  button.setAttribute('title','מנוחה');
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.25"></circle><path d="M12 7.4v4.9l3.2 1.9"></path><path d="M8.1 3.7 6.8 2.4M15.9 3.7l1.3-1.3"></path></svg>';
  header.insertBefore(button,menu);
}

function ensureRestOverlay(){
  const shell=document.querySelector('#restTimer');
  if(!shell)return null;
  if(!shell.querySelector('.live-rest-center')){
    shell.innerHTML=`<div class="live-rest-top"><span class="live-rest-kicker"><i></i>מנוחה</span><button type="button" id="skipRestTimer">סיום מנוחה</button></div><div class="live-rest-center"><span>הזמן שלך להתאושש</span><strong id="restTimerValue">00:00</strong><div class="live-rest-progress" aria-hidden="true"><i></i></div><small>נחזור לאותו סט בדיוק</small></div><div class="live-rest-actions"><button type="button" data-add-rest="30"><b>＋</b><span>30 שנ׳</span></button></div>`;
  }
  return shell;
}

function hideRest(id){
  const shell=ensureRestOverlay();
  if(id){localStorage.removeItem(restKey(id));localStorage.removeItem(restTotalKey(id))}
  if(restInterval)clearInterval(restInterval);
  restInterval=null;
  if(shell){shell.hidden=true;shell.classList.remove('is-finished');shell.style.removeProperty('--rest-progress')}
}

function paintRest(id,endAt){
  const shell=ensureRestOverlay(),value=shell?.querySelector('#restTimerValue');
  if(!shell||!value)return;
  if(restInterval)clearInterval(restInterval);
  shell.hidden=false;
  shell.classList.remove('is-finished');
  const fallbackTotal=Math.max(1,Math.ceil((endAt-Date.now())/1000));
  const total=Math.max(1,Number(localStorage.getItem(restTotalKey(id)))||fallbackTotal);
  const update=()=>{
    const remaining=Math.max(0,Math.ceil((endAt-Date.now())/1000));
    setText(value,`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`);
    shell.style.setProperty('--rest-progress',`${Math.max(0,Math.min(100,(remaining/total)*100))}%`);
    shell.classList.toggle('is-finished',remaining===0);
    if(remaining>0)return;
    if(restInterval)clearInterval(restInterval);
    restInterval=null;
    localStorage.removeItem(restKey(id));
    localStorage.removeItem(restTotalKey(id));
    window.setTimeout(()=>{if(shell.classList.contains('is-finished'))shell.hidden=true},900);
  };
  update();
  if(endAt>Date.now())restInterval=setInterval(update,250);
}

function beginRest(id,seconds){
  if(!id)return;
  const duration=Math.max(1,Math.round(Number(seconds)||defaultRestSeconds()));
  const endAt=Date.now()+duration*1000;
  localStorage.setItem(restKey(id),String(endAt));
  localStorage.setItem(restTotalKey(id),String(duration));
  paintRest(id,endAt);
}

function addRestTime(id,seconds=30){
  if(!id)return;
  const now=Date.now(),storedEnd=Number(localStorage.getItem(restKey(id))||0),baseEnd=Math.max(now,storedEnd),extra=Math.max(1,Number(seconds)||30),endAt=baseEnd+extra*1000,currentTotal=Math.max(0,Number(localStorage.getItem(restTotalKey(id))||0)),remainingBefore=Math.max(0,Math.ceil((baseEnd-now)/1000));
  localStorage.setItem(restKey(id),String(endAt));
  localStorage.setItem(restTotalKey(id),String(Math.max(currentTotal,remainingBefore)+extra));
  paintRest(id,endAt);
}

function workoutProgress(){const bar=document.querySelector('.live-total-progress i'),raw=bar?.style.getPropertyValue('--progress')||'';const value=Number.parseFloat(raw);return Number.isFinite(value)?value:0}
function setPosition(){const text=document.querySelector('.live-ring b')?.textContent||'',match=text.match(/(\d+)\s*\/\s*(\d+)/);return match?{current:Number(match[1]),planned:Number(match[2])}:{current:0,planned:0}}
function exerciseName(){return(document.querySelector('.live-exercise-name h1')?.textContent||'').trim()}
function isFinalExercise(){return(document.querySelector('.live-next-flat strong')?.textContent||'').trim()==='סיום האימון'}
function isFinalUnsavedSet(){const{current,planned}=setPosition();return workoutProgress()<100&&planned>0&&current===planned&&isFinalExercise()}
function stateChangedSince(before){const now=setPosition();return workoutProgress()!==before.progress||exerciseName()!==before.exercise||now.current!==before.current||now.planned!==before.planned}

function polishActiveWorkout(){
  const page=document.querySelector('.active-workout-page');
  if(!page)return;
  ensureManualRestButton();
  ensureRestOverlay();
  const ring=document.querySelector('.live-ring');
  if(ring){ring.type='button';ring.removeAttribute('form');ring.setAttribute('aria-label','מצב הסט הנוכחי');ring.setAttribute('aria-disabled','true');ring.tabIndex=-1}
  const action=document.querySelector('.live-finish-flat');
  if(!action)return;
  const progress=workoutProgress();
  action.classList.toggle('is-set-action',progress<100);
  action.classList.toggle('is-workout-final',progress>=100);
  action.classList.toggle('is-final-set',isFinalUnsavedSet());
  if(progress<100){setText(action,'סיום סט');action.setAttribute('aria-label','שמור וסיים את הסט הנוכחי')}
  else{setText(action,'סיום אימון');action.setAttribute('aria-label','סיים את האימון')}
}

function hydrateActiveScreen(){
  const page=document.querySelector('.active-workout-page');
  if(!page)return;
  const id=page.dataset.activeSession,started=new Date(page.dataset.startedAt).getTime();
  localStorage.setItem(ACTIVE_KEY,id||'active');
  const elapsed=document.querySelector('#liveWorkoutElapsed');
  if(elapsed&&Number.isFinite(started)){const paint=()=>setText(elapsed,formatElapsed(Date.now()-started));paint();elapsedInterval=setInterval(paint,1000)}
  polishActiveWorkout();
  if(id){
    const saved=Number(localStorage.getItem(restKey(id))||0);
    if(saved>Date.now())paintRest(id,saved);
    else if(saved){localStorage.removeItem(restKey(id));localStorage.removeItem(restTotalKey(id))}
    if(!saved&&pendingRest?.id===id&&stateChangedSince(pendingRest.before)){
      const seconds=pendingRest.seconds;
      pendingRest=null;
      beginRest(id,seconds);
    }
  }
}

function rehydrate(){stopTimers();hydrateActiveScreen()}
function scheduleHydrate(){window.clearTimeout(hydrateTimer);hydrateTimer=window.setTimeout(rehydrate,16)}
function watchForSessionEnd(sessionId){const started=Date.now(),timer=setInterval(()=>{const page=document.querySelector('.active-workout-page');if(!page&&location.hash.includes('/workouts')){localStorage.removeItem(ACTIVE_KEY);if(sessionId){localStorage.removeItem(restKey(sessionId));localStorage.removeItem(restTotalKey(sessionId))}clearInterval(timer);return}if(Date.now()-started>12000)clearInterval(timer)},180)}

if(localStorage.getItem(ACTIVE_KEY)&&!location.hash.includes('/workouts'))history.replaceState(null,'','#/workouts');
const appRoot=document.querySelector('#app');
if(appRoot)new MutationObserver(scheduleHydrate).observe(appRoot,{childList:true});
addEventListener('pageshow',()=>{closeWorkoutMenu();scheduleHydrate()});
addEventListener('resize',()=>{const menu=document.querySelector('[data-workout-menu]'),toggle=document.querySelector('[data-workout-menu-toggle]');if(menu&&!menu.hidden)positionWorkoutMenu(toggle,menu)});
window.visualViewport?.addEventListener('resize',()=>{const menu=document.querySelector('[data-workout-menu]'),toggle=document.querySelector('[data-workout-menu-toggle]');if(menu&&!menu.hidden)positionWorkoutMenu(toggle,menu)});
window.visualViewport?.addEventListener('scroll',()=>{const menu=document.querySelector('[data-workout-menu]'),toggle=document.querySelector('[data-workout-menu-toggle]');if(menu&&!menu.hidden)positionWorkoutMenu(toggle,menu)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){closeWorkoutMenu();scheduleHydrate()}});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeWorkoutMenu()});
document.addEventListener('click',event=>{
  const ring=event.target.closest('.live-ring');
  if(ring){event.preventDefault();event.stopImmediatePropagation();return}

  const manualRest=event.target.closest('[data-manual-rest]');
  if(manualRest){
    event.preventDefault();
    closeWorkoutMenu();
    const page=document.querySelector('.active-workout-page');
    beginRest(page?.dataset.activeSession,defaultRestSeconds());
    return;
  }

  const addRest=event.target.closest('[data-add-rest]');
  if(addRest){
    event.preventDefault();
    const page=document.querySelector('.active-workout-page');
    addRestTime(page?.dataset.activeSession,Number(addRest.dataset.addRest||30));
    return;
  }

  if(event.target.closest('#skipRestTimer')){
    event.preventDefault();
    const page=document.querySelector('.active-workout-page');
    hideRest(page?.dataset.activeSession);
    return;
  }

  const workoutAction=event.target.closest('.live-finish-flat');
  if(workoutAction&&workoutProgress()<100){
    event.preventDefault();event.stopImmediatePropagation();
    const form=document.querySelector('#liveSetForm'),submit=form?.querySelector('button[type="submit"]');
    if(!form||submit?.disabled)return;
    if(isFinalUnsavedSet())form.dataset.restSeconds='0';
    form.requestSubmit();
    return;
  }

  const toggle=event.target.closest('[data-workout-menu-toggle]');
  if(toggle){const menu=document.querySelector('[data-workout-menu]');if(!menu)return;const open=menu.hidden;if(open){positionWorkoutMenu(toggle,menu);menu.hidden=false}else closeWorkoutMenu();toggle.setAttribute('aria-expanded',String(open));return}
  if(!event.target.closest('[data-workout-menu]'))closeWorkoutMenu();

  const step=event.target.closest('[data-step]');
  if(step){const input=document.getElementById(step.dataset.stepTarget);if(input){const next=Math.max(Number(input.min||0),Number(input.value||0)+Number(step.dataset.step||0)),max=input.max===''?Infinity:Number(input.max);input.value=String(Math.min(max,Math.round(next*100)/100));input.dispatchEvent(new Event('input',{bubbles:true}))}}
  if(event.target.closest('[data-minimize-workout]'))location.hash='#/home';
  const ending=event.target.closest('[data-complete-session],[data-cancel-session]');
  if(ending){const p=document.querySelector('.active-workout-page');closeWorkoutMenu();watchForSessionEnd(p?.dataset.activeSession)}
},true);

document.addEventListener('input',event=>{if(!event.target.closest('.live-inline-fields'))return;clearTimeout(saveTimer);saveTimer=setTimeout(()=>{const form=event.target.closest('form');if(form)form.dataset.edited='true'},120)},true);
document.addEventListener('submit',event=>{
  const form=event.target.closest('[data-set-form]');
  if(!form)return;
  const page=document.querySelector('.active-workout-page'),id=page?.dataset.activeSession,seconds=Number(form.dataset.restSeconds||0),pos=setPosition();
  if(id&&seconds>0){
    const pending={id,seconds,before:{progress:workoutProgress(),exercise:exerciseName(),current:pos.current,planned:pos.planned}};
    pendingRest=pending;
    window.setTimeout(()=>{if(pendingRest===pending)pendingRest=null},15000);
  }else pendingRest=null;
},true);

closeWorkoutMenu();
scheduleHydrate();
