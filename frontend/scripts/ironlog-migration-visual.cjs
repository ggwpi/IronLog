// Isolated local fixture browser checks; all non-loopback requests are blocked.
const fs=require('fs'),path=require('path');
const {chromium}=require(process.env.IRONLOG_PLAYWRIGHT_MODULE || 'playwright');
(async()=>{
 const out=process.env.IRONLOG_VISUAL_OUT || path.join(require('os').tmpdir(),'ironlog-pr69-visual');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.IRONLOG_CHROMIUM_PATH ? {executablePath:process.env.IRONLOG_CHROMIUM_PATH} : {})});
 const results=[];
 for(const lang of ['en','he'])for(const [label,port] of [['baseline',5180],['migration',5179]]){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,reducedMotion:'reduce',timezoneId:'Asia/Jerusalem',locale:lang,serviceWorkers:'block'});
  const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.hostname!=='127.0.0.1')return route.abort();
   if(url.pathname.startsWith('/api/'))return route.fulfill({status:url.pathname.includes('/me')?401:200,contentType:'application/json',body:JSON.stringify(url.pathname==='/api/config'?{invite_only:false,password_login:false,coach:{cloud:false}}:{})});
   if(url.pathname.startsWith('/exercise-media/'))return route.abort();
   return route.continue();
  });
  await page.addInitScript(()=>{localStorage.setItem('gym_guest','1');Date.now=()=>1795078800000;});
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'networkidle'});
  await page.evaluate(async lang=>{
   const {DEF,useStore}=await import('/src/store/useStore.js');
   const {setLang}=await import('/src/lib/i18n.js');
   const S={...structuredClone(DEF),name:'Fixture',lang,langAuto:false,gifSize:'off',sound:false,weighIn:false,showWeeklySetsHome:false,showWeightCard:true,modules:undefined,dailyForm:false,
    routines:[{id:'r-fixture',name:'Fixture plan',ex:[{id:'0025',sets:2,reps:8,weight:60,mode:'reps'}]}],week:{4:['r-fixture']},bodyweight:[{d:'2026-11-17',w:80}],workouts:[{id:'w-fixture',name:'Fixture workout',d:'2026-11-17',start:1794902400000,end:1794906000000,entries:[{id:'0025',target:{mode:'reps'},sets:[{w:60,r:8,done:true},{w:60,r:8,done:true}]}]}],active:null};
   useStore.setState({S,user:null,ready:true,needsMobileOnboarding:false,permSteps:false});
   await setLang(lang);
  },lang);
  for(const screen of ['home','stats','workout']){
   if(screen==='workout')await page.evaluate(async()=>{
    const {useStore}=await import('/src/store/useStore.js');const S=useStore.getState().S;
    useStore.setState({S:{...S,active:{id:'active-fixture',d:'2026-11-19',name:'Fixture workout',start:1795078200000,cur:0,bw:null,routineIds:['r-fixture'],entries:[{id:'0025',rid:'r-fixture',target:{mode:'reps',sets:2,reps:8,weight:60},sets:[{w:60,r:8,done:false},{w:60,r:8,done:false}]}]}}});
   });
   await page.evaluate(screen=>location.hash=screen==='home'?'#/':'#/'+screen,screen);
   await page.waitForTimeout(800);
   await page.screenshot({path:path.join(out,`${label}-${lang}-${screen}.png`),fullPage:true,animations:'disabled'});
   const details=await page.evaluate(()=>({dir:document.documentElement.dir,title:document.querySelector('h1')?.textContent,bodyText:document.body.innerText.slice(0,300)}));
   results.push({label,lang,screen,...details,errors:[...errors]});
  }

  if (errors.length) throw new Error(JSON.stringify(errors));
  if (label === 'migration') {
    const before = await page.evaluate(async () => {
      const {useStore}=await import('/src/store/useStore.js');
      return JSON.parse(JSON.stringify(useStore.getState().S));
    });
    const words = await page.evaluate(async () => {
      const {t}=await import('/src/lib/i18n.js');
      const {setTagName}=await import('/src/lib/set-tags.js');
      return {tag:t('Colour tag'),blue:setTagName('blue')};
    });
    await page.locator('button.n').first().click();
    await page.locator('.menu-item').filter({hasText:words.tag}).click();
    await page.screenshot({path:path.join(out,`migration-${lang}-tag-picker.png`),animations:'disabled'});
    await page.locator('.menu-item').filter({hasText:words.blue}).click();
    await page.waitForTimeout(400);
    const after = await page.evaluate(async () => {
      const {useStore}=await import('/src/store/useStore.js');
      return JSON.parse(JSON.stringify(useStore.getState().S));
    });
    const assert = require('node:assert/strict');
    assert.deepEqual(after.workouts,before.workouts);
    assert.deepEqual(after.active.entries[0].sets[0],{...before.active.entries[0].sets[0],tag:'blue'});
    assert.deepEqual(after.active.entries[0].sets[1],before.active.entries[0].sets[1]);
    assert.equal(await page.locator('[data-set-tag="blue"]').count(),1);
    await page.screenshot({path:path.join(out,`migration-${lang}-tagged-workout.png`),animations:'disabled'});
    const storedTag = await page.evaluate(() => JSON.parse(localStorage.getItem('gym_state_v1')).active.entries[0].sets[0].tag);
    assert.equal(storedTag,'blue');
    await page.evaluate(async () => {
      const {useStore}=await import('/src/store/useStore.js');
      const {buildCompletedWorkout}=await import('/src/lib/finish-workout.js');
      const {workoutVolume}=await import('/src/lib/history.js');
      const S=useStore.getState().S;
      S.active.entries[0].sets[0].done=true;
      const saved=buildCompletedWorkout(S.active,{end:Date.now()});
      saved.vol=workoutVolume(saved);
      useStore.setState({S:{...S,workouts:[...S.workouts,saved],active:null}});
      location.hash='#/history';
    });
    await page.waitForTimeout(200);
    await page.evaluate(async () => {
      const {useStore}=await import('/src/store/useStore.js');
      const {workoutDetailSheet}=await import('/src/sheets.jsx');
      workoutDetailSheet(useStore.getState().S.workouts.at(-1));
    });
    await page.waitForTimeout(400);
    assert.ok((await page.locator('.wd-ex .ss').first().textContent()).includes(words.blue));
    await page.screenshot({path:path.join(out,`migration-${lang}-tagged-history.png`),animations:'disabled'});
    results.push({label,lang,story:'native IronLog tag picker -> active set -> persisted guest JSON -> completed-workout history',passed:true});
  }
  if (errors.length) throw new Error(JSON.stringify(errors));
  await context.close();
 }
 await browser.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({out,results},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
