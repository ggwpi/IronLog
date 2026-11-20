import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const sources = JSON.parse(readFileSync(new URL('./opengym-v145/tempo-guide-source-blobs.json', import.meta.url)))
describe('original tempo guide and audio source', () => {
  it.each(Object.entries(sources))('%s retains the pinned Git blob', (path, expected) => {
    const bytes = readFileSync(new URL('../../' + path.replace(/^frontend\//, ''), import.meta.url))
    expect(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex')).toBe(expected)
  })
})
