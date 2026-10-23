import { describe,it,expect,vi } from 'vitest'
import { signedUrl,readSnapshot,putSigned } from './cloud-transfer.js'
const url='https://example.supabase.co/storage/v1/object/sign/private/file?token=short-lived'
describe('private cloud transfers',()=>{
  it('rejects plain HTTP, foreign origins and misleading suffixes',()=>{
    expect(signedUrl(url)).toBe(url)
    for(const u of ['http://example.supabase.co/storage/v1/x','https://supabase.co.evil.example/storage/v1/x','https://evil.example/storage/v1/x','https://user:password@example.supabase.co/storage/v1/x'])expect(()=>signedUrl(u)).toThrow()
  })
  it('reads bounded snapshots without cookies or API authorization headers',async()=>{
    const bytes=new TextEncoder().encode(JSON.stringify({state:{routines:[]},rev:1}))
    const fetchImpl=vi.fn(async()=>new Response(bytes))
    expect(await readSnapshot({url,size:bytes.length},{fetchImpl})).toEqual({state:{routines:[]},rev:1})
    expect(fetchImpl.mock.calls[0][1].credentials).toBe('omit')
    expect(fetchImpl.mock.calls[0][1].headers).toBeUndefined()
    await expect(readSnapshot({url,size:bytes.length-1},{fetchImpl})).rejects.toThrow('size mismatch')
  })
  it('uploads with no cookies and no account bearer token',async()=>{
    let request
    class XHR {constructor(){request=this;this.upload={};this.headers={}}open(m,u){this.method=m;this.url=u}setRequestHeader(k,v){this.headers[k]=v}send(){this.status=200;this.onload()}}
    await putSigned(url,new Blob(['data']),'image/jpeg',{XHR})
    expect(request.withCredentials).toBe(false);expect(request.headers).toEqual({'Content-Type':'image/jpeg'})
  })
})
