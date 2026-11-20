// Pure API fixtures; no account, database, authentication or network calls.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stampPut } from '../sync-stamps.js'
const fixture=()=>({_ts:1000,dayForm:{'2026-11-19':{sleep:1,energy:1,lighter:'load',_ts:1000}},workouts:[{id:'keep',d:'2026-11-17',entries:[{id:'0025',noProg:true,sets:[{w:70,r:8,done:true,note:'א'.repeat(500),media:[{hash:'keep'}]}]}]}],routines:[{id:'r',ex:[{id:'0025',sets:3,weight:80}]}]})
test('an unstamped client missing Daily Form preserves every answer and completed lighter result',()=>{
 const current=fixture(),before=structuredClone(current),next=structuredClone(current)
 delete next.dayForm;next.lang='he'
 stampPut(current,next,{overRead:true,stamped:false,now:2000})
 assert.deepEqual(next.dayForm,current.dayForm)
 assert.deepEqual(next.workouts,current.workouts);assert.deepEqual(next.routines,current.routines)
 assert.equal(next.lang,'he');assert.deepEqual(current,before)
})
test('a modern explicit daily-answer clear does not restore the lighter selection or modify history',()=>{
 const current=fixture(),next=structuredClone(current)
 next.dayForm['2026-11-19']={_ts:2000}
 stampPut(current,next,{overRead:true,stamped:true,now:2001})
 assert.equal(next.dayForm['2026-11-19'].lighter,undefined)
 assert.equal(next.dayForm['2026-11-19'].energy,undefined)
 assert.deepEqual(next.workouts,current.workouts);assert.deepEqual(next.routines,current.routines)
})
