// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vm from 'node:vm'
import { afterEach, describe, expect, it } from 'vitest'
import { setLang, t, tn, dateLocale, LANGS, RTL_LANGS } from './i18n.js'
import { matchLocale, autoLang } from './default-lang.js'
import he from '../locales/he.js'

afterEach(async () => { await setLang('en') })

describe('Hebrew through the existing language system', () => {
  it('loads the Hebrew pack and switches document direction in both directions', async () => {
    expect(LANGS.he).toBe('עברית')
    expect(RTL_LANGS.has('he')).toBe(true)
    await setLang('he')
    expect(document.documentElement.lang).toBe('he')
    expect(document.documentElement.dir).toBe('rtl')
    expect(dateLocale()).toBe('he-IL')
    expect(t('Home')).toBe('בית')
    expect(t('Backups')).toBe('חלופות לתרגיל')
    expect(t('Passkeys')).toBe('מפתחות גישה')
    expect(t('Rest between warm-ups')).toBe('מנוחה בין סטי חימום')
    await setLang('en')
    expect(document.documentElement.dir).toBe('ltr')
    expect(t('Home')).toBe('Home')
  })
  it('formats counts and substitutions without losing dynamic values', async () => {
    await setLang('he')
    expect(t('Hi {0}', 'Ziv')).toBe('שלום Ziv.')
    expect(tn('{0} set', '{0} sets', 1)).toBe('1 סט')
    expect(tn('{0} set', '{0} sets', 2)).toBe('2 סטים')
    expect(tn('{0} set', '{0} sets', 10)).toBe('10 סטים')
    expect(t('Set {0} of {1}', 2, 4)).toBe('סט 2 מתוך 4')
    expect(t('{0} week streak', 1)).toBe('רצף של 1 שבוע')
    expect(t('{0} week streak', 2)).toBe('רצף של 2 שבועות')
    expect(new Intl.DateTimeFormat(dateLocale(), { month: 'long', timeZone: 'UTC' }).format(new Date('2026-10-24'))).toBe('אוקטובר')
  })
  it('recognizes modern and legacy browser tags without changing chosen languages', () => {
    expect(matchLocale('he-IL')).toBe('he')
    expect(matchLocale('iw-IL')).toBe('he')
    expect(autoLang({ lang: 'en', langAuto: true }, {}, ['he-IL'])).toBe('he')
    expect(autoLang({ lang: 'en', langAuto: false }, {}, ['he-IL'])).toBe(null)
  })
  it('uses workout terminology rather than unrelated dictionary meanings', () => {
    for (const [source, target] of Object.entries({ Sets: 'סטים', Reps: 'חזרות', Resume: 'המשך אימון', Volume: 'נפח אימון', PRs: 'שיאים אישיים' }))
      expect(he[source]).toBe(target)
  })
})

describe('Hebrew direction before the app loads', () => {
  const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
  const script = html.match(/<script id="boot-preferences">([\s\S]*?)<\/script>/)[1]
  const boot = (saved, browser) => {
    const document = { documentElement: { dataset: {}, style: { setProperty() {} } } }
    vm.runInNewContext(script, { document, navigator: { language: browser }, localStorage: { getItem: () => JSON.stringify(saved) } })
    return { lang: document.documentElement.lang, dir: document.documentElement.dir }
  }
  it('starts saved Hebrew profiles in RTL and honors an explicit English choice', () => {
    expect(boot({ lang: 'he' }, 'en-US')).toEqual({ lang: 'he', dir: 'rtl' })
    expect(boot({ lang: 'en' }, 'he-IL')).toEqual({ lang: 'en', dir: 'ltr' })
    expect(boot({}, 'iw-IL')).toEqual({ lang: 'he', dir: 'rtl' })
    expect(boot({ lang: 'ar' }, 'en-US')).toEqual({ lang: 'ar', dir: 'rtl' })
  })
})
