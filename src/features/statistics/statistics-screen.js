import { escapeHtml } from '../../core/escape-html.js';
import { AppPageHeader } from '../../components/app-page-header.js';
import { buildStatisticsModel } from './statistics-data.js';

const ACCENT = '#d2ff16';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pct(value, max) {
  return `${clamp((value / max) * 100, 0, 100).toFixed(2)}%`;
}

function pointsFor(series, domain, width, height, left = 0, top = 0) {
  const span = Math.max(0.0001, domain.max - domain.min);
  const step = series.length > 1 ? width / (series.length - 1) : 0;
  return series.map((value, index) => ({
    x: left + index * step,
    y: top + height - ((value - domain.min) / span) * height,
  }));
}

function pathFromPoints(points) {
  return points.map((point, index) => `${index ? 'L' : 'M'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
}

function WeightChart({ series, yDomain }) {
  const width = 560;
  const height = 260;
  const plot = { left: 44, top: 18, width: 500, height: 205 };
  const actual = pointsFor(series.map((point) => point.value), yDomain, plot.width, plot.height, plot.left, plot.top);
  const upper = pointsFor(series.map((point) => point.targetMax), yDomain, plot.width, plot.height, plot.left, plot.top);
  const lower = pointsFor(series.map((point) => point.targetMin), yDomain, plot.width, plot.height, plot.left, plot.top);
  const mid = pointsFor(series.map((point) => (point.targetMin + point.targetMax) / 2), yDomain, plot.width, plot.height, plot.left, plot.top);
  const targetPolygon = [...upper, ...lower.slice().reverse()].map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
  const ticks = [82, 80, 78, 76, 74];
  const xLabelIndexes = [0, 2, 4, 6];
  const last = actual[actual.length - 1];

  return `<svg class="stats-weight-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="גרף משקל גוף מול טווח יעד">
    <defs>
      <linearGradient id="weightBand" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="${ACCENT}" stop-opacity=".20" />
        <stop offset="100%" stop-color="${ACCENT}" stop-opacity=".045" />
      </linearGradient>
      <filter id="weightGlow" x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    ${ticks.map((tick) => {
      const y = pointsFor([tick], yDomain, 0, plot.height, 0, plot.top)[0].y;
      return `<g><line x1="${plot.left}" x2="${plot.left + plot.width}" y1="${y}" y2="${y}" class="stats-grid-line"/><text x="9" y="${y + 4}" class="stats-axis-label">${tick}</text></g>`;
    }).join('')}
    <polygon points="${targetPolygon}" fill="url(#weightBand)" />
    <path d="${pathFromPoints(upper)}" class="stats-target-edge" />
    <path d="${pathFromPoints(lower)}" class="stats-target-edge" />
    <path d="${pathFromPoints(mid)}" class="stats-target-trend" />
    <path d="${pathFromPoints(actual)}" class="stats-weight-line" filter="url(#weightGlow)" />
    <line x1="${last.x}" x2="${last.x}" y1="${plot.top}" y2="${plot.top + plot.height}" class="stats-current-guide" />
    <circle cx="${last.x}" cy="${last.y}" r="8" class="stats-current-ring" />
    <circle cx="${last.x}" cy="${last.y}" r="4" class="stats-current-dot" />
    ${xLabelIndexes.map((index) => {
      const point = actual[index];
      return `<text x="${point.x}" y="248" text-anchor="${index === 0 ? 'start' : index === series.length - 1 ? 'end' : 'middle'}" class="stats-x-label">${escapeHtml(series[index].label)}</text>`;
    }).join('')}
  </svg>`;
}

function Sparkline(exercise) {
  const [min, max] = exercise.yDomain;
  const domain = { min, max };
  const points = pointsFor(exercise.series, domain, 132, 62, 4, 5);
  const last = points[points.length - 1];
  return `<svg class="exercise-spark" viewBox="0 0 140 72" aria-hidden="true">
    <line x1="4" x2="136" y1="66" y2="66" class="spark-base"/>
    <path d="${pathFromPoints(points)}" class="spark-line"/>
    <circle cx="${last.x}" cy="${last.y}" r="3.5" class="spark-dot"/>
  </svg>`;
}

function BrandHeader() {
  return AppPageHeader({
    title: 'סטטיסטיקה',
    subtitle: 'ביצועים. מגמות. התקדמות.',
    rootClass: 'statistics-header',
    brandClass: 'statistics-brand',
    headingClass: 'statistics-heading',
  });
}

function WeightCard(weight) {
  if (!weight.hasData) {
    return `<section class="statistics-card stats-empty-card">
      <div class="stats-card-title"><span class="stats-title-icon">↗</span><h2>משקל גוף מול טווח יעד</h2></div>
      <p>הוסף מדידת משקל ראשונה כדי להתחיל מסלול אמיתי מול טווח היעד.</p>
    </section>`;
  }
  const deltaClass = weight.weeklyDelta <= 0 ? 'is-down' : 'is-up';
  return `<section class="statistics-card weight-card">
    <div class="weight-card__top">
      <div class="stats-card-title">
        <span class="stats-title-icon">↗</span>
        <h2>משקל גוף מול טווח יעד</h2>
        <span class="stats-info" aria-hidden="true">i</span>
      </div>
      <span class="status-chip"><b>✓</b>${escapeHtml(weight.statusLabel)}</span>
    </div>
    <div class="weight-card__filter">ממוצע ${weight.averageWindowDays} ימים <span>⌄</span></div>
    <div class="weight-card__body">
      <div class="weight-chart-wrap">
        <span class="weight-unit">${escapeHtml(weight.unit)}</span>
        ${WeightChart(weight)}
        <div class="weight-delta ${deltaClass}"><strong>${weight.weeklyDelta > 0 ? '+' : ''}${weight.weeklyDelta.toFixed(1)}</strong><span>${weight.weeklyDelta <= 0 ? '↓' : '↑'}</span> מהשבוע שעבר</div>
      </div>
      <aside class="weight-summary">
        <div><span>היום</span><strong>${weight.current.toFixed(1)}</strong><small>${escapeHtml(weight.unit)}</small></div>
        <div class="weight-summary__target"><span>טווח יעד</span><strong>${weight.targetToday.min.toFixed(1)} – ${weight.targetToday.max.toFixed(1)}</strong><small>${escapeHtml(weight.unit)}</small></div>
        <div class="weight-legend">
          <p><i class="legend-line legend-line--actual"></i>משקל בפועל</p>
          <p><i class="legend-band"></i>טווח יעד</p>
          <p><i class="legend-line legend-line--trend"></i>מגמת יעד</p>
        </div>
      </aside>
    </div>
  </section>`;
}

function VolumeCard(volume) {
  return `<section class="statistics-card volume-card">
    <div class="compact-card-heading">
      <div><h2>נפח אפקטיבי לשריר <span class="stats-info">i</span></h2><p>שבוע ממוצע מול טווח יעד (סטים)</p></div>
    </div>
    <div class="volume-table-head"><span>שריר</span><span>סטים בשבוע</span><span>טווח יעד</span></div>
    <div class="volume-list">
      ${volume.muscles.map((muscle) => {
        const [targetMin, targetMax] = muscle.target;
        const status = muscle.actual < targetMin ? 'low' : muscle.actual > targetMax ? 'high' : 'ok';
        return `<div class="volume-row" data-status="${status}">
          <span class="volume-name"><i>${escapeHtml(muscle.icon)}</i>${escapeHtml(muscle.label)}</span>
          <span class="volume-track" aria-label="${escapeHtml(muscle.label)} ${muscle.actual} סטים, יעד ${targetMin} עד ${targetMax}">
            <i class="volume-target" style="left:${pct(targetMin, volume.maxScale)};width:${pct(targetMax - targetMin, volume.maxScale)}"></i>
            <b class="volume-actual" style="width:${pct(muscle.actual, volume.maxScale)}"></b>
            <em style="left:${pct(muscle.actual, volume.maxScale)}"></em>
          </span>
          <strong>${muscle.actual}</strong>
          <span class="volume-range">${targetMin}–${targetMax}</span>
        </div>`;
      }).join('')}
    </div>
    <div class="volume-legend"><span><i class="ok"></i>בתוך הטווח</span><span><i class="low"></i>מתחת לטווח</span><span><i class="high"></i>מעל הטווח</span></div>
    <button class="stats-card-action" type="button">הצג פירוט לפי שריר <span>‹</span></button>
  </section>`;
}

function ExerciseCard(performance) {
  if (!performance.hasData) {
    return `<section class="statistics-card exercise-card stats-empty-card">
      <div class="compact-card-heading"><div><h2>ביצועי תרגילים</h2><p>מגמת ביצועים · 1RM משוער</p></div></div>
      <p>הגרף יתעדכן לאחר השלמת סטים עם משקל וחזרות.</p>
    </section>`;
  }
  return `<section class="statistics-card exercise-card">
    <div class="compact-card-heading">
      <div><h2>ביצועי תרגילים <span class="stats-info">i</span></h2><p>מגמת ביצועים · 1RM משוער</p></div>
    </div>
    <div class="exercise-list">
      ${performance.exercises.map((exercise) => `<article class="exercise-row">
        <div class="exercise-copy">
          <h3>${escapeHtml(exercise.label)}</h3>
          <span>${escapeHtml(exercise.metric)}</span>
          <strong>${exercise.current.toFixed(1)}<small>${escapeHtml(exercise.unit)}</small></strong>
          <em>▲ ${exercise.delta.toFixed(1)} (${exercise.deltaPct.toFixed(1)}%)</em>
        </div>
        <div class="exercise-chart">${Sparkline(exercise)}<div><span>20 אפר׳</span><span>היום</span></div></div>
      </article>`).join('')}
    </div>
    <button class="stats-card-action" type="button">הצג כל התרגילים <span>‹</span></button>
  </section>`;
}

function RecoveryCard(recovery) {
  const metrics = [
    { icon: '◔', ...recovery.sleep },
    { icon: '◎', ...recovery.rirAdherence },
    { icon: '≋', ...recovery.readiness },
  ];
  return `<section class="statistics-card recovery-card">
    <div class="compact-card-heading"><h2>התאוששות <span class="stats-info">i</span></h2></div>
    <div class="recovery-grid">
      ${metrics.map((metric) => `<div class="recovery-metric ${metric.tone === 'medium' ? 'is-medium' : ''}"><span>${escapeHtml(metric.label)}</span><i>${metric.icon}</i><strong>${escapeHtml(metric.value)}</strong>${metric.unit ? `<small>${escapeHtml(metric.unit)}</small>` : ''}<em>${escapeHtml(metric.status)}</em></div>`).join('')}
    </div>
    <button class="stats-card-action" type="button">הצג היסטוריה <span>‹</span></button>
  </section>`;
}

function CycleCard(cycle) {
  return `<section class="statistics-card cycle-card">
    <div class="compact-card-heading"><div><h2>מחזור 12 שבועות <span class="stats-info">i</span></h2><p>התקדמות המחזור</p></div></div>
    <div class="cycle-weeks" dir="ltr">
      ${Array.from({ length: cycle.totalWeeks }, (_, index) => {
        const week = index + 1;
        const complete = cycle.completedWeeks.includes(week);
        const current = week === cycle.currentWeek;
        const deload = cycle.deloadWeeks.includes(week);
        return `<div class="cycle-week ${complete ? 'is-complete' : ''} ${current ? 'is-current' : ''} ${deload ? 'is-deload' : ''}"><span>${week}</span>${deload ? '<small>DELOAD</small>' : ''}</div>`;
      }).join('')}
    </div>
    <div class="cycle-legend"><span><i class="complete"></i>בוצע</span><span><i class="current"></i>שבוע נוכחי</span><span><i class="planned"></i>מתוכנן</span></div>
    <div class="cycle-footer"><div><span>שלב נוכחי</span><strong>${escapeHtml(cycle.phaseLabel)} ${cycle.currentWeek} מתוך ${cycle.totalWeeks}</strong></div><button class="stats-card-action stats-card-action--compact" type="button">הצג מחזור <span>‹</span></button></div>
  </section>`;
}

export function StatisticsScreen({ model } = {}) {
  const resolvedModel = model || buildStatisticsModel();
  return `<div class="statistics-page animate-enter" dir="rtl">
    ${BrandHeader()}
    ${WeightCard(resolvedModel.bodyWeight)}
    <div class="statistics-dashboard-grid">
      ${ExerciseCard(resolvedModel.exercisePerformance)}
      ${VolumeCard(resolvedModel.muscleVolume)}
      ${RecoveryCard(resolvedModel.recovery)}
      ${CycleCard(resolvedModel.mesocycle)}
    </div>
  </div>`;
}
