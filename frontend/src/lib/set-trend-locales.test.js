import { describe, expect, it } from 'vitest'
import l0 from '../locales/ar.js'
import l1 from '../locales/bn.js'
import l2 from '../locales/de.js'
import l3 from '../locales/es.js'
import l4 from '../locales/fr.js'
import l5 from '../locales/he.js'
import l6 from '../locales/hi.js'
import l7 from '../locales/hu.js'
import l8 from '../locales/it.js'
import l9 from '../locales/ko.js'
import l10 from '../locales/pl.js'
import l11 from '../locales/pt-BR.js'
import l12 from '../locales/pt.js'
import l13 from '../locales/ru.js'
import l14 from '../locales/th.js'
import l15 from '../locales/tr.js'
import l16 from '../locales/uk.js'
import l17 from '../locales/zh-TW.js'
import l18 from '../locales/zh.js'
// For every upstream comparison message, keep placeholders sound and present in each IronLog language.
const packs = [['ar', l0], ['bn', l1], ['de', l2], ['es', l3], ['fr', l4], ['he', l5], ['hi', l6], ['hu', l7], ['it', l8], ['ko', l9], ['pl', l10], ['pt-BR', l11], ['pt', l12], ['ru', l13], ['th', l14], ['tr', l15], ['uk', l16], ['zh-TW', l17], ['zh', l18]]
const keys = ["Same as last time","{0} less help than last time","{0} more help than last time","{0} more than last time","{0} less than last time","{0} more rep than last time","{0} more reps than last time","{0} rep fewer than last time","{0} reps fewer than last time","Better estimated 1RM than last time","Lower estimated 1RM than last time","{0} longer than last time","{0} shorter than last time","Faster than last time","Slower than last time","Compare sets with last time"]
const placeholders = value => [...String(value).matchAll(/\{\d+\}/g)].map(m => m[0]).sort()

describe('openGym set trends use all 19 IronLog locale packs', () => {
  it('keeps every comparison and settings key available without changing interpolation', () => {
    for (const [lang, dict] of packs) for (const key of keys) {
      expect(typeof dict[key], lang + ': ' + key).toBe('string')
      expect(dict[key]?.length, lang + ': ' + key).toBeGreaterThan(0)
      expect(placeholders(dict[key]), lang + ': ' + key).toEqual(placeholders(key))
    }
  })
})
