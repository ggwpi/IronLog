import { it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
const sources = [
  [
    "recovery-hint.js",
    "7794a8889a3b01738459c361dc842a23a9a9a37e"
  ],
  [
    "recovery-hint.test.js",
    "f93a7f527cd969509ee6dcf3009dea0a0f7b4bdd"
  ],
  [
    "recovery.js",
    "599fe2ce5215da4758b32e64009f3b85b29c0599"
  ]
]
it.each(sources)('%s retains pinned original source', (name, expected) => {
const bytes = readFileSync(new URL('./opengym-v145/' + name, import.meta.url))
expect(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex')).toBe(expected)
})
