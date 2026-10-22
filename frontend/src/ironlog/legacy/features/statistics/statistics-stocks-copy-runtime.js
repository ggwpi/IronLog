const PAGE='.statistics-detail-page[data-stats-detail-page="performance"]';

function numberTokens(text){
  return [...String(text??'').matchAll(/[−-]?\d+(?:\.\d+)?/g)].map(match=>Number(match[0].replace('−','-'))).filter(Number.isFinite);
}

function trendWord(value,page){
  if(value<-.001||page.dataset.stocksTrend==='down')return'ירידה';
  if(value>.001||page.dataset.stocksTrend==='up')return'עלייה';
  return'ללא שינוי';
}

function formatChange(page,node){
  if(!node)return;
  const raw=node.textContent?.trim()||'';
  if(!raw)return;

  if(raw.includes('מהתחלה')||raw.includes('מההתחלה')){
    const values=numberTokens(raw);
    if(values.length>=2){
      const direction=trendWord(values[0],page);
      if(direction==='ללא שינוי'){
        if(raw!=='ללא שינוי מההתחלה')node.textContent='ללא שינוי מההתחלה';
        return;
      }
      const next=`${direction} של ${Math.abs(values[0]).toFixed(1)} ק״ג · ${Math.abs(values[1]).toFixed(1)}% מההתחלה`;
      if(next!==raw)node.textContent=next;
      return;
    }
  }

  if(raw.includes('בין שתי המדידות')){
    const values=numberTokens(raw);
    if(values.length){
      const direction=trendWord(values[0],page);
      const next=direction==='ללא שינוי'?'ללא שינוי בין שתי המדידות':`${direction} של ${Math.abs(values[0]).toFixed(1)}% בין שתי המדידות`;
      if(next!==raw)node.textContent=next;
    }
  }
}

function polish(page){
  const change=page.querySelector('[data-stocks-quote-change]');
  formatChange(page,change);
  const title=page.querySelector('[data-performance-hero] h1');
  if(title)title.setAttribute('dir','ltr');
}

let queued=false;
function run(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{
    queued=false;
    document.querySelectorAll(PAGE).forEach(polish);
  });
}

new MutationObserver(run).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-stocks-trend']});
window.addEventListener('pageshow',run);
window.addEventListener('ironlog:navigate',run);
run();
