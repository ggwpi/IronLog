const STYLE_ID='ironlog-statistics-stocks-motion-style';
const DRAW_OVERLAY_ATTR='data-stocks-draw-overlay';

function ensureStyles(){
  if(document.getElementById(STYLE_ID))return;
  const link=document.createElement('link');
  link.id=STYLE_ID;
  link.rel='stylesheet';
  link.href='/src/features/statistics/statistics-stocks-motion.css?v=3';
  document.head.appendChild(link);
}

function reducedMotion(){
  return document.documentElement.classList.contains('reduce-motion')
    || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function restoreBaseLine(line){
  // Never let a reveal animation mutate the real data path. Older versions did,
  // which can leave Safari rendering only part of the chart after the animation.
  line.classList.remove('stocks-animated-line');
  line.style.removeProperty('stroke-dasharray');
  line.style.removeProperty('stroke-dashoffset');
  line.style.removeProperty('--stocks-path-length');
  line.removeAttribute('stroke-dasharray');
  line.removeAttribute('stroke-dashoffset');
  line.classList.add('stocks-line-base');
}

function createDrawOverlay(svg,line){
  if(svg.querySelector(`[${DRAW_OVERLAY_ATTR}]`))return;

  const length=typeof line.getTotalLength==='function'?line.getTotalLength():0;
  if(!Number.isFinite(length)||length<=0||reducedMotion()){
    line.classList.add('stocks-line-reveal-done');
    return;
  }

  const overlay=line.cloneNode(false);
  overlay.removeAttribute('style');
  overlay.removeAttribute('data-stocks-motion-line');
  overlay.setAttribute(DRAW_OVERLAY_ATTR,'true');
  overlay.classList.remove('stocks-line-base','stocks-line-reveal-done','stocks-line-is-revealing','stocks-animated-line');
  overlay.classList.add('stocks-line-draw-overlay');
  overlay.style.strokeDasharray=`${length} ${length*3}`;
  overlay.style.strokeDashoffset=String(length);

  line.classList.add('stocks-line-is-revealing');
  if(line.nextSibling)line.parentNode.insertBefore(overlay,line.nextSibling);
  else line.parentNode.appendChild(overlay);

  let finished=false;
  const finish=()=>{
    if(finished)return;
    finished=true;
    line.classList.remove('stocks-line-is-revealing');
    line.classList.add('stocks-line-reveal-done');
    overlay.remove();
  };

  try{
    const animation=overlay.animate([
      {strokeDashoffset:String(length),opacity:.18},
      {strokeDashoffset:'0',opacity:1}
    ],{
      duration:820,
      delay:180,
      easing:'cubic-bezier(.28,.72,.18,1)',
      fill:'forwards'
    });
    animation.finished.then(finish).catch(finish);
  }catch{
    finish();
  }

  // WebKit can occasionally fail to dispatch an animation completion event on
  // backgrounded PWAs. This guarantees the real line is fully restored anyway.
  window.setTimeout(finish,1300);
}

function animateChart(page){
  if(page.dataset.statsDetailPage!=='performance')return;
  page.classList.add('stocks-motion-mounted');

  page.querySelectorAll('.statistics-detail-metric').forEach((metric,index)=>{
    metric.style.setProperty('--stocks-motion-delay',`${0.12+index*0.05}s`);
  });

  const svg=page.querySelector('[data-performance-chart] .native-sparkline');
  const line=svg?[...svg.children].find(node=>node.tagName?.toLowerCase()==='path'
    &&!node.hasAttribute('data-stocks-area-fill')
    &&!node.hasAttribute(DRAW_OVERLAY_ATTR)):null;

  if(line){
    restoreBaseLine(line);
    if(!line.dataset.stocksMotionLine){
      line.dataset.stocksMotionLine='true';
      createDrawOverlay(svg,line);
    }
  }

  const area=svg?.querySelector('[data-stocks-area-fill]');
  if(area&&!area.classList.contains('stocks-motion-area'))area.classList.add('stocks-motion-area');

  const endDots=svg?[...svg.children].filter(node=>node.tagName?.toLowerCase()==='circle'
    &&!node.classList.contains('stocks-chart-focus-halo')
    &&!node.classList.contains('stocks-chart-focus-dot')):[];
  const endDot=endDots.at(-1)||null;
  if(endDot&&!endDot.classList.contains('stocks-end-dot'))endDot.classList.add('stocks-end-dot');

  page.querySelectorAll('[data-performance-selector] button').forEach((button,index)=>{
    button.classList.add('stocks-motion-row');
    button.style.setProperty('--stocks-row-delay',`${0.58+Math.min(index,10)*0.04}s`);
  });
}

function animateAll(){
  ensureStyles();
  document.querySelectorAll('.statistics-detail-page').forEach(animateChart);
}

let queued=false;
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{
    queued=false;
    animateAll();
  });
}

new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
window.addEventListener('pageshow',schedule);
window.addEventListener('ironlog:navigate',schedule);
ensureStyles();
schedule();
