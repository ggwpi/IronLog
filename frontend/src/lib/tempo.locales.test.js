import { expect, it } from 'vitest'
const packs = import.meta.glob('../locales/*.js', { eager: true, import: 'default' })
const keys = ["Lower (s)","Pause at the bottom (s)","Lift (s)","Squeeze at the top (s)","Tempo","Seconds for each part of a rep: lower, pause, lift, squeeze. 3-1-1-0 is three down, one at the bottom, one up, straight into the next.","Explosive lift (X)","Save","No tempo","Cancel","Tempo for this set","Like the exercise ({0})","About as heavy as a blue whale.","About {0}× a blue whale.","About as heavy as an elephant.","About {0}× an elephant.","About as heavy as a car.","About {0}× a car.","About as heavy as a grand piano.","About {0}× a grand piano."]
it('localizes tempo controls in all existing locale packs', () => {
 expect(Object.keys(packs)).toHaveLength(19)
 for (const [name, pack] of Object.entries(packs)) for (const key of keys) expect(pack[key], name + ': ' + key).toBeTruthy()
})
