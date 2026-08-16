const ACTIVE_KEY='ironlog:active-workout',REST_KEY_PREFIX='ironlog:rest:';
let elapsedInterval=null,restInterval=null,saveTimer=null,finishAfterFinalSet=false;

const menuPositionStyle=document.createElement('style');
menuPositionStyle.id='ironlog-active-menu-position';
menuPositionStyle.textContent=`.live-workout-menu{position:fixed!important;right:auto!important;inset-inline:auto!important;width:min(210px,calc(100vw - 32px))!important;z-index:99999!important;transform:none!important;margin:0!important}.live-workout-menu button{text-align:right!important}`;
if(!document.getElementById(menuPositionStyle.id))document.head.appendChild(menuPositionStyle);

const polishStylesheet=document.createElement('link');
polishStylesheet.rel='stylesheet';
polishStylesheet.href='/src/features/workouts/active-workout-polish.css?v=1';
polishStylesheet.dataset.activeWorkoutPolish='true';
if(!document.querySelector('link[data-active-workout-polish]'))document.head.appendChild(polishStylesheet);

function menuHome(){return document.querySelector('.live-menu-wrap')}
function portalWorkoutMenu(menu){if(menu&&menu.parentElement!==document.body)document.body.appendChild(menu)}
function restoreWorkoutMenu(menu){const home=menuHome();if(menu&&home&&menu.parentElement!==home)home.appendChild(menu)}
function positionWorkoutMenu(toggle,menu){if(!toggle||!menu)return;portalWorkoutMenu(menu);const r=toggle.getBoundingClientRect(),vv=window.visualViewport,width=Math.min(210,(vv?.width||window.innerWidth)-32),viewportLeft=vv?.offsetLeft||0,viewportTop=vv?.offsetTop||0,viewportWidth=vv?.width||window.innerWidth;const left=Math.max(viewportLeft+16,Math.min(viewportLeft+viewportWidth-width-16,r.right-width));const top=Math.max(viewportTop+12,r.bottom+8);menu.style.width=`${width}px`;menu.style.left=`${left}px`;menu.style.top=`${top}px`;menu.style.right='auto'}
function formatElapsed(ms){const t=Math.max(0,Math.floor(ms/1000)),h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;return`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function restKey(id){return`${REST_KEY_PREFIX}${id}`}
function stopTimers(){if(elapsedInterval)clearInterval(elapsedInterval);if(restInterval)clearInterval(restInterval);elapsedInterval=restInterval=null}
function closeWorkoutMenu(){const menu=document.querySelector('[data-workout-menu]'),toggle=document.querySelector('[data-workout-menu-toggle]');if(menu){menu.hidden=true;restoreWorkoutMenu(menu)}if(toggle)toggle.setAttribute('aria-expanded','false')}
function paintRest(id,endAt){const shell=document.querySelector('#restTimer'),value=document.querySelector('#restTimerValue');if(!shell||!value)return;const update=()=>{const r=Math.max(0,Math.ceil((endAt-Date.now())/1000));value.textContent=`${String(Math.floor(r/60)).padStart(2,'0')}:${String(r%60).padStart(2,'0')}`;const ring=shell.querySelector('.live-rest-ring');if(ring)ring.style.opacity=r?'1':'.55';if(!r){clearInterval(restInterval);restInterval=null;localStorage.removeItem(restKey(id));shell.classList.add('is-finished')}};update();if(endAt>Date.now())restInterval=setInterval(update,250)}
function workoutProgress(){const bar=document.querySelector('.live-total-progress i'),raw=bar?.style.getPropertyValue('--progress')||'';const value=Number.parseFloat(raw);return Number.isFinite(value)?value:0}
function setPosition(){const text=document.querySelector('.live-ring b')?.textContent||'',match=text.match(/(\d+)\s*\/\s*(\d+)/);return match?{current:Number(match[1]),planned:Number(match[2])}:{current:0,planned:0}}
function isFinalExercise(){return (document.querySelector('.live-next-flat strong')?.textContent||'').trim()==='סיום האימון'}
function isFinalUnsavedSet(){const {current,planned}=setPosition();return workoutProgress()<100&&planned>0&&current===planned&&isFinalExercise()}
function polishActiveWorkout(){const page=document.querySelector('.active-workout-page');if(!page)return;
  const ring=document.querySelector('.live-ring');
  if(ring){ring.type='button';ring.removeAttribute('form');ring.setAttribute('aria-label','מצב הסט הנוכחי');ring.setAttribute('aria-disabled','true');ring.tabIndex=-1}
  const action=document.querySelector('.live-finish-flat');
  if(!action)return;
  const progress=workoutProgress(),finalUnsaved=isFinalUnsavedSet();
  action.classList.toggle('is-set-action',progress<100);
  action.classList.toggle('is-workout-final',progress>=100||finalUnsaved);
  if(progress<100){
    action.textContent=finalUnsaved?'⚑  סיום אימון':'✓  סיום סט';
    action.setAttribute('aria-label',finalUnsaved?'שמור את הסט האחרון וסיים את האימון':'שמור וסיים את הסט הנוכחי');
  }else{
    action.textContent='⚑  סיום אימון';
    action.setAttribute('aria-label','סיים את האימון');
  }
  if(finishAfterFinalSet&&progress>=100){
    finishAfterFinalSet=false;
    window.setTimeout(()=>{const finish=document.querySelector('[data-complete-session]');if(finish&&!finish.disabled)finish.click()},0);
  }
}
function hydrateActiveScreen(){const page=document.querySelector('.active-workout-page');if(!page)return;const id=page.dataset.activeSession,started=new Date(page.dataset.startedAt).getTime();localStorage.setItem(ACTIVE_KEY,id||'active');const elapsed=document.querySelector('#liveWorkoutElapsed');if(elapsed&&Number.isFinite(started)){const paint=()=>elapsed.textContent=formatElapsed(Date.now()-started);paint();elapsedInterval=setInterval(paint,1000)}if(id){const saved=Number(localStorage.getItem(restKey(id))||0);if(saved>Date.now())paintRest(id,saved);else if(saved)localStorage.removeItem(restKey(id))}polishActiveWorkout()}
function rehydrate(){stopTimers();hydrateActiveScreen()}
function watchForSessionEnd(sessionId){const started=Date.now(),timer=setInterval(()=>{const page=document.querySelector('.active-workout-page');if(!page&&location.hash.includes('/workouts')){localStorage.removeItem(ACTIVE_KEY);if(sessionId)localStorage.removeItem(restKey(sessionId));clearInterval(timer);return}if(Date.now()-started>12000)clearInterval(timer)},180)}
if(localStorage.getItem(ACTIVE_KEY)&&!location.hash.includes('/workouts'))history.replaceState(null,'','#/workouts');
new MutationObserver(()=>{clearTimeout(window.__ironlogActiveHydrate);window.__ironlogActiveHydrate=setTimeout(rehydrate,10)}).observe(document.documentElement,{childList:true,subtree:true});
addEventListener('pageshow',()=>{closeWorkoutMenu();rehydrate()});
addEventListener('resize',()=>{const menu=document.querySelector('[data-workout-menu]'),toggle=document.querySelector('[data-workout-menu-toggle]');if(menu&&!menu.hidden)positionWorkoutMenu(toggle,menu)});
window.visualViewport?.addEventListener('resize',()=>{const menu=document.querySelector('[data-workout-menu]'),toggle=document.querySelector('[data-workout-menu-toggle]');if(menu&&!menu.hidden)positionWorkoutMenu(toggle,menu)});
window.visualViewport?.addEventListener('scroll',()=>{const menu=document.querySelector('[data-workout-menu]'),toggle=document.querySelector('[data-workout-menu-toggle]');if(menu&&!menu.hidden)positionWorkoutMenu(toggle,menu)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){closeWorkoutMenu();rehydrate()}});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeWorkoutMenu()});
document.addEventListener('click',event=>{
  const ring=event.target.closest('.live-ring');
  if(ring){event.preventDefault();event.stopImmediatePropagation();return}
  const workoutAction=event.target.closest('.live-finish-flat');
  if(workoutAction&&workoutProgress()<100){
    event.preventDefault();event.stopImmediatePropagation();
    const form=document.querySelector('#liveSetForm');
    if(!form||workoutAction.disabled)return;
    const finalSet=isFinalUnsavedSet();
    finishAfterFinalSet=finalSet;
    workoutAction.disabled=true;
    if(finalSet)form.dataset.restSeconds='0';
    form.requestSubmit();
    return;
  }
  const toggle=event.target.closest('[data-workout-menu-toggle]');
  if(toggle){const menu=document.querySelector('[data-workout-menu]');if(!menu)return;const open=menu.hidden;if(open){positionWorkoutMenu(toggle,menu);menu.hidden=false}else closeWorkoutMenu();toggle.setAttribute('aria-expanded',String(open));return}
  if(!event.target.closest('[data-workout-menu]'))closeWorkoutMenu();
  const step=event.target.closest('[data-step]');
  if(step){const input=document.getElementById(step.dataset.stepTarget);if(input){const next=Math.max(Number(input.min||0),Number(input.value||0)+Number(step.dataset.step||0)),max=input.max===''?Infinity:Number(input.max);input.value=String(Math.min(max,Math.round(next*100)/100));input.dispatchEvent(new Event('input',{bubbles:true}))}}
  if(event.target.closest('[data-minimize-workout]'))location.hash='#/home';
  if(event.target.closest('#skipRestTimer')){const p=document.querySelector('.active-workout-page');if(p?.dataset.activeSession)localStorage.removeItem(restKey(p.dataset.activeSession))}
  const ending=event.target.closest('[data-complete-session],[data-cancel-session]');
  if(ending){const p=document.querySelector('.active-workout-page');closeWorkoutMenu();watchForSessionEnd(p?.dataset.activeSession)}
},true);
document.addEventListener('input',event=>{if(!event.target.closest('.live-inline-fields'))return;clearTimeout(saveTimer);saveTimer=setTimeout(()=>{const form=event.target.closest('form');if(form)form.dataset.edited='true'},120)},true);
document.addEventListener('submit',event=>{const form=event.target.closest('[data-set-form]');if(!form)return;const page=document.querySelector('.active-workout-page'),id=page?.dataset.activeSession,seconds=Number(form.dataset.restSeconds||0);if(id&&seconds>0)localStorage.setItem(restKey(id),String(Date.now()+seconds*1000))},true);
closeWorkoutMenu();
rehydrate();
