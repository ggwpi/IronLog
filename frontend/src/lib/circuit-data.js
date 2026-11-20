// Preserve IronLog extension metadata around unchanged upstream configuration writes.
import { setCircuit as originalSet, applyProgramAdvances as originalAdvance } from './circuit.js'
const fields = new Set(['mode', 'rounds', 'gap', 'cap', 'every', 'count', 'program', 'level', 'n', 'work', 'rest'])
const map = value => value && typeof value === 'object' && !Array.isArray(value)
function withMetadata(entries, action) {
  const extras = new Map(entries.filter(e => map(e?.sgCircuit)).map(e => [e,
    Object.fromEntries(Object.entries(e.sgCircuit).filter(([key]) => !fields.has(key)))]))
  const result = action()
  for (const [entry, extra] of extras) if (map(entry.sgCircuit)) entry.sgCircuit = { ...extra, ...entry.sgCircuit }
  return result
}
export const setCircuit = (entries, sg, cfg) => withMetadata(entries || [], () => originalSet(entries, sg, cfg))
export const applyProgramAdvances = (routines, results) => withMetadata((routines || []).flatMap(r => r.ex || []), () => originalAdvance(routines, results))
