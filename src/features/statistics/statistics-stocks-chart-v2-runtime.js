const STYLE_ID='ironlog-statistics-stocks-chart-v2';
const SVG_NS='http://www.w3.org/2000/svg';

function ensureStyles(){
  if(document.getElementById(STYLE_ID))return;
  const link=document.createElement('link');
  link.id=STYLE_ID;
  link.rel='stylesheet';
  link.href='/src/features/statistics/statistics-stocks-chart-v2.css?v=2';
  document.head.appendChild(link);
}

function numeric(value){
  const match=String(value??'').replace(',','.').match(/-?\d+(?:\.\d+)?/);
  return match?Number(match[0]):null;
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
  const current=numeric(metrics[0]?.textContent);
  const baseline=numeric(metrics[2]?.textContent);
  if(!Number.isFinite(current)||!Number.isFinite(baseline))return'flat';
  if(current>baseline+0.001)return'up';
  if(current<baseline-0.001)return'down';
  return'flat';
}

function buildArea(svg,line,points){
  if(points.length<2||svg.querySelector('[data-stocks-area-fill]'))return;
  const viewBox=svg.viewBox.baseVal;
  const bottom=(viewBox?.y||0)+(viewBox?.height||40);
  const gradientId=`stocksTrendFill-${Math.random().toString(36).slice(2,9)}`;
  const defs=svgElement('defs');
  const gradient=svgElement('linearGradient',{id:gradientId,x1:'0',x2:'0',y1:'0',y2:'1'});
  gradient.appendChild(svgElement('stop',{offset:'0%','class':'stocks-chart-gradient-stop--top'}));
  gradient.appendChild(svgElement('stop',{offset:'58%','class':'stocks-chart-gradient-stop--mid'}));
  gradient.appendChild(svgElement('stop',{offset:'100%','class':'stocks-chart-gradient-stop--bottom'}));
  defs.appendChild(gradient);

  const polygonPoints=[
    `${points[0].x.toFixed(2)},${bottom.toFixed(2)}`,
    ...points.map(point=>`${point.x.toFixed(2)},${point.y.toFixed(2)}`),
    `${points.at(-1).x.toFixed(2)},${bottom.toFixed(2)}`,
  ].join(' ');
  const area=svgElement('polygon',{
    points:polygonPoints,
    fill:`url(#${gradientId})`,
    'class':'stocks-chart-area',
    'data-stocks-area-fill':'true',
  });
  svg.insertBefore(defs,svg.firstChild);
  svg.insertBefore(area,line);
}

function decoratePage(page){
  if(page.dataset.statsDetailPage!=='performance')return;
  page.dataset.stocksTrend=trendForPage(page);
  const chart=page.querySelector('[data-performance-chart] .statistics-detail-chart');
  const svg=chart?.querySelector('.native-sparkline');
  if(!chart||!svg)return;
  const line=[...svg.children].find(node=>node.tagName?.toLowerCase()==='path');
  if(!line)return;
  const points=parsePoints(line);
  buildArea(svg,line,points);
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

new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});
window.addEventListener('pageshow',schedule);
window.addEventListener('ironlog:navigate',schedule);
ensureStyles();
schedule();
