import { it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
const sources = [
  [
    "components/CardioWeek.jsx",
    "0b592044e065c604460c46a9bc334384588f69a8"
  ],
  [
    "components/CardioWeek.test.jsx",
    "7bcbc57fa3eb424ba181f325f082bf849a8cbe45"
  ],
  [
    "lib/opengym-v145/cardio-goals.test.js",
    "76f08e8f8f2aabe6ece5e7667fef24f7f6e129f3"
  ]
]
it.each(sources)('%s retains original source', (name, expected) => {
const bytes = readFileSync(new URL('../' + name, import.meta.url))
expect(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex')).toBe(expected)
})
