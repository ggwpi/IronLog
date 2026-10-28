// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import LineChart from './LineChart.jsx'
import { fmtDate, isoOf } from '../lib/format.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container
let root

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

const point = (year, month, day, y) => ({
  d: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  t: new Date(year, month - 1, day, 12).getTime(),
  y
})

const firstPoints = [
  { t: Date.UTC(2026, 0, 1), y: 80, d: '2026-01-01' },
  { t: Date.UTC(2026, 0, 15), y: 82, d: '2026-01-15' },
]
const nextPoints = [
  { t: Date.UTC(2026, 1, 1), y: 78, d: '2026-02-01' },
  { t: Date.UTC(2026, 1, 15), y: 79, d: '2026-02-15' },
]

function renderChart(points) {
  act(() => root.render(<LineChart points={points} axes={false} unit="kg" />))
}

function hoverAt(clientX) {
  act(() => {
    container.querySelector('.chart-i').dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX }))
  })
  return container.querySelector('.ctip').textContent
}

describe('LineChart hover date', () => {
  it('keeps same-year points in the compact format', () => {
    const first = point(2026, 1, 15, 70)
    renderChart([first, point(2026, 2, 15, 71)])

    expect(hoverAt(0)).toBe(`${fmtDate(first.d, true)} · 70 kg`)
  })

  it('includes the calendar year at a short cross-year boundary', () => {
    const first = point(2025, 11, 30, 70)
    const last = point(2026, 2, 1, 71)
    renderChart([first, last])

    expect(hoverAt(0)).toBe(`${fmtDate(first.d, true, true)} · 70 kg`)
    expect(hoverAt(340)).toBe(`${fmtDate(last.d, true, true)} · 71 kg`)
  })

  it('keeps a single point compact', () => {
    const only = point(2026, 7, 4, 70)
    renderChart([only])

    expect(hoverAt(170)).toBe(`${fmtDate(only.d, true)} · 70 kg`)
  })

  it('uses timestamp-only points when deciding whether to show the year', () => {
    const first = point(2025, 12, 31, 70)
    const last = point(2026, 1, 1, 71)
    const timestampOnly = [{ t: first.t, y: first.y }, { t: last.t, y: last.y }]
    renderChart(timestampOnly)

    const lastIso = isoOf(new Date(last.t))
    expect(hoverAt(340)).toBe(`${fmtDate(lastIso, true, true)} · 71 kg`)
  })
})

describe('LineChart hover state', () => {
  it('clears the tooltip and hover markers when points are replaced, then allows hovering again', () => {
    renderChart(firstPoints)
    hoverAt(170)

    expect(container.querySelector('.ctip')).toBeTruthy()
    expect(container.querySelector('.cvl')).toBeTruthy()
    expect(container.querySelector('.chl')).toBeTruthy()

    renderChart(nextPoints)

    expect(container.querySelector('.ctip')).toBeNull()
    expect(container.querySelector('.cvl')).toBeNull()
    expect(container.querySelector('.chl')).toBeNull()

    hoverAt(170)
    expect(container.querySelector('.ctip')).toBeTruthy()
    expect(container.querySelector('.cvl')).toBeTruthy()
  })
})

describe('LineChart y axis', () => {
  it('labels the zero line 0, never -0, when the range dips just below zero', () => {
    act(() => root.render(<LineChart points={[point(2026, 1, 1, 70), point(2026, 1, 8, 9999)]} axes unit="kg" />))
    const labels = [...container.querySelectorAll('text')].map(n => n.textContent)
    expect(labels).toContain('0')
    expect(labels.some(l => /^[-\u2212]0$/.test(l))).toBe(false)
  })
})

describe('LineChart curve accuracy', () => {
  it('passes through every reading without drawing peaks outside adjacent readings', () => {
    const points = [point(2026, 1, 1, 70), point(2026, 1, 2, 90), point(2026, 1, 20, 72), point(2026, 1, 22, 72)]
      .map(p => ({ ...p, m: 0.5 }))
    renderChart(points)

    const dots = [...container.querySelectorAll('circle')].slice(0, points.length)
      .map(n => [Number(n.getAttribute('cx')), Number(n.getAttribute('cy'))])
    const commands = container.querySelector('.chart-line').getAttribute('d').match(/[MC][^MC]+/g)
    const coords = command => command.slice(1).trim().split(/[ ,]+/).map(Number)
    expect(coords(commands[0])).toEqual(dots[0].map(n => Number(n.toFixed(1))))
    commands.slice(1).forEach((command, i) => {
      const c = coords(command), [from, to] = [dots[i], dots[i + 1]]
      expect(c.slice(-2)).toEqual(to.map(n => Number(n.toFixed(1))))
      for (let axis = 0; axis < 2; axis++) {
        for (const control of [c[axis], c[axis + 2]]) {
          expect(control).toBeGreaterThanOrEqual(Math.min(from[axis], to[axis]) - 0.05)
          expect(control).toBeLessThanOrEqual(Math.max(from[axis], to[axis]) + 0.05)
        }
      }
    })
    expect(hoverAt(340)).toContain('72 kg')
  })

  it.each(['default', 'ribbon'])('keeps each set identifiable and its tooltip intact with an inverted scale and goal in %s', variant => {
    const points = [point(2026, 1, 1, 2), { ...point(2026, 1, 8, 4), note: 'Set 1: 4 · Set 2: 3' }]
    act(() => root.render(<LineChart points={points} invert goal={1} variant={variant} series={[
      { color: '#49b6aa', points },
      { color: '#cddf45', points: points.map(p => ({ ...p, y: p.y - 1 })) },
    ]} />))

    expect([...container.querySelectorAll('path')].map(n => n.getAttribute('stroke'))).toEqual(['#49b6aa', '#cddf45'])
    const dots = [...container.querySelectorAll('circle')]
    expect(dots).toHaveLength(4)
    expect(container.querySelector('.chart-area')).toBeNull()
    expect(!!container.querySelector('.chart-ribbon')).toBe(variant === 'ribbon')
    expect(Number(dots[0].getAttribute('cy'))).toBeLessThan(Number(dots[1].getAttribute('cy')))
    expect(container.querySelector('.chart-goal')).toBeTruthy()
    expect(hoverAt(340)).toContain('Set 1: 4 · Set 2: 3')
  })
})

describe('LineChart ribbon', () => {
  it('selects the same recorded value by touch, retaining the goal and all later readings', () => {
    const points = [point(2026, 1, 1, 80), point(2026, 1, 8, 82), point(2026, 1, 15, 81)]
    act(() => root.render(<LineChart points={points} h={104} unit="kg" goal={77} variant="ribbon" />))
    const chart = container.querySelector('.chart-ribbon')
    const remaining = chart.querySelector('.chart-remainder').getAttribute('d')
    expect(chart.querySelector('.chart-grid-y')).toBeNull()
    expect(chart.querySelector('.chart-grid-x')).toBeNull()
    expect(chart.querySelector('.chart-goal')).toBeTruthy()
    expect(chart.querySelector('.chart-goal-label').textContent).toBe('Goal 77 kg')
    expect(chart.querySelector('clipPath rect').getAttribute('width')).toBe('340')
    expect(chart.querySelector('.ctip').textContent).toBe(`${fmtDate(points[2].d, true)} · 81 kg`)

    act(() => chart.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [{ clientX: 170 }] })))
    expect(chart.querySelector('.ctip').textContent).toBe(`${fmtDate(points[1].d, true)} · 82 kg`)
    expect(chart.querySelector('.chart-end').getAttribute('cx')).toBe('170')
    expect(chart.querySelector('clipPath rect').getAttribute('width')).toBe('170')
    expect(chart.querySelector('.chart-remainder').getAttribute('d')).toBe(remaining)
    expect(chart.querySelector('.chl')).toBeNull()

    hoverAt(340)
    expect(chart.querySelector('.ctip').textContent).toContain('81 kg')
    expect(chart.querySelector('clipPath rect').getAttribute('width')).toBe('340')
    hoverAt(170)
    expect(chart.querySelector('clipPath rect').getAttribute('width')).toBe('170')
  })

  it.each([70, 80, 90])('keeps the goal label outside the plot when the target is %s kg', goal => {
    act(() => root.render(<LineChart points={[point(2026, 1, 1, 80), point(2026, 1, 8, 81)]} h={104} unit="kg" goal={goal} variant="ribbon" />))
    const label = container.querySelector('.chart-goal-label')
    expect(label.textContent).toBe(`Goal ${goal} kg`)
    expect(label.closest('svg')).toBeNull()
    expect(container.querySelector('.chart-goal-rule')).toBeTruthy()
  })

  it('shows an isolated reading without inventing an area or losing its tooltip', () => {
    const points = [point(2026, 1, 1, 80)]
    act(() => root.render(<LineChart points={points} unit="kg" variant="ribbon" />))
    expect(container.querySelector('.chart-area').getAttribute('d')).toBe('')
    expect(container.querySelector('.chart-end').getAttribute('cx')).toBe('170')
    expect(hoverAt(170)).toContain('80 kg')
  })
})
