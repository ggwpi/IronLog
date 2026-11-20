import { expect, it } from 'vitest'
import { convertBodyWeight as original } from './opengym-v145/session-engine/frontend/src/lib/units.js'
import { convertBodyWeight as server } from '../../../api/body-compat/units.js'

it('the generated API converter exactly matches the complete original converter', () => {
  for (const from of ['kg', 'lb']) for (const to of ['kg', 'lb']) {
    for (const value of [null, undefined, '', '80.1', 'invalid', 0, -2, Infinity, NaN]) expect(server(value, from, to)).toBe(original(value, from, to))
    for (let n = 1; n < 3000; n++) expect(server(n / 10, from, to)).toBe(original(n / 10, from, to))
  }
})
