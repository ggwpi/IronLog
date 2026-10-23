import { BACKEND_GENERATION, CLOUD_GENERATION } from './cloud-generation.js'
const MARKER='ironlog_cloud_reset_generation'
const owned=key=>/^(gym_|ironlog|opengym)/i.test(key)||key.startsWith('sb-fksycphsxkrsbtqfysjk-')
const old=key=>owned(key)&&key!==MARKER&&!key.startsWith('ironlog_cloud_1_')
function deleteDatabase(idb,name) {
  return new Promise((resolve,reject)=>{
    const req=idb.deleteDatabase(name)
    req.onsuccess=()=>resolve()
    req.onerror=()=>reject(req.error||new Error('Could not reset local files'))
    req.onblocked=()=>reject(new Error('Close other IronLog tabs and reopen the app to finish the reset'))
  })
}
export async function resetLegacyData({generation=BACKEND_GENERATION,storage=globalThis.localStorage,session=globalThis.sessionStorage,idb=globalThis.indexedDB,native=false,loadNative=()=>import('@capacitor/filesystem')}={}) {
  if(generation!==CLOUD_GENERATION)return false
  if(storage.getItem(MARKER)===generation)return false
  const run=async()=>{
    if(storage.getItem(MARKER)===generation)return false
    if(idb){
      const dbs=typeof idb.databases==='function'?await idb.databases():[{name:'opengym-media'}]
      for(const db of dbs)if(db.name&&owned(db.name)&&!db.name.startsWith('ironlog-cloud-1'))await deleteDatabase(idb,db.name)
    }
    if(native){
      const {Filesystem,Directory}=await loadNative()
      for(const [directory,names] of [[Directory.Data,['opengym-state.json','opengym-state.next.json','opengym-remote.json','opengym-coach.json']], [Directory.Library,['opengym-media']]]) {
        for(const path of names){
          let exists=false
          try{await Filesystem.stat({path,directory});exists=true}catch(e){if(!/not exist|not found|ENOENT/i.test(e.message||''))throw e}
          if(exists){if(path==='opengym-media')await Filesystem.rmdir({path,directory,recursive:true});else await Filesystem.deleteFile({path,directory})}
        }
      }
    }
    const keys=Array.from({length:storage.length},(_,i)=>storage.key(i)).filter(Boolean)
    for(const key of keys)if(old(key))storage.removeItem(key)
    if(session){
      const sessionKeys=Array.from({length:session.length},(_,i)=>session.key(i)).filter(Boolean)
      for(const key of sessionKeys)if(old(key))session.removeItem(key)
    }
    // Marker is written last. An interrupted reset is retried before importing the store.
    storage.setItem(MARKER,generation)
    return true
  }
  return globalThis.navigator?.locks?globalThis.navigator.locks.request('ironlog-cloud-reset',run):run()
}
