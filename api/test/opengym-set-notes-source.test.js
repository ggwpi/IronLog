import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
test('the API imports the complete pinned set-note model unchanged', () => {
  const bytes = readFileSync(new URL('../coach/core/opengym-set-notes.js', import.meta.url))
  assert.equal(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex'), 'b92d958b321d95f081cc270e3f3e3afe826c6bd9')
})
