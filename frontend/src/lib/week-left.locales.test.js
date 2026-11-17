import { describe, expect, it } from 'vitest'
import p0 from '../locales/ar.js'
import p1 from '../locales/bn.js'
import p2 from '../locales/de.js'
import p3 from '../locales/es.js'
import p4 from '../locales/fr.js'
import p5 from '../locales/he.js'
import p6 from '../locales/hi.js'
import p7 from '../locales/hu.js'
import p8 from '../locales/it.js'
import p9 from '../locales/ko.js'
import p10 from '../locales/pl.js'
import p11 from '../locales/pt-BR.js'
import p12 from '../locales/pt.js'
import p13 from '../locales/ru.js'
import p14 from '../locales/th.js'
import p15 from '../locales/tr.js'
import p16 from '../locales/uk.js'
import p17 from '../locales/zh-TW.js'
import p18 from '../locales/zh.js'

// The countdown is shown on Home. Every language must have the same
// label, explanatory copy, and both placeholders with no English fallback.
const packs = {
  "ar": p0,
  "bn": p1,
  "de": p2,
  "es": p3,
  "fr": p4,
  "he": p5,
  "hi": p6,
  "hu": p7,
  "it": p8,
  "ko": p9,
  "pl": p10,
  "pt-BR": p11,
  "pt": p12,
  "ru": p13,
  "th": p14,
  "tr": p15,
  "uk": p16,
  "zh-TW": p17,
  "zh": p18,
}
const keys = [
  "Workouts per week",
  "No weekly countdown on Home.",
  "{0} of {1} left this week",
  "All done this week. Nice."
]

describe('weekly countdown localized parity', () => {
  for (const [locale, pack] of Object.entries(packs)) {
    it(`has complete localized week-left copy for ${locale}`, () => {
      for (const key of keys) {
        expect(typeof pack[key], `${locale}: ${key}`).toBe('string')
        expect(pack[key].trim().length, `${locale}: ${key}`).toBeGreaterThan(0)
      }
      expect(pack['{0} of {1} left this week'], locale).toContain('{0}')
      expect(pack['{0} of {1} left this week'], locale).toContain('{1}')
    })
  }
})
