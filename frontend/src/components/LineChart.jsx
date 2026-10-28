import { useId, useLayoutEffect, useRef, useState } from 'react'
import { fmtNum, fmtDate, MONTHS, isoOf } from '../lib/format.js'
import { t } from '../lib/i18n.js'

const W = 340   // viewBox width; the svg stretches to its container, height comes from `h`

// points: [{ t: ms, y: num, d?: iso, m?: 0..1, note?: str }] sorted by t.
//   m    marks the point — a second reading carried by the same dot (bigger and more solid =
//        more of it). Used for effort on the weight curve, where the two belong on one line:
//        the same weight with less left in the tank is not the same session.
//   note extra text for that point's tooltip.
// opts: { h, unit, color, axes, goal, invert, series, variant }
//   ribbon is a compact, axis-free presentation of the same readings. Scrubbing reveals
//   the selected portion in colour, with the remaining recorded readings in grey.
//   Multiple series retain their separate coloured traces in the same compact layout.
//   invert flips the y axis, for a scale that counts down as it gets harder (RIR). Without it
//   a curve of reps-in-reserve reads upside down, with the hardest sets at the floor.
//   series draws several lines instead of one: [{ points, color }] (issue #145, one per set
//   number). `points` then only anchors the hover — one per date, its `note` the tooltip — and
//   the y axis spans every series.
export default function LineChart({ points, h = 150, unit = '', color = 'var(--acc)', axes = true, goal = null, invert = false, series = null, variant = 'default' }) {
  const gid = useId()
  const multi = Array.isArray(series) && series.length > 0
  const ribbon = variant === 'ribbon'
  const svgRef = useRef(null)
  const wrapRef = useRef(null)
  const tipRef = useRef(null)
  const [hover, setHover] = useState(null)   // { x, y, iso, v }

  // A new dataset has different coordinates and meaning, so never carry the previous
  // point selection into it. Layout timing removes the marker before the new chart paints.
  useLayoutEffect(() => {
    setHover(null)
  }, [points])

  // The tooltip is placed after layout, from its measured size, because the chart
  // lives in an overflow-clipped box: a fixed half-width offset (what this used to
  // do) hangs the label off the edge on the first and last point, and the clip then
  // eats it. Reading offsetWidth here also covers translated labels, which are not
  // all the same length. Writing straight to the node's style keeps this off the
  // render path — hover fires on every mouse move.
  useLayoutEffect(() => {
    const tip = tipRef.current, wrap = wrapRef.current
    if (ribbon || !hover || !tip || !wrap) return
    const cw = wrap.clientWidth, ch = wrap.clientHeight
    const tw = tip.offsetWidth, th = tip.offsetHeight
    const M = 4                                   // breathing room against the clip
    const cx = hover.x / W * cw, cy = hover.y / h * ch
    tip.style.left = Math.max(M, Math.min(cw - tw - M, cx - tw / 2)) + 'px'
    // Parked at the top, but dropped below the point when the point sits high
    // enough that the label would cover the very value it is reporting.
    tip.style.top = (cy < th + 14 ? Math.min(ch - th - M, cy + 14) : M) + 'px'
  })

  if (!points || points.length === 0) return <div className="empty small">{t('No data yet')}</div>
  const H = h
  const showAxes = axes && !ribbon
  const P = ribbon ? { l: 8, r: 8, t: 8, b: 26 } : { l: axes ? 34 : 8, r: 12, t: 10, b: axes ? 22 : 8 }
  const single = points.length === 1
  const pts = single ? [points[0], points[0]] : points
  const hasGoal = goal != null && isFinite(goal)
  const ys = multi ? series.flatMap(s => s.points.map(p => p.y)) : pts.map(p => p.y)
  let ymin = Math.min(...ys), ymax = Math.max(...ys)
  if (hasGoal) { ymin = Math.min(ymin, goal); ymax = Math.max(ymax, goal) }
  if (ymin === ymax) { ymin -= 1; ymax += 1 }
  const pad = (ymax - ymin) * 0.12; ymin -= pad; ymax += pad
  const t0 = pts[0].t, t1 = pts[pts.length - 1].t || t0 + 1
  const X = t => (t1 === t0 ? (P.l + W - P.r) / 2 : P.l + (t - t0) / (t1 - t0) * (W - P.l - P.r))
  const Y = y => {
    const f = (y - ymin) / (ymax - ymin)
    return P.t + (invert ? f : 1 - f) * (H - P.t - P.b)
  }

  const gridlines = []
  if (showAxes) {
    const range = ymax - ymin, raw = range / 3
    const pow = Math.pow(10, Math.floor(Math.log10(raw)))
    let step = 10 * pow
    for (const m of [1, 2, 2.5, 5, 10]) if (raw <= m * pow) { step = m * pow; break }
    for (let v0 = Math.ceil(ymin / step) * step; v0 <= ymax + 1e-9; v0 += step) {
      // Snapped to the step, so adding it up never drifts, and `|| 0` turns the -0 that
      // Math.ceil gives a range just under zero into a plain 0 instead of a "-0" label.
      const v = Math.round(v0 / step) * step || 0
      const y = Y(v)
      gridlines.push(<g key={'y' + v}>
        <line className="chart-grid-y" x1={P.l} y1={y} x2={W - P.r} y2={y} stroke="var(--sep-op)" strokeWidth="1" />
        <text x={P.l - 5} y={y + 3.5} textAnchor="end" fontSize="9.5" fill="var(--label-2)">{fmtNum(v)}</text>
      </g>)
    }
    const d0 = new Date(t0), d1 = new Date(t1)
    const ticks = []
    let m = new Date(d0.getFullYear(), d0.getMonth() + 1, 1)
    while (m <= d1) { ticks.push({ t: +m, txt: t(MONTHS[m.getMonth()]) }); m = new Date(m.getFullYear(), m.getMonth() + 1, 1) }
    if (ticks.length === 0 && !single) {
      for (let i = 0; i <= 2; i++) {
        const tv = t0 + (t1 - t0) * i / 2, dd = new Date(tv)
        ticks.push({ t: tv, txt: dd.getDate() + ' ' + t(MONTHS[dd.getMonth()]), anchor: i === 0 ? 'start' : i === 2 ? 'end' : 'middle' })
      }
    }
    const every = Math.max(1, Math.ceil(ticks.length / 7))
    ticks.forEach((tk, i) => {
      if (i % every) return
      const x = X(tk.t)
      gridlines.push(<g key={'x' + i}>
        <line className="chart-grid-x" x1={x} y1={P.t} x2={x} y2={H - P.b} stroke="var(--sep-op)" strokeWidth="1" />
        <text x={x} y={H - 7} textAnchor={tk.anchor || 'middle'} fontSize="9.5" fill="var(--label-2)">{tk.txt}</text>
      </g>)
    })
  }

  // Presentation only: every curve passes through the original readings. Control points
  // stay within each pair's bounds, so smoothing cannot invent a higher peak or lower trough.
  const curve = values => values.map((p, i) => {
    const x = X(p.t).toFixed(1), y = Y(p.y).toFixed(1)
    if (!i) return `M${x},${y}`
    const prev = values[i - 1]
    const mid = ((X(prev.t) + X(p.t)) / 2).toFixed(1)
    return `C${mid},${Y(prev.y).toFixed(1)} ${mid},${y} ${x},${y}`
  }).join(' ')
  const path = curve(pts)
  const last = pts[pts.length - 1]
  const hoverSource = single ? [points[0]] : points
  const hoverDates = hoverSource.map(p => p.d || isoOf(new Date(p.t)))
  const showYear = new Set(hoverDates.map(iso => new Date(iso + 'T12:00:00').getFullYear())).size > 1
  const hoverPts = hoverSource.map((p, i) => ({ x: X(p.t), y: Y(p.y), t: p.t, iso: hoverDates[i], v: p.y, note: p.note }))
  const caption = hover || (ribbon ? hoverPts.at(-1) : null)
  const marked = points.some(p => p.m != null)
  const floor = ribbon ? H : H - P.b
  // Only the edge padding extends to the card boundary; it adds no readings.
  const edgePath = ribbon && !single ? `M0,${Y(pts[0].y).toFixed(1)} L${path.slice(1)} L${W},${Y(last.y).toFixed(1)}` : path
  const area = ribbon && single ? '' : `${edgePath} L${ribbon ? W : X(last.t).toFixed(1)},${floor} L${ribbon ? 0 : X(pts[0].t).toFixed(1)},${floor} Z`
  const selected = hover || { x: X(last.t), y: Y(last.y) }
  // The final reading owns the edge padding too; leaving it uncoloured looks like future data.
  const fillToEnd = !hover || hover.t === last.t
  const goalLine = hasGoal && <g className="chart-goal">
    {ribbon && <line className="chart-goal-casing" x1={P.l} y1={Y(goal)} x2={W - P.r} y2={Y(goal)}
      stroke="var(--bg)" strokeWidth="2.5" strokeDasharray="8 6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
    <line className="chart-goal-rule" x1={P.l} y1={Y(goal)} x2={W - P.r} y2={Y(goal)} stroke={ribbon ? 'var(--label)' : 'var(--label-2)'}
      strokeWidth={ribbon ? 1.75 : 1} strokeDasharray={ribbon ? '8 6' : '4 5'} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    {!ribbon && <text x={W - P.r - 2} y={Y(goal) - 5} textAnchor="end" direction="ltr" fontSize="9.5" fontWeight="500" fill="var(--label)">{fmtNum(goal)}{unit ? ' ' + unit : ''}</text>}
  </g>

  const onMove = e => {
    const c = e.touches ? e.touches[0] : e
    if (!c || c.clientX === undefined) return
    const r = svgRef.current.getBoundingClientRect()
    const w = r.width || W
    const vx = (c.clientX - r.left) / w * W
    let best = hoverPts[0]
    hoverPts.forEach(p => { if (Math.abs(p.x - vx) < Math.abs(best.x - vx)) best = p })
    setHover(best)
  }

  const tip = caption && <div className="ctip" ref={tipRef}>
    {multi
      ? <>{fmtDate(caption.iso, true, showYear)}{caption.note ? ' · ' + caption.note : ''}</>
      : <>{fmtDate(caption.iso, true, showYear)} · {fmtNum(caption.v)}{unit ? ' ' + unit : ''}{caption.note ? ' · ' + caption.note : ''}</>}
  </div>

  return (
    <div className={'chart-i' + (ribbon ? ' chart-ribbon' : '')} ref={wrapRef}
      onMouseMove={onMove} onMouseDown={onMove}
      onMouseLeave={() => setHover(null)}
      onTouchStart={onMove} onTouchMove={onMove}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ aspectRatio: `${W}/${H}` }}>
        <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".58" />
          <stop offset="1" stopColor={color} stopOpacity=".04" />
        </linearGradient>
          {ribbon && <>
            <linearGradient id={gid + '-ribbon'} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={`color-mix(in srgb, ${color} 45%, #fff)`} />
              <stop offset=".48" stopColor={`color-mix(in srgb, ${color} 78%, #fff)`} />
              <stop offset="1" stopColor={`color-mix(in srgb, ${color} 70%, #101b15)`} />
            </linearGradient>
            <linearGradient id={gid + '-remainder'} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="color-mix(in srgb, var(--label) 38%, var(--bg))" />
              <stop offset=".5" stopColor="color-mix(in srgb, var(--label) 26%, var(--bg))" />
              <stop offset="1" stopColor="color-mix(in srgb, var(--label) 12%, var(--bg))" />
            </linearGradient>
            <clipPath id={gid + '-selected'}>
              <rect width={fillToEnd ? W : selected.x} height={H} />
            </clipPath>
          </>}
        </defs>
        {gridlines}
        {!ribbon && goalLine}
        {/* The first series is drawn widest and underneath, each next one thinner on top, so
            lines that share their values show as nested stripes instead of hiding each other. */}
        {multi ? series.map((s, k) => {
          const sw = 2 + (series.length - 1 - k) * 2.4
          return <g key={'s' + k}>
            {s.points.length > 1 && <path d={curve(s.points)}
              fill="none" stroke={s.color} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" vectorEffect={ribbon ? 'non-scaling-stroke' : undefined} />}
            {s.points.map((p, i) => <circle key={i} cx={X(p.t)} cy={Y(p.y)} r={sw / 2 + 1.2} fill={s.color} />)}
          </g>
        }) : <>
          {ribbon ? <>
            <path className="chart-remainder" d={area} fill={`url(#${gid}-remainder)`} />
            <path className="chart-remainder-line" d={edgePath} fill="none" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <g clipPath={`url(#${gid}-selected)`}>
              <path className="chart-area" d={area} fill={`url(#${gid}-ribbon)`} />
              <path className="chart-line" d={edgePath} fill="none" stroke="var(--label)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </g>
          </> : <>
            <path className="chart-area" d={area} fill={`url(#${gid})`} />
            <path className="chart-line" d={path} fill="none" stroke="var(--label)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </>}
          {marked && pts.map((p, i) => (p.m == null ? null :
            <circle key={'m' + i} cx={X(p.t)} cy={Y(p.y)} r={2.4 + p.m * 3} fill={color} opacity={0.3 + p.m * 0.7} />))}
        </>}
        {ribbon && goalLine}
        {!multi && <circle className="chart-end" cx={ribbon ? selected.x : X(last.t)} cy={ribbon ? selected.y : Y(last.y)}
          r={ribbon ? 6 : 4} fill={color} stroke="var(--label)" strokeWidth={ribbon ? 3 : 1.8} vectorEffect={ribbon ? 'non-scaling-stroke' : undefined} />}
        {hover && <g>
          <line className="cvl" x1={hover.x} y1={ribbon ? hover.y + 8 : P.t} x2={hover.x} y2={H - P.b} stroke="var(--label-3)" strokeWidth="1" strokeDasharray="3 3" />
          {multi
            ? series.map((s, k) => s.points.filter(p => p.t === hover.t).map((p, i) =>
              <circle key={k + '_' + i} cx={X(p.t)} cy={Y(p.y)} r={ribbon ? 6 : 4.5} fill={s.color} stroke={ribbon ? 'var(--label)' : 'var(--bg)'} strokeWidth={ribbon ? 3 : 2} vectorEffect={ribbon ? 'non-scaling-stroke' : undefined} />))
            : !ribbon && <>
              <line className="chl" x1={P.l} y1={hover.y} x2={W - P.r} y2={hover.y} stroke="var(--label-3)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx={hover.x} cy={hover.y} r="5" fill={color} stroke="var(--label)" strokeWidth="2" />
            </>}
        </g>}
      </svg>
      {ribbon ? <div className="chart-ribbon-meta">
        {hasGoal && <div className="chart-goal-label">
          <span className="chart-goal-swatch" aria-hidden="true" />
          <span>{t('Goal')} <bdi>{fmtNum(goal)}{unit ? ' ' + unit : ''}</bdi></span>
        </div>}
        {tip}
      </div> : tip}
    </div>
  )
}
