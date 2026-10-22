(function(){
  const KEY='ironlog.v3';
  const empty=()=>({version:3, sessions:[], bodyWeight:[], drafts:{}, lastWorkoutId:null});
  function load(){
    try{
      const raw=localStorage.getItem(KEY);
      if(!raw) return empty();
      const data=JSON.parse(raw);
      return {...empty(), ...data, drafts:data.drafts||{}, sessions:Array.isArray(data.sessions)?data.sessions:[], bodyWeight:Array.isArray(data.bodyWeight)?data.bodyWeight:[]};
    }catch(e){ console.warn('IronLog storage recovery',e); return empty(); }
  }
  let state=load();
  function save(){localStorage.setItem(KEY,JSON.stringify(state));}
  function get(){return state;}
  function mutate(fn){fn(state);save();return state;}
  function draftKey(workoutId,exerciseId){return `${workoutId}:${exerciseId}`;}
  function getDraft(workoutId,exerciseId){return state.drafts[draftKey(workoutId,exerciseId)]||null;}
  function setDraft(workoutId,exerciseId,draft){return mutate(s=>{s.drafts[draftKey(workoutId,exerciseId)]=draft;});}
  function clearWorkoutDrafts(workoutId){return mutate(s=>{Object.keys(s.drafts).filter(k=>k.startsWith(workoutId+':')).forEach(k=>delete s.drafts[k]);});}
  function lastExerciseResult(exerciseId){
    for(let i=state.sessions.length-1;i>=0;i--){
      const ex=(state.sessions[i].exercises||[]).find(x=>x.exerciseId===exerciseId);
      if(ex && ex.sets && ex.sets.length) return ex;
    }
    return null;
  }
  function addSession(session){return mutate(s=>{s.sessions.push(session);s.lastWorkoutId=session.workoutId;});}
  function addWeight(value){return mutate(s=>{s.bodyWeight.push({value:Number(value),at:new Date().toISOString()});});}
  function exportData(){return JSON.stringify(state,null,2);}
  function importData(obj){
    if(!obj || typeof obj!=='object') throw new Error('Invalid backup');
    state={...empty(),...obj,drafts:obj.drafts||{},sessions:Array.isArray(obj.sessions)?obj.sessions:[],bodyWeight:Array.isArray(obj.bodyWeight)?obj.bodyWeight:[]};save();return state;
  }
  function reset(){state=empty();save();}
  window.IronStorage={get,save,mutate,getDraft,setDraft,clearWorkoutDrafts,lastExerciseResult,addSession,addWeight,exportData,importData,reset,KEY};
})();
