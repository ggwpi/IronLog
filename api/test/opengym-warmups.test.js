// Synthetic compatibility fixtures only; no account/database/network access.
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {stampPut} from '../sync-stamps.js'
const fixture=()=>({_ts:1000,unit:'kg',warmupAuto:'all',routines:[{id:'r',ex:[{id:'0025',sets:3,reps:8,weight:140,warmup:'own',warmupRows:[{wb:true,r:10},{wp:50,r:5}],future:'keep'}]}],workouts:[{id:'keep',d:'2026-11-17',entries:[{id:'0025',sets:[{w:70,r:5,done:true,warmup:true,wp:50,edited:true,note:'א'.repeat(500),media:[{hash:'keep'}]}]}]}]})
test('an old writer preserves unknown warm-up preferences, recipes and saved row metadata while keeping its real edit',()=>{
 const current=fixture(),before=structuredClone(current),next=structuredClone(current)
 delete next.warmupAuto;delete next.routines[0].ex[0].warmup;delete next.routines[0].ex[0].warmupRows
 delete next.workouts[0].entries[0].sets[0].wp;delete next.workouts[0].entries[0].sets[0].edited
 next.workouts[0].entries[0].sets[0].w=72.5
 stampPut(current,next,{overRead:true,stamped:false,now:2000})
 assert.equal(next.warmupAuto,'all');assert.deepEqual(next.routines[0].ex,current.routines[0].ex)
 assert.equal(next.routines[0].id,current.routines[0].id)
 assert.deepEqual(next.workouts[0].entries[0].sets[0],{...current.workouts[0].entries[0].sets[0],w:72.5})
 assert.deepEqual(current,before)
})
test('a modern explicit off/None and recipe clear remain intentional without altering saved workouts',()=>{
 const current=fixture(),next=structuredClone(current)
 next.warmupAuto='off';next.routines[0].ex[0].warmup='none';delete next.routines[0].ex[0].warmupRows
 stampPut(current,next,{overRead:true,stamped:true,now:2000})
 assert.equal(next.warmupAuto,'off');assert.equal(next.routines[0].ex[0].warmup,'none');assert.equal(next.routines[0].ex[0].warmupRows,undefined)
 assert.deepEqual(next.workouts,current.workouts);assert.equal(next.routines[0].ex[0].future,'keep')
})
