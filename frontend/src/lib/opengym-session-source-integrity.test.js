import { it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
const blobs=JSON.parse(readFileSync(new URL('./opengym-v145/session-engine/source-blobs.json',import.meta.url)))
it.each(Object.entries(blobs))('retains original session source %s',(path,sha)=>{
 const bytes=readFileSync(new URL('./opengym-v145/session-engine/'+path,import.meta.url))
 expect(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex')).toBe(sha)
})
