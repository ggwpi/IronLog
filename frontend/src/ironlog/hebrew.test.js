import { afterEach, describe, expect, it } from 'vitest'
import he from '../locales/he.js'
import ar from '../locales/ar.js'
import { _setLangState, t, tn, dateLocale, RTL_LANGS, exerciseNameFor, _setDetails, instrFor, descFor } from '../lib/i18n-core.js'
import names from '../exercise-names/he.js'
import instructions from '../instr/he.js'
import englishInstructions from '../instr/en.js'
import descriptions from '../exercise-desc/he.js'
import { EXDB } from '../lib/exercises-data.js'
import { applyHebrewPreferences } from './hebrew-preferences.js'

const plain = text => text.replace(/[\u2066-\u2069]/g,'')
afterEach(() => _setLangState('en',{},null,null,true,false))

describe('Hebrew interface and catalogue', () => {
 it('covers every existing interface key with the same interpolation arguments', () => {
  for (const key of Object.keys(ar)) expect(he[key],key).toBeTruthy()
  const args = s => [...s.matchAll(/\{\d+\}/g)].map(m=>m[0]).sort()
  for (const [key,value] of Object.entries(he)) for (const form of typeof value === 'string' ? [value] : Object.values(value)) {
   expect(form.trim(),key).not.toBe('')
   expect(args(form),key).toEqual(args(key))
  }
 })
 it('translates every catalogue name, description and instruction step', () => {
  const incomplete = []
  for (const ex of EXDB) {
   if (!/[א-ת]/.test(names[ex.id] || '')) incomplete.push(ex.id + ':name')
   if (!/[א-ת]/.test(descriptions[ex.id] || '')) incomplete.push(ex.id + ':description')
   const steps = instructions[ex.id] || []
   if (steps.length !== englishInstructions[ex.id].length || !steps.every(step => /[א-ת]/.test(step))) incomplete.push(ex.id + ':instructions')
  }
  expect(incomplete).toEqual([])
 })
 it('uses Hebrew dates, Hebrew plurals and isolates signed numbers from RTL text', () => {
  _setLangState('he',he,instructions,names,false,false)
  expect(RTL_LANGS.has('he')).toBe(true)
  expect(dateLocale()).toBe('he-IL')
  expect(plain(t('Continue without account'))).toBe('המשך ללא חשבון')
  expect(plain(tn('{0} set','{0} sets',1))).toBe('1 סט')
  expect(plain(tn('{0} set','{0} sets',2))).toBe('2 סטים')
  expect(t('{0} sets',-2)).toContain('\u2066-2\u2069')
  expect(plain(t('Hi {0}', 'Bench $&'))).toContain('Bench $&')
 })
 it('shows Hebrew exercise details and preserves user-written names', () => {
  _setLangState('he',he,instructions,names,false,false)
  _setDetails({}, {}, descriptions, 'he')
  expect(exerciseNameFor({id:'0025',n:'barbell bench press'})).toBe('לחיצת חזה במוט')
  expect(instrFor({id:'0025'})[0]).toMatch(/[א-ת]/)
  expect(descFor({id:'0025'})).toMatch(/[א-ת]/)
  expect(exerciseNameFor({id:'my-custom',n:'My own exercise'})).toBe('My own exercise')
  expect(exerciseNameFor({id:'ironlog-incline-smith',n:'Incline Smith Press'})).toMatch(/[א-ת]/)
  expect(exerciseNameFor({id:'ironlog-incline-smith',n:'My renamed exercise'})).toBe('My renamed exercise')
 })
 it('upgrades existing preferences once without changing workouts or a later language choice', () => {
  const workout={id:'keep-me',entries:[{id:'0025',sets:[{w:62.5,r:8,done:true}]}]}
  const s={lang:'en',langAuto:true,workouts:[workout]}
  expect(applyHebrewPreferences(s)).toBe(true)
  expect(s).toMatchObject({lang:'he',langAuto:false,enParens:{he:false},enOnly:{he:false}})
  expect(s.workouts[0]).toBe(workout)
  s.lang='en'
  expect(applyHebrewPreferences(s)).toBe(false)
  expect(s.lang).toBe('en')
 })
})
