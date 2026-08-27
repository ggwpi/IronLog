const ROOT_CLASS='iron-header-scrolled';
const ACTIVE_CLASS='is-iron-header-scrolled';
const HEADER_SELECTOR='[data-iron-page-header],.app-page-header,.statistics-detail-topbar';
const SCROLL_ROOT_SELECTOR='[data-iron-scroll-root],.statistics-detail-page,.app-content';
let frame=0;

function documentScrollTop(){
  return Math.max(
    window.scrollY||0,
    document.documentElement?.scrollTop||0,
    document.body?.scrollTop||0,
  );
}

function headerScrollRoot(header){
  const root=header.closest(SCROLL_ROOT_SELECTOR);
  if(!root||root===document.body||root===document.documentElement)return null;
  return root;
}

function scrollTopForHeader(header){
  const root=headerScrollRoot(header);
  if(root)return Number(root.scrollTop||0);
  return documentScrollTop();
}

function normalizeHeader(header){
  header.classList.add('iron-page-header');
  if(!header.hasAttribute('data-iron-page-header'))header.setAttribute('data-iron-page-header','');

  const root=headerScrollRoot(header);
  if(root&&!root.hasAttribute('data-iron-scroll-root'))root.setAttribute('data-iron-scroll-root','');
}

function syncHeaderState(){
  frame=0;
  const headers=[...document.querySelectorAll(HEADER_SELECTOR)];
  let anyScrolled=false;

  headers.forEach((header)=>{
    normalizeHeader(header);
    const scrolled=scrollTopForHeader(header)>6;
    header.classList.toggle(ACTIVE_CLASS,scrolled);
    anyScrolled ||= scrolled;
  });

  document.documentElement.classList.toggle(ROOT_CLASS,anyScrolled);
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

/* Observe the whole body, not only #app: extended analytics and other future
   full-screen pages may be mounted as siblings of the app shell. */
if(document.body)new MutationObserver(scheduleSync).observe(document.body,{childList:true,subtree:true});

scheduleSync();
