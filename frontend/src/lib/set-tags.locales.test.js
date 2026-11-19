import { describe, expect, it } from 'vitest'
const packs = import.meta.glob('../locales/*.js', { eager: true, import: 'default' })
const keys = ['Colour tag', 'Your own code for this set', 'Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'None']
describe('set tag labels in every IronLog locale', () => {
  it.each(Object.entries(packs))('%s has all tag names and menu labels', (_, pack) => {
    for (const key of keys) expect(pack[key], key).toEqual(expect.any(String))
  })
})
