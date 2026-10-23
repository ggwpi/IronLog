import { describe,it,expect } from 'vitest'
import { restoreUpstreamPalette } from './ironlog-palette.js'
describe('requested upstream palette reset',()=>{
 it('restores the native palette without changing workouts or measurements',()=>{
  const workouts=[{id:'existing',entries:[{sets:[{w:62.5,r:8,done:true}]}]}],bodyweight=[{d:'2026-10-20',w:75.5}]
  const S={theme:'light',accent:'custom',accentCustom:'#d2ff16',workouts,bodyweight}
  expect(restoreUpstreamPalette(S)).toBe(true)
  expect(S.theme).toBe('dark');expect(S.accent).toBe('lime');expect(S.accentCustom).toBeUndefined()
  expect(S.workouts).toBe(workouts);expect(S.bodyweight).toBe(bodyweight)
 })
 it('respects later color choices',()=>{
  const S={};restoreUpstreamPalette(S);S.theme='light';S.accent='sky'
  expect(restoreUpstreamPalette(S)).toBe(false)
  expect(S).toMatchObject({theme:'light',accent:'sky'})
 })
})
