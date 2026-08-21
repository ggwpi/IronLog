const ROOT_CLASS='iron-header-scrolled';
let frame=0;

function currentScrollTop(){
  const documentTop=Math.max(
    window.scrollY||0,
    document.documentElement?.scrollTop||0,
    document.body?.scrollTop||0,
  );
  const appTop=document.querySelector('.app-content')?.scrollTop||0;
  return Math.max(documentTop,appTop);
}

function syncHeaderState(){
  frame=0;
  const hasHeader=Boolean(document.querySelector('.app-page-header'));
  document.documentElement.classList.toggle(ROOT_CLASS,hasHeader&&currentScrollTop()>10);
}

function scheduleSync(){
  if(frame)return;
  frame=requestAnimationFrame(syncHeaderState);
}

window.addEventListener('scroll',scheduleSync,{passive:true});
document.addEventListener('scroll',scheduleSync,{passive:true,capture:true});
window.visualViewport?.addEventListener('scroll',scheduleSync,{passive:true});
window.visualViewport?.addEventListener('resize',scheduleSync,{passive:true});
window.addEventListener('resize',scheduleSync,{passive:true});
window.addEventListener('pageshow',scheduleSync);
window.addEventListener('hashchange',scheduleSync);
window.addEventListener('popstate',scheduleSync);
window.addEventListener('ironlog:navigate',scheduleSync);

const app=document.querySelector('#app');
if(app)new MutationObserver(scheduleSync).observe(app,{childList:true,subtree:true});

scheduleSync();
