// Storage requests deliberately carry no session cookie or paired-device headers.
// Only short-lived URLs returned by the authenticated API authorize these transfers.
export function signedUrl(raw) {
  const u = new URL(raw)
  if(u.protocol !== 'https:' || u.username || u.password || !u.hostname.endsWith('.supabase.co') || !u.pathname.startsWith('/storage/v1/')) throw new Error('Invalid storage transfer URL')
  return u.href
}
export async function readSnapshot(descriptor, { fetchImpl = globalThis.fetch } = {}) {
  const max = 5 * 1024 * 1024 + 65536
  if(!descriptor || !Number.isSafeInteger(descriptor.size) || descriptor.size < 1 || descriptor.size > max) throw new Error('Invalid snapshot descriptor')
  const r = await fetchImpl(signedUrl(descriptor.url), { credentials:'omit', cache:'no-store', signal:AbortSignal.timeout(60000) })
  if(!r.ok) throw new Error('Snapshot download failed')
  const reader=r.body.getReader(),parts=[];let n=0
  try { for(;;){const {value,done}=await reader.read();if(done)break;n+=value.length;if(n>descriptor.size){await reader.cancel();throw new Error('Snapshot size mismatch')}parts.push(value)} }
  finally {reader.releaseLock()}
  if(n!==descriptor.size)throw new Error('Snapshot size mismatch')
  const value=JSON.parse(await new Blob(parts).text())
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid snapshot')
  return value
}
export function putSigned(url, blob, mime, { XHR=globalThis.XMLHttpRequest, onProgress, idleMs=60000 } = {}) {
  return new Promise((resolve,reject)=>{
    const xhr=new XHR();let timer,timeout=false
    const arm=()=>{clearTimeout(timer);timer=setTimeout(()=>{timeout=true;xhr.abort()},idleMs)}
    xhr.open('PUT',signedUrl(url));xhr.withCredentials=false;xhr.setRequestHeader('Content-Type',mime)
    if(xhr.upload)xhr.upload.onprogress=e=>{arm();if(e.lengthComputable)onProgress?.(e.loaded,e.total)}
    xhr.onload=()=>{clearTimeout(timer);if(xhr.status>=200&&xhr.status<300)resolve();else reject(Object.assign(new Error('Storage upload failed'),{status:xhr.status,code:'storage-upload'}))}
    xhr.onerror=()=>{clearTimeout(timer);reject(Object.assign(new Error('network'),{code:'network'}))}
    xhr.onabort=()=>{clearTimeout(timer);reject(Object.assign(new Error(timeout?'timeout':'aborted'),{code:timeout?'timeout':'network'}))}
    arm();xhr.send(blob)
  })
}
