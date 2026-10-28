import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { ACCENTS } from './format.js'

// Execute the actual first-paint script: preferences must work before React or its CSS loads.
const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
const script = html.match(/<script id="boot-preferences">([\s\S]*?)<\/script>/)[1]
const run = new Function('localStorage', 'navigator', 'window', 'document', script)
function paint(state, { dark = true, language = 'en', raw = false } = {}) {
  const vars = {}
  const root = { dataset: {}, style: { setProperty: (key, value) => { vars[key] = value } } }
  const storage = { getItem: () => raw ? state : JSON.stringify(state), setItem: vi.fn() }
  run(storage, { language }, { matchMedia: () => ({ matches: dark }) }, { documentElement: root })
  expect(storage.setItem).not.toHaveBeenCalled()
  return { ...root, accent: vars['--boot-accent'] }
}

describe('startup appearance from existing settings', () => {
  it.each(Object.entries(ACCENTS))('uses the same dark %s preset as the application', (accent, color) => {
    expect(paint({ accent, theme: 'dark' }).accent).toBe(color)
  })
  it('uses the light shade and follows a system theme before first paint', () => {
    const root = paint({ accent: 'sky', theme: 'system' }, { dark: false })
    expect(root.dataset.theme).toBe('light')
    expect(root.accent).toBe('#007aff')
  })
  it('preserves a valid custom colour without importing the app or writing preferences', () => {
    expect(paint({ accent: 'custom', accentCustom: ' #5b4BFF ' }).accent).toBe('#5b4BFF')
  })
  it.each(['url(https://example.com/image)', '#fff', '', null])('falls back safely for an invalid custom colour: %s', accentCustom => {
    expect(paint({ accent: 'custom', accentCustom }).accent).toBe(ACCENTS.lime)
  })
  it('falls back for an unknown preset and a missing profile', () => {
    expect(paint({ accent: 'constructor' }).accent).toBe(ACCENTS.lime)
    expect(paint({}).accent).toBe(ACCENTS.lime)
  })
  it('still sets Hebrew direction before paint', () => {
    const root = paint({ lang: 'he', accent: 'sky' })
    expect(root.lang).toBe('he')
    expect(root.dir).toBe('rtl')
    expect(root.accent).toBe(ACCENTS.sky)
  })
  it('keeps startup usable when saved preferences are malformed or unavailable', () => {
    expect(() => paint('{broken', { raw: true })).not.toThrow()
    expect(() => paint(null)).not.toThrow()
    const root = { dataset: {}, style: { setProperty: vi.fn() } }
    expect(() => run({ getItem: () => { throw new Error('blocked') } }, {}, {}, { documentElement: root })).not.toThrow()
  })
})
