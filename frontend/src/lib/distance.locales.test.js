import { expect, it } from 'vitest'
const packs = import.meta.glob('../locales/*.js', { eager: true, import: 'default' })
const keys = ["Distance ({0})","Log distance instead","Log speed instead","Level {0}"]
it('localizes distance controls and retains format placeholders in every pack', () => {
  expect(Object.keys(packs)).toHaveLength(19)
  for(const [name, pack] of Object.entries(packs)) for(const key of keys) {
    expect(pack[key], name + ': ' + key).toBeTruthy()
    expect((pack[key].match(/\{\d+\}/g)||[]).sort()).toEqual((key.match(/\{\d+\}/g)||[]).sort())
  }
})
