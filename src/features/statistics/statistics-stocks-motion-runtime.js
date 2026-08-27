const STYLE_ID='ironlog-statistics-stocks-motion-style';
const INITIAL_MS=820;

function ensureStyles(){
  if(document.getElementById(STYLE_ID))return;
  const link=document.createElement('link');
  link.id=STYLE_ID;
  link.rel='stylesheet';
  link.href='/src/features/statistics/statistics-stocks-motion.css?v=5';
  document.head.appendChild(link);
}

function stabilizeChartSvg(svg){
  if(!svg)return;

  // Never let decorative motion mutate the real data geometry.
  svg.querySelectorAll('[data-stocks-draw-overlay]').forEach(node=>node.remove());

  const line=[...svg.children].find(node=>node.tagName?.toLowerCase()==='path'
    &&!node.hasAttribute('data-stocks-area-fill'));
  if(line){
    line.classList.remove(
      'stocks-animated-line',
      'stocks-line-base',
      'stocks-line-is-revealing',
      'stocks-line-reveal-done'
    );
    line.style.removeProperty('stroke-dasharray');
    line.style.removeProperty('stroke-dashoffset');
    line.style.removeProperty('--stocks-path-length');
    line.style.removeProperty('opacity');
    line.removeAttribute('stroke-dasharray');
    line.removeAttribute('stroke-dashoffset');
    delete line.dataset.stocksMotionLine;
  }

  const area=svg.querySelector('[data-stocks-area-fill]');
  if(area){
    area.classList.remove('stocks-motion-area');
    area.style.removeProperty('animation');
    area.style.removeProperty('transform');
    area.style.setProperty('opacity','1','important');
    area.style.setProperty('visibility','visible','important');
  }
}

function mountInitialMotion(page){
  if(page.dataset.stocksMotionReady==='true')return;
  page.dataset.stocksMotionReady='true';
  page.classList.add('stocks-motion-mounted','stocks-motion-initial');

  page.querySelectorAll('.statistics-detail-metric').forEach((metric,index)=>{
    metric.style.setProperty('--stocks-motion-delay',`${0.09+index*0.045}s`);
  });

  page.querySelectorAll('[data-performance-selector] button').forEach((button,index)=>{
    button.classList.add('stocks-motion-row');
    button.style.setProperty('--stocks-row-delay',`${0.34+Math.min(index,10)*0.028}s`);
  });

  window.setTimeout(()=>{
    if(!page.isConnected)return;
    page.classList.remove('stocks-motion-initial');
  },INITIAL_MS);
}

function decoratePersistentMotion(page){
  const svg=page.querySelector('[data-performance-chart] .native-sparkline');
  stabilizeChartSvg(svg);

  const endDots=svg?[...svg.children].filter(node=>node.tagName?.toLowerCase()==='circle'
    &&!node.classList.contains('stocks-chart-focus-halo')
    &&!node.classList.contains('stocks-chart-focus-dot')):[];
  const endDot=endDots.at(-1)||null;
  if(endDot&&!endDot.classList.contains('stocks-end-dot'))endDot.classList.add('stocks-end-dot');

  // New selector rows can appear after switching exercises. They get state styling,
  // but never replay the full page entrance sequence.
  page.querySelectorAll('[data-performance-selector] button').forEach((button,index)=>{
    button.classList.add('stocks-motion-row');
    button.style.setProperty('--stocks-row-delay',`${0.34+Math.min(index,10)*0.028}s`);
  });
}

function animateChart(page){
  if(page.dataset.statsDetailPage!=='performance')return;
  mountInitialMotion(page);
  decoratePersistentMotion(page);
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
