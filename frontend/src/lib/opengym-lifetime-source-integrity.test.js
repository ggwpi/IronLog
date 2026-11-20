import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
const sources = [
  [
    "lifetime.js",
    "2752eb0004b9a4451223bf72a8963559e6c1fbdf"
  ],
  [
    "lifetime.test.js",
    "52451c9f148a80b7dc4500b789d16241f746427f"
  ],
  [
    "cardio-goals.js",
    "10a54fc9fd525f366a5e93cd7ef6b40be4c1a16b"
  ],
  [
    "challenges.js",
    "dce066ebf754c5c011b377023e39b1cf56436a5a"
  ],
  [
    "distance.js",
    "4cd370b68c14d34c0f3c629cb212d0d163b1adf0"
  ],
  [
    "units.js",
    "bb75101327f778c156cacf40fe83c809ec3d1de5"
  ]
]
describe('original lifetime dependency sources', () => {
  it.each(sources)('%s retains its pinned Git blob', (name, hash) => {
    const bytes = readFileSync(new URL('./opengym-v145/' + name, import.meta.url))
    expect(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex')).toBe(hash)
  })
})
