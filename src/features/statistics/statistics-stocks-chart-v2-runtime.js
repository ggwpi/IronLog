const STYLE_ID='ironlog-statistics-stocks-chart-v2';
const SVG_NS='http://www.w3.org/2000/svg';

function ensureStyles(){
  if(document.getElementById(STYLE_ID))return;
  const link=document.createElement('link');
  link.id=STYLE_ID;
  link.rel='stylesheet';
  link.href='/src/features/statistics/statistics-stocks-chart-v2.css?v=4';
  document.head.appendChild(link);
}

function numeric(value){
  const match=String(value??'').replace(',','.').match(/\d+(?:\.\d+)?/);
  return match?Number(match[0]):null;
}

function signedDelta(value){
  const raw=String(value??'').trim();
  const magnitude=numeric(raw);
  if(!Number.isFinite(magnitude))return null;
  if(raw.includes('▼')||raw.includes('↓')||raw.includes('−')||/(^|\s)-\s*\d/.test(raw))return-Math.abs(magnitude);
  if(raw.includes('▲')||raw.includes('↑')||raw.includes('+'))return Math.abs(magnitude);
  return magnitude;
}

function parsePoints(path){
  const values=(path?.getAttribute('d')||'').match(/-?\d+(?:\.\d+)?/g)?.map(Number)||[];
  const points=[];
  for(let index=0;index+1<values.length;index+=2)points.push({x:values[index],y:values[index+1]});
  return points.filter(point=>Number.isFinite(point.x)&&Number.isFinite(point.y));
}

function svgElement(name,attrs={}){
  const element=document.createElementNS(SVG_NS,name);
  Object.entries(attrs).forEach(([key,value])=>element.setAttribute(key,String(value)));
  return element;
}

function trendForPage(page){
  const metrics=[...page.querySelectorAll('[data-performance-hero] .statistics-detail-metric strong')];
  const delta=signedDelta(metrics[1]?.textContent);
  if(Number.isFinite(delta)){
    if(delta>0.001)return'up';
    if(delta<-0.001)return'down';
    return'flat';
  }
  const current=numeric(metrics[0]?.textContent);
  const baseline=numeric(metrics[2]?.textContent);
  if(!Number.isFinite(current)||!Number.isFinite(baseline))return'flat';
  if(current>baseline+0.001)return'up';
  if(current<baseline-0.001)return'down';
  return'flat';
}

function ensureGradient(svg){
  let defs=svg.querySelector('defs[data-stocks-area-defs]');
  let gradient=defs?.querySelector('linearGradient[data-stocks-area-gradient]');
  if(defs&&gradient)return gradient.id;

  const gradientId=`stocksTrendFill-${Math.random().toString(36).slice(2,9)}`;
  defs=svgElement('defs',{'data-stocks-area-defs':'true'});
  gradient=svgElement('linearGradient',{
    id:gradientId,
    x1:'0',x2:'0',y1:'0',y2:'1',
    'data-stocks-area-gradient':'true'
  });
  gradient.appendChild(svgElement('stop',{offset:'0%','class':'stocks-chart-gradient-stop--top'}));
  gradient.appendChild(svgElement('stop',{offset:'58%','class':'stocks-chart-gradient-stop--mid'}));
  gradient.appendChild(svgElement('stop',{offset:'100%','class':'stocks-chart-gradient-stop--bottom'}));
  defs.appendChild(gradient);
  svg.insertBefore(defs,svg.firstChild);
  return gradientId;
}

function syncArea(svg,line,points){
  if(points.length<2)return null;
  const source=line.getAttribute('d')||'';
  if(!source)return null;

  const viewBox=svg.viewBox.baseVal;
  const bottom=(viewBox?.y||0)+(viewBox?.height||40);
  const first=points[0];
  const last=points.at(-1);
  const areaD=`${source} L ${last.x.toFixed(2)} ${bottom.toFixed(2)} L ${first.x.toFixed(2)} ${bottom.toFixed(2)} Z`;
  const gradientId=ensureGradient(svg);

  let area=svg.querySelector('[data-stocks-area-fill]');
  if(!area){
    area=svgElement('path',{
      d:areaD,
      fill:`url(#${gradientId})`,
      'class':'stocks-chart-area',
      'data-stocks-area-fill':'true'
    });
    svg.insertBefore(area,line);
  }else{
    if(area.getAttribute('d')!==areaD)area.setAttribute('d',areaD);
    const expectedFill=`url(#${gradientId})`;
    if(area.getAttribute('fill')!==expectedFill)area.setAttribute('fill',expectedFill);
  }

  // The fill is always visible. Motion must never control whether data is rendered.
  area.classList.remove('stocks-motion-area');
  area.style.removeProperty('animation');
  area.style.removeProperty('transform');
  area.style.opacity='1';
  area.style.visibility='visible';
  return area;
}

function decoratePage(page){
  if(page.dataset.statsDetailPage!=='performance')return;
  page.dataset.stocksTrend=trendForPage(page);
  const chart=page.querySelector('[data-performance-chart] .statistics-detail-chart');
  const svg=chart?.querySelector('.native-sparkline');
  if(!chart||!svg)return;

  const line=[...svg.children].find(node=>node.tagName?.toLowerCase()==='path'
    &&!node.hasAttribute('data-stocks-area-fill')
    &&!node.hasAttribute('data-stocks-draw-overlay'));
  if(!line)return;

  // Let the interaction layer bind to the original line first, then make the
  // decorative area independent and self-healing on subsequent renders.
  if(chart.dataset.stocksInteractive!=='true'){
    if(chart.dataset.stocksFillRetry!=='true'){
      chart.dataset.stocksFillRetry='true';
      window.setTimeout(()=>{
        delete chart.dataset.stocksFillRetry;
        schedule();
      },70);
    }
    return;
  }

  syncArea(svg,line,parsePoints(line));
}

function decorate(){
  ensureStyles();
  document.querySelectorAll('.statistics-detail-page').forEach(decoratePage);
}

let queued=false;
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{
    queued=false;
    decorate();
  });
}

new MutationObserver(schedule).observe(document.body,{
  childList:true,
  subtree:true,
  characterData:true,
  attributes:true,
  attributeFilter:['data-stocks-interactive','d']
});
window.addEventListener('pageshow',schedule);
window.addEventListener('ironlog:navigate',schedule);
ensureStyles();
schedule();
