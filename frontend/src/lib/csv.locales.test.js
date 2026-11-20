import { describe, expect, it } from 'vitest'
const packs = import.meta.glob('../locales/*.js', { eager: true, import: 'default' })
const keys = ['Export as spreadsheet (CSV)', 'CSV exported', 'Workouts (CSV)', 'Body weight & measurements (CSV)', 'A word about this set', '{0} measurement', '{0} measurements', 'From', 'To', 'Black', '3 months', '4 weeks']
describe('CSV and set-note labels in all IronLog locales', () => {
  it.each(Object.entries(packs))('%s contains every added label and preserves count placeholders', (_, pack) => {
    for (const key of keys) {
      expect(pack[key], key).toBeTruthy()
      if (key.includes('{0}')) for (const value of typeof pack[key] === 'object' ? Object.values(pack[key]) : [pack[key]]) expect(value).toContain('{0}')
    }
  })
})
