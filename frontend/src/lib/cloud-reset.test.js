import { describe,it,expect } from 'vitest'
import { resetLegacyData } from './cloud-reset.js'
const store=initial=>{
  const data=new Map(Object.entries(initial))
  return {get length(){return data.size},key:i=>[...data.keys()][i],getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),data}
}
describe('authorized cloud generation reset',()=>{
  it('does nothing until activation, then removes legacy profiles, stashes and backups but keeps unrelated/new storage',async()=>{
    const storage=store({gym_state_v1:'old plan',gym_stash:'old workouts','sb-fksycphsxkrsbtqfysjk-auth-token':'old session',ironlog_before_catalogue_v1:'backup',unrelated:'keep',ironlog_cloud_1_gym_state_v1:'new'})
    await resetLegacyData({generation:'',storage,idb:null})
    expect(storage.getItem('gym_state_v1')).toBe('old plan')
    expect(await resetLegacyData({generation:'ironlog-cloud-1',storage,idb:null})).toBe(true)
    expect(storage.getItem('gym_state_v1')).toBeNull();expect(storage.getItem('gym_stash')).toBeNull();expect(storage.getItem('sb-fksycphsxkrsbtqfysjk-auth-token')).toBeNull()
    expect(storage.getItem('ironlog_before_catalogue_v1')).toBeNull();expect(storage.getItem('unrelated')).toBe('keep')
    expect(storage.getItem('ironlog_cloud_1_gym_state_v1')).toBe('new')
    expect(await resetLegacyData({generation:'ironlog-cloud-1',storage,idb:null})).toBe(false)
  })
  it('does not mark a blocked media reset as completed; a fresh launch retries',async()=>{
    const storage=store({gym_state_v1:'old'})
    const idb={databases:async()=>[{name:'opengym-media'},{name:'unrelated'}],deleteDatabase:()=>{
      const req={};queueMicrotask(()=>req.onblocked());return req
    }}
    await expect(resetLegacyData({generation:'ironlog-cloud-1',storage,idb})).rejects.toThrow('Close other IronLog tabs')
    expect(storage.getItem('ironlog_cloud_reset_generation')).toBeNull()
    expect(storage.getItem('gym_state_v1')).toBe('old')
  })
  it('drops only app-owned IndexedDB databases and waits for completion',async()=>{
    const storage=store({gym_state_v1:'old'}),deleted=[]
    const idb={databases:async()=>[{name:'opengym-media'},{name:'ironlog-legacy'},{name:'ironlog-cloud-1-media'},{name:'other-app'}],deleteDatabase:name=>{
      deleted.push(name);const req={};queueMicrotask(()=>req.onsuccess());return req
    }}
    await resetLegacyData({generation:'ironlog-cloud-1',storage,idb})
    expect(deleted).toEqual(['opengym-media','ironlog-legacy'])
  })
})
