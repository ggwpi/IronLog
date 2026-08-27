const STYLE_ID='ironlog-statistics-stocks-motion-style';

function ensureStyles(){
  if(document.getElementById(STYLE_ID))return;
  const link=document.createElement('link');
  link.id=STYLE_ID;
  link.rel='stylesheet';
  link.href='/src/features/statistics/statistics-stocks-motion.css?v=1';
  document.head.appendChild(link);
}

function animateChart(page){
  if(page.dataset.statsDetailPage!=='performance')return;
  page.classList.add('stocks-motion-mounted');

  page.querySelectorAll('.statistics-detail-metric').forEach((metric,index)=>{
    metric.style.setProperty('--stocks-motion-delay',`${0.15+index*0.055}s`);
  });

  const svg=page.querySelector('[data-performance-chart] .native-sparkline');
  const line=svg?[...svg.children].find(node=>node.tagName?.toLowerCase()==='path'):null;
  if(line&&!line.dataset.stocksMotionLine){
    line.dataset.stocksMotionLine='true';
    const length=typeof line.getTotalLength==='function'?line.getTotalLength():0;
    if(Number.isFinite(length)&&length>0)line.style.setProperty('--stocks-path-length',String(length));
    line.classList.add('stocks-animated-line');
  }

  const area=svg?.querySelector('[data-stocks-area-fill]');
  if(area&&!area.classList.contains('stocks-motion-area'))area.classList.add('stocks-motion-area');

  const endDot=svg?[...svg.children].find(node=>node.tagName?.toLowerCase()==='circle'&&!node.classList.contains('stocks-chart-focus-halo')&&!node.classList.contains('stocks-chart-focus-dot')):null;
  if(endDot&&!endDot.classList.contains('stocks-end-dot'))endDot.classList.add('stocks-end-dot');

  page.querySelectorAll('[data-performance-selector] button').forEach((button,index)=>{
    button.classList.add('stocks-motion-row');
    button.style.setProperty('--stocks-row-delay',`${0.66+Math.min(index,10)*0.045}s`);
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
