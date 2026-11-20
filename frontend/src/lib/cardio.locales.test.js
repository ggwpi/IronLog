import { expect, it } from 'vitest'
const packs = import.meta.glob('../locales/*.js', { eager: true, import: 'default' })
const keys = ["{0} min","{0} sessions","{0} of {1} min","{0} of {1}","Add a goal","Activity","Per week","min","Sessions","Goal","Add","Save","Show first","Remove goal","Cancel","Weekly cardio goals","150 minutes a week is the number health advice keeps repeating. Pick yours, or none.","No goal yet. The card just counts.","Cardio exercises count by their name, sport from Apple Health, Health Connect or an import by its type.","Goals","Cardio this week","Goal reached. Your heart says thanks.","This week","Any cardio","Run","Ride","Swim","Walk","Hike","Rowing","Elliptical","Stair climber","Jump rope","Skiing","Minutes","Distance"]
it('localizes weekly cardio controls and activity kinds in all existing packs', () => {
expect(Object.keys(packs)).toHaveLength(19)
for(const [name, pack] of Object.entries(packs)) for(const key of keys) expect(pack[key], name + ': ' + key).toBeTruthy()
})
