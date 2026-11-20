import { it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
it('keeps the full original circuit/speech models, clock, card and tests unchanged', () => {
  const files = {
    '../components/CircuitCard.jsx': 'c06f030c3336170c903ca87e1aa8b9300ac10440',
    './circuit.js': 'c97aef2480c26f1fab6b1db28928e2163e10517f',
    './circuit-copy.js': '238c6a81435a7139ec8b990e0fbb6e3ca30bb486',
    './circuit.test.js': 'b96bc38af35cf675780a85e26256103ec4549828',
    './speech.js': '7297c9af0422f6dbaa0b5a21e56858c8544c2bf5',
    './speech.test.js': '0822379d9aad098e9eb44a88c692674ee7bf3404',
    '../store/useCircuit.js': '30f94799df2e1ad7fcb572e4322e2b326fbb7df7',
    '../store/useCircuit.test.js': '9a01945fcd19aa41684bb0c3e2f35d1b00b338ef',
  }
  for (const [path, hash] of Object.entries(files)) {
    const bytes = readFileSync(new URL(path, import.meta.url))
    expect(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')).toBe(hash)
  }
})
