import { it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
const sources = [
  [
    "distance.js",
    "4cd370b68c14d34c0f3c629cb212d0d163b1adf0"
  ],
  [
    "distance.test.js",
    "bb96621a5e20c97238ea49c0719e4df1361e38c1"
  ]
]
it.each(sources)('%s retains original source',(name, expected) => {
const bytes=readFileSync(new URL('./opengym-v145/'+name,import.meta.url))
expect(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex')).toBe(expected)
})
