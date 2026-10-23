// @vitest-environment happy-dom
import { describe,it,expect,vi,afterEach } from 'vitest'
const URL='https://example.supabase.co/storage/v1/object/upload/sign/private/file?token=short-lived'
const json=(body,status=200)=>({ok:status>=200&&status<300,status,json:async()=>body,headers:{get:()=>null}})
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();vi.resetModules();history.replaceState(null,'','/')})
async function load(){vi.resetModules();vi.stubEnv('VITE_BACKEND_GENERATION','ironlog-cloud-1');return import('./api.js')}
describe('activated cloud API transport',()=>{
  it('sends generation on requests, initial pairing and native background auth',async()=>{
    const m=await load(),fetch=vi.fn(async()=>json({user:{id:'u'},token:'token'}));vi.stubGlobal('fetch',fetch)
    await m.api('/api/me');expect(fetch.mock.calls[0][1].headers['X-IronLog-Generation']).toBe('ironlog-cloud-1')
    await m.pairRedeem('https://ironlog.example','ABCDEFGH')
    expect(fetch.mock.calls[1][1].headers['X-IronLog-Generation']).toBe('ironlog-cloud-1')
    m.setRemoteAuth('https://ironlog.example','paired')
    expect(m.remoteAuth().headers).toEqual({Authorization:'Bearer paired','X-IronLog-Generation':'ironlog-cloud-1'})
  })
  it('uses upload authorization and completion, without forwarding account headers to Storage',async()=>{
    const m=await load(),calls=[],fetch=vi.fn(async(path,init)=>{
      calls.push({path,init})
      if(path.endsWith('/api/config'))return json({transport:{snapshots:'signed-v1'}})
      if(path.endsWith('/api/media/upload'))return json({id:'transfer',url:URL})
      if(path.endsWith('/api/media/complete'))return json({ok:true})
      throw new Error('unexpected API call')
    });vi.stubGlobal('fetch',fetch)
    await m.api('/api/config')
    let xhr
    class XHR {constructor(){xhr=this;this.upload={};this.headers={}}open(method,url){this.method=method;this.url=url}setRequestHeader(k,v){this.headers[k]=v}send(){this.status=200;this.onload()}}
    expect(await m.apiUpload('/api/media/hash',new Blob(['bytes']),'image/jpeg',{XHR})).toEqual({ok:true})
    expect(calls.map(c=>c.path)).toEqual(['/api/config','/api/media/upload','/api/media/complete'])
    expect(xhr.headers).toEqual({'Content-Type':'image/jpeg'});expect(xhr.withCredentials).toBe(false)
  })
  it('preserves permanent media error codes and retry timing for the synchronizer',async()=>{
    const m=await load();vi.stubGlobal('fetch',vi.fn(async()=>json({error:'mismatch',code:'hash-mismatch'},400)))
    await expect(m.api('/api/media/complete',{method:'POST',body:'{}'})).rejects.toMatchObject({status:400,code:'hash-mismatch',data:{code:'hash-mismatch'}})
    vi.stubGlobal('fetch',vi.fn(async()=>json({error:'busy',code:'media-busy',retryAfter:120},429)))
    await expect(m.api('/api/media/upload',{method:'POST',body:'{}'})).rejects.toMatchObject({status:429,retryAfter:120})
  })
  it('resolves private conflict snapshots back into the upstream store error shape',async()=>{
    const m=await load(),payload=JSON.stringify({state:{routines:[],_rev:2}}),bytes=new TextEncoder().encode(payload)
    vi.stubGlobal('fetch',vi.fn(async(path,init)=>{
      if(path==='/api/data')return json({error:'conflict',rev:2,snapshot:{url:URL,size:bytes.length}},409)
      expect(init.credentials).toBe('omit');expect(init.headers).toBeUndefined()
      return new Response(bytes)
    }))
    await expect(m.api('/api/data',{method:'PUT',body:'{}'})).rejects.toMatchObject({status:409,data:{rev:2,state:{routines:[],_rev:2}}})
  })
  it('stages a large profile before config is cached, and resumes its uploaded snapshot',async()=>{
    const m=await load(),calls=[]
    vi.stubGlobal('fetch',vi.fn(async(path,init)=>{
      calls.push(path)
      if(path==='/api/data/upload'){
        const request=JSON.parse(init.body)
        expect(request.hash).toMatch(/^[0-9a-f]{64}$/);expect(request.size).toBeGreaterThan(3*1024*1024)
        return json({id:'snapshot',uploaded:true})
      }
      if(path==='/api/data/commit')return json({ok:true,rev:1})
      throw new Error('large request reached the ordinary endpoint')
    }))
    const payload=JSON.stringify({state:{routines:[],workouts:[],extra:'x'.repeat(3200000)},baseRev:0})
    expect(await m.api('/api/data',{method:'PUT',body:payload})).toEqual({ok:true,rev:1})
    expect(calls).toEqual(['/api/data/upload','/api/data/commit'])
  })

})
