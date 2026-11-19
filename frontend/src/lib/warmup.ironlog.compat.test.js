import { expect,it } from 'vitest'
import { buildPlannedEntry } from './session-start.js'
import { buildCompletedWorkout } from './finish-workout.js'
import { rerampWarmups } from './history.js'
import { isWarmupRow } from './workout-model.js'
import { markWarmupSetupChange, warmupSource } from './warmup-ramp.js'
import { routineChangesFromEntry, updateRoutineFromEntry } from './routines.js'
import { buildPlanBundle,parsePlan } from './plan-share.js'
import { mergeStates,stampChange } from './sync-merge.js'
const cfg=(extra={})=>({id:'0025',sets:3,reps:8,weight:140,inc:2.5,...extra})
const state=(extra={})=>({unit:'kg',workouts:[],exWeights:{},routines:[],customEx:[],...extra})
const planned=(S,c)=>buildPlannedEntry(S,c,{id:'r',name:'Plan',ex:[c]})
const warm=entry=>entry.sets.filter(isWarmupRow)
const work=entry=>entry.sets.filter(s=>!isWarmupRow(s))
const pairs=rows=>rows.map(s=>[s.w,s.r])
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v)}return v}
it('generates the original heavy ramp over actual IronLog work sets without touching the source profile',()=>{
 const S=state({warmupAuto:'compounds',future:{keep:true},workouts:[{id:'keep',d:'2026-01-01',entries:[]}]});const before=structuredClone(S)
 const e=planned(freeze(S),cfg())
 expect(pairs(warm(e))).toEqual([[20,10],[55,5],[82.5,3],[110,1]])
 expect(work(e).map(s=>s.w)).toEqual([140,140,140]);expect(S).toEqual(before)
})
it.each(['off','compounds','all'])('preserves the exact older ramp count when the global choice is %s',choice=>{
 const c=cfg({warmupSets:2}),old=planned(state(),c),now=planned(state({warmupAuto:choice}),c)
 expect(now).toEqual(old);expect(warm(now)).toHaveLength(2)
})
it('keeps default-off sessions unchanged and explicit None beats an imported legacy count',()=>{
 expect(warm(planned(state(),cfg()))).toHaveLength(0)
 expect(warm(planned(state({warmupAuto:'all'}),cfg({warmup:'none',warmupSets:2})))).toHaveLength(0)
})
it('builds the selected own rows and keeps every work row, note and tempo',()=>{
 const c=cfg({warmup:'own',warmupSets:4,warmupRows:[{wb:true,r:10},{wp:50,r:5}],note:'א'.repeat(500),tempo:'3-1-1-0'})
 const S=state({warmupAuto:'all'}),e=planned(S,c)
 expect(pairs(warm(e))).toEqual([[20,10],[70,5]])
 expect(work(e).map(s=>s.w)).toEqual([140,140,140]);expect(e.target).toMatchObject({note:c.note,tempo:c.tempo})
 const active={id:'new',d:'2026-11-19',entries:[{id:c.id,rid:'r',...e}]};active.entries[0].sets.forEach(s=>{s.done=true})
 expect(buildCompletedWorkout(active).entries[0].sets).toEqual(active.entries[0].sets)
 expect(JSON.parse(JSON.stringify(active)).entries[0].sets).toEqual(active.entries[0].sets)
})
it('uses the original pound thresholds and the actual pound loading grid',()=>{
 const e=planned(state({unit:'lb',warmupAuto:'compounds'}),cfg({id:'0043',weight:135,inc:5}))
 expect(pairs(warm(e))).toEqual([[45,10],[50,5],[80,3],[105,1]])
 const standard=cfg({id:'0043',weight:135});delete standard.inc
 expect(pairs(warm(planned(state({unit:'lb',warmupAuto:'compounds'}),standard)))).toEqual([[45,10],[50,5],[80,3],[100,1]])
})
it('leaves explicit legacy ramps when Plates is off while disabling the optional global generator',()=>{
 expect(warm(planned(state({warmupAuto:'all',modules:{plates:false}}),cfg()))).toHaveLength(0)
 expect(warm(planned(state({warmupAuto:'all',modules:{plates:false}}),cfg({warmupSets:2})))).toHaveLength(2)
})
it('reramps original generated rows and preserves frozen completed/manual rows with exact metadata',()=>{
 const rows=freeze([{w:20,r:10,warmup:true,wb:true,done:true,note:'completed'},
  {w:37.5,r:5,warmup:true,wp:40,done:false,weightOrigin:'manual',edited:false,note:'keep',media:[{hash:'keep'}]},
  {w:60,r:3,warmup:true,wp:60,done:false},{w:120,r:8,done:false}])
 const before=structuredClone(rows),next=rerampWarmups(rows,2.5,20)
 expect(next[0]).toEqual(rows[0]);expect(next[1]).toEqual(rows[1]);expect(next[2].w).toBe(70);expect(rows).toEqual(before)
})
it('marks only setup edits on new warm-ups; tag/note changes and legacy rows retain their prior shape',()=>{
 const row={w:40,r:5,warmup:true,wp:40,done:false},entry={target:{warmup:'auto'},sets:[row]}
 expect(markWarmupSetupChange(entry,row,{...row,w:42.5}).edited).toBe(true)
 expect(markWarmupSetupChange(entry,row,{...row,tag:'blue'})).not.toHaveProperty('edited')
 const old={w:40,r:5,warmup:true,done:false}
 expect(markWarmupSetupChange({target:{},sets:[old]},old,{...old,w:45})).not.toHaveProperty('edited')
})
it('offers no automatic routine edit until a generated row is explicitly changed, then keeps the recipe only',()=>{
 const slot=cfg({note:'א'.repeat(500)}),routine={id:'r',name:'Plan',ex:[slot]},e={id:slot.id,rid:'r',...planned(state({warmupAuto:'all'}),slot)}
 expect(routineChangesFromEntry(routine,[e],0,20)).toBeNull()
 e.sets[1]=markWarmupSetupChange(e,e.sets[1],{...e.sets[1],w:60})
 const before=structuredClone(e);expect(routineChangesFromEntry(routine,[e],0,20).changes.some(c=>c.key==='warmupRows')).toBe(true)
 updateRoutineFromEntry(routine,[e],0,20)
 expect(routine.ex[0]).toMatchObject({warmup:'own',weight:140,sets:3,reps:8,note:'א'.repeat(500)});expect(e).toEqual(before)
})
it('retains own warm-ups through the actual plan interchange and concurrent unrelated profile edits',()=>{
 const base=state({_ts:1000,routines:[{id:'r',name:'Plan',ex:[cfg({warmup:'own',warmupRows:[{wb:true,r:10},{wp:50,r:5}]})]}]})
 const snapshot=structuredClone(base),roundTrip=parsePlan(buildPlanBundle(base,'Fixture'),'kg')
 expect(roundTrip.routines[0].ex[0]).toMatchObject({warmup:'own',warmupRows:[{wb:true,r:10},{wp:50,r:5}]});expect(base).toEqual(snapshot)
 const phone=structuredClone(base),other=structuredClone(base);phone.warmupAuto='all';phone._ts=stampChange(base,phone,2000);other.lang='he';other._ts=stampChange(base,other,3000)
 for(const [a,b]of[[phone,other],[other,phone]]){const merged=mergeStates(a,b);expect(merged.warmupAuto).toBe('all');expect(merged.lang).toBe('he');expect(merged.routines).toEqual(base.routines)}
})
it('registers actual custom exercise IDs for the original compound classifier without rewriting them',()=>{
 const custom={id:'custom-press',n:'My press',bp:'chest',eq:'barbell',tg:'pectorals',mg:'pectorals',sm:[],custom:true}
 const S=state({warmupAuto:'compounds',customEx:[custom]}),before=structuredClone(S)
 expect(warmupSource(S,cfg({id:custom.id})).kind).toBe('auto');expect(S).toEqual(before)
})
it('validates known own-row fields at the actual import boundary and retains unknown future modes',()=>{
 const bundle=buildPlanBundle(state({routines:[{id:'r',name:'Plan',ex:[cfg({warmup:'own',warmupRows:[{wp:50,r:5}]})]}]}),'Fixture')
 bundle.routines[0].ex[0].warmupRows=[{wp:999,r:100},{wb:true,r:8},null]
 expect(parsePlan(bundle).routines[0].ex[0].warmupRows).toEqual([{wp:95,r:30},{wb:true,r:8}])
 bundle.routines[0].ex[0].warmup='future';bundle.routines[0].ex[0].warmupRows=[{future:'keep'}]
 expect(parsePlan(bundle).routines[0].ex[0]).toMatchObject({warmup:'future',warmupRows:[{future:'keep'}]})
})
