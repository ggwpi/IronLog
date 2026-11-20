import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { reportRange } from './opengym-v145/report.js'
const blobs = JSON.parse(readFileSync(new URL('./opengym-v145/report-source-blobs.json', import.meta.url)))
describe('complete original report module used for export ranges', () => {
  it.each(Object.entries(blobs))('%s is the pinned original Git blob', (name, expected) => {
    const bytes = readFileSync(new URL('./opengym-v145/' + name, import.meta.url))
    expect(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex')).toBe(expected)
  })
  it('keeps original inclusive range and calendar-month edge behavior', () => {
    expect(reportRange('4w', { today: '2026-11-20' })).toEqual({ from: '2026-10-24', to: '2026-11-20', days: 28 })
    expect(reportRange('3m', { today: '2026-05-31' })).toMatchObject({ from: '2026-03-01', to: '2026-05-31' })
    expect(reportRange('3m', { today: '2024-05-31' })).toMatchObject({ from: '2024-03-01', to: '2024-05-31' })
    expect(reportRange('4w', { today: '2026-03-29' }).days).toBe(28)
  })
})
