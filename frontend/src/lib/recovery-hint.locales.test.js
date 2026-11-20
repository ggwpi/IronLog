import pack0 from '../locales/ar.js'
import pack1 from '../locales/bn.js'
import pack2 from '../locales/de.js'
import pack3 from '../locales/es.js'
import pack4 from '../locales/fr.js'
import pack5 from '../locales/he.js'
import pack6 from '../locales/hi.js'
import pack7 from '../locales/hu.js'
import pack8 from '../locales/it.js'
import pack9 from '../locales/ko.js'
import pack10 from '../locales/pl.js'
import pack11 from '../locales/pt-BR.js'
import pack12 from '../locales/pt.js'
import pack13 from '../locales/ru.js'
import pack14 from '../locales/th.js'
import pack15 from '../locales/tr.js'
import pack16 from '../locales/uk.js'
import pack17 from '../locales/zh-TW.js'
import pack18 from '../locales/zh.js'
import { describe, expect, it } from 'vitest'

// A new IronLog Home card must not fall back to English in any supported locale.
// pt-BR includes inherited Portuguese words and its Brazilian-specific overrides.
const packs = {
  "ar": pack0,
  "bn": pack1,
  "de": pack2,
  "es": pack3,
  "fr": pack4,
  "he": pack5,
  "hi": pack6,
  "hu": pack7,
  "it": pack8,
  "ko": pack9,
  "pl": pack10,
  "pt-BR": pack11,
  "pt": pack12,
  "ru": pack13,
  "th": pack14,
  "tr": pack15,
  "uk": pack16,
  "zh-TW": pack17,
  "zh": pack18,
}

const keys = [
  "Your legs are still recovering from {0}.",
  "Your upper body is still recovering from {0}.",
  "Rest day, good timing.",
  "Go a bit lighter today, or swap the session.",
  "Upper body today?",
  "Legs today?",
  "Your legs haven’t had any work in {0} days.",
  "Your back hasn’t had any work in {0} days.",
  "Your chest hasn’t had any work in {0} days.",
  "Your shoulders haven’t had any work in {0} days.",
  "Today’s plan takes care of that.",
  "A few sets today would be nice.",
  "Hidden for today. Back tomorrow.",
  "Hide for today",
  "Swap session"
]

describe('Recovery Hint localized parity', () => {
  for (const [locale, pack] of Object.entries(packs)) {
    it(`has every Recovery Hint line in ${locale}`, () => {
      for (const key of keys) {
        expect(pack[key], `${locale}: ${key}`).toEqual(expect.any(String))
        expect(pack[key].trim().length).toBeGreaterThan(0)
        if (key.includes('{0}')) expect(pack[key], `${locale}: must keep {0}`).toContain('{0}')
      }
    })
  }
})
