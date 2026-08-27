const STYLE_ID='ironlog-statistics-stocks-motion-style';

function ensureStyles(){
  if(document.getElementById(STYLE_ID))return;
  const link=document.createElement('link');
  link.id=STYLE_ID;
  link.rel='stylesheet';
  link.href='/src/features/statistics/statistics-stocks-motion.css?v=4';
  document.head.appendChild(link);
}

function stabilizeChartSvg(svg){
  if(!svg)return;

  // Clean up every artifact left by older reveal implementations. The real
  // series path must always remain a normal, fully visible SVG path.
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
    area.style.removeProperty('opacity');
    area.style.removeProperty('transform');
    area.style.removeProperty('animation');
  }
}

function animateChart(page){
  if(page.dataset.statsDetailPage!=='performance')return;
  page.classList.add('stocks-motion-mounted');

  page.querySelectorAll('.statistics-detail-metric').forEach((metric,index)=>{
    metric.style.setProperty('--stocks-motion-delay',`${0.08+index*0.045}s`);
  });

  const svg=page.querySelector('[data-performance-chart] .native-sparkline');
  stabilizeChartSvg(svg);

  const endDots=svg?[...svg.children].filter(node=>node.tagName?.toLowerCase()==='circle'
    &&!node.classList.contains('stocks-chart-focus-halo')
    &&!node.classList.contains('stocks-chart-focus-dot')):[];
  const endDot=endDots.at(-1)||null;
  if(endDot&&!endDot.classList.contains('stocks-end-dot'))endDot.classList.add('stocks-end-dot');

  page.querySelectorAll('[data-performance-selector] button').forEach((button,index)=>{
    button.classList.add('stocks-motion-row');
    button.style.setProperty('--stocks-row-delay',`${0.46+Math.min(index,10)*0.035}s`);
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
