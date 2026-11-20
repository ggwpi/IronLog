// Fields an older IronLog editor cannot represent. No training calculations here.
export function protectLegacyBands(current, next, pairItems) {
  const list = x => Array.isArray(x) ? x : []
  for (const key of ['bands', 'bandEx']) if (Object.hasOwn(current, key)) next[key] = structuredClone(current[key])
  const retain = (old, item) => {
    if (old && item && Object.hasOwn(old, 'bands') && !Object.hasOwn(item, 'bands')) item.bands = structuredClone(old.bands)
  }
  for (const [old, item] of pairItems(list(current.routines), list(next.routines))) {
    if (!old || !item) continue
    for (const [cfg, target] of pairItems(list(old.ex), list(item.ex))) retain(cfg, target)
  }
  for (const [old, item] of pairItems(list(current.workouts), list(next.workouts))) {
    if (!old || !item) continue
    for (const [entry, target] of pairItems(list(old.entries), list(item.entries))) {
      if (!entry || !target) continue
      const a = Array.isArray(entry.sets) ? entry.sets : [], b = Array.isArray(target.sets) ? target.sets : []
      if (a.length !== b.length && a.some(s => s?.bands?.length) && b.some(s => s && !Object.hasOwn(s, 'bands'))) {
        // Sets have no stable ids: do not attach history to a guessed row after a structural edit.
        throw new RangeError('A client supporting resistance bands is required to change these rows')
      }
      for (const [row, incoming] of pairItems(a, b)) retain(row, incoming)
    }
  }
}

export function protectLegacyCircuits(current, next, pairItems) {
  const list = x => Array.isArray(x) ? x : []
  const retain = (old, item, keys) => {
    if (!old || !item) return
    if (typeof item !== 'object' || Array.isArray(item)) {
      if (keys.some(key => Object.hasOwn(old, key))) throw new RangeError('Invalid circuit metadata target')
      return
    }
    for (const key of keys) if (Object.hasOwn(old, key) && !Object.hasOwn(item, key)) item[key] = structuredClone(old[key])
  }
  for (const [old, item] of pairItems(list(current.routines), list(next.routines))) {
    if (!old || !item) continue
    for (const [cfg, target] of pairItems(list(old.ex), list(item.ex))) {
      if (cfg?.sgCircuit && target && cfg.sg !== target.sg) throw new RangeError('A client supporting circuits is required to change this group')
      retain(cfg, target, ['sgCircuit', 'preType'])
    }
  }
  for (const [old, item] of pairItems(list(current.workouts), list(next.workouts))) {
    if (!old || !item) continue
    retain(old, item, ['circuits'])
    for (const [entry, target] of pairItems(list(old.entries), list(item.entries))) retain(entry?.target, target?.target, ['sgCircuit', 'preType'])
  }
}
