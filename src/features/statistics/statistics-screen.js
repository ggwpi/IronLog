import { escapeHtml } from '../../core/escape-html.js';
import { AppPageHeader } from '../../components/app-page-header.js';
import { buildStatisticsModel } from './statistics-data.js';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pct(value, max) {
  return `${clamp((Number(value) / Math.max(1, Number(max))) * 100, 0, 100).toFixed(2)}%`;
}

function pointsFor(series, domain, width, height, left = 0, top = 0) {
  const span = Math.max(0.0001, Number(domain.max) - Number(domain.min));
  const step = series.length > 1 ? width / (series.length - 1) : 0;
  return series.map((value, index) => ({
    x: left + index * step,
    y: top + height - ((Number(value) - Number(domain.min)) / span) * height,
  }));
}

function pathFromPoints(points) {
  return points.map((point, index) => `${index ? 'L' : 'M'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
}

function chartTicks(domain, count = 3) {
  const min = Number(domain.min);
  const max = Number(domain.max);
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return [min || 0];
  return Array.from({ length: count }, (_, index) => max - ((max - min) * index) / (count - 1));
}

function WeightChart(weight) {
  const { series, yDomain } = weight;
  const width = 390;
  const height = 170;
  const plot = { left: 8, top: 15, width: 374, height: 118 };
  const actual = pointsFor(series.map((point) => point.value), yDomain, plot.width, plot.height, plot.left, plot.top);
  const upper = pointsFor(series.map((point) => point.targetMax), yDomain, plot.width, plot.height, plot.left, plot.top);
  const lower = pointsFor(series.map((point) => point.targetMin), yDomain, plot.width, plot.height, plot.left, plot.top);
  const targetPolygon = [...upper, ...lower.slice().reverse()].map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
  const last = actual.at(-1);
  const labels = [...new Set([0, Math.floor((series.length - 1) / 2), series.length - 1])];
  const ticks = chartTicks(yDomain, 3);

  return `<svg class="native-weight-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="משקל גוף לאורך זמן מול טווח היעד">
    <defs>
      <linearGradient id="nativeWeightBand" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="currentColor" stop-opacity=".12" />
        <stop offset="100%" stop-color="currentColor" stop-opacity=".025" />
      </linearGradient>
    </defs>
    ${ticks.map((tick) => {
      const y = pointsFor([tick], yDomain, 0, plot.height, 0, plot.top)[0].y;
      return `<line x1="${plot.left}" x2="${plot.left + plot.width}" y1="${y}" y2="${y}" class="native-chart-guide"/>`;
    }).join('')}
    <polygon points="${targetPolygon}" fill="url(#nativeWeightBand)" class="native-target-band"/>
    <path d="${pathFromPoints(upper)}" class="native-target-edge"/>
    <path d="${pathFromPoints(lower)}" class="native-target-edge"/>
    <path d="${pathFromPoints(actual)}" class="native-weight-line"/>
    <circle cx="${last.x}" cy="${last.y}" r="4.5" class="native-weight-dot"/>
    ${labels.map((index) => `<text x="${actual[index].x}" y="160" text-anchor="${index === 0 ? 'start' : index === series.length - 1 ? 'end' : 'middle'}" class="native-chart-label">${escapeHtml(series[index].label)}</text>`).join('')}
  </svg>`;
}

function Sparkline(exercise) {
  const domain = { min: exercise.yDomain[0], max: exercise.yDomain[1] };
  const points = pointsFor(exercise.series, domain, 92, 34, 2, 3);
  const last = points.at(-1);
  return `<svg class="native-sparkline" viewBox="0 0 96 40" aria-hidden="true"><path d="${pathFromPoints(points)}"/><circle cx="${last.x}" cy="${last.y}" r="2.6"/></svg>`;
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

function SectionHeader(title, subtitle = '') {
  return `<header class="native-stats-section__head"><div><h2>${escapeHtml(title)}</h2>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}</div></header>`;
}

function WeightSection(weight) {
  if (!weight.hasData) {
    return `<section class="native-stats-section native-weight-section">${SectionHeader('משקל גוף', 'מגמה מול טווח יעד')}<div class="native-empty-state"><strong>אין עדיין מדידות משקל</strong><span>אחרי המדידה הראשונה תופיע כאן מגמה אמיתית.</span></div></section>`;
  }
  const deltaTone = weight.weeklyDelta > 0 ? 'is-up' : weight.weeklyDelta < 0 ? 'is-down' : 'is-flat';
  const deltaArrow = weight.weeklyDelta > 0 ? '↑' : weight.weeklyDelta < 0 ? '↓' : '–';
  return `<section class="native-stats-section native-weight-section">
    ${SectionHeader('משקל גוף', 'מגמה מול טווח יעד')}
    <div class="native-weight-summary">
      <div class="native-weight-current"><strong>${weight.current.toFixed(1)}</strong><span>${escapeHtml(weight.unit)}</span></div>
      <div class="native-weight-status"><b>${escapeHtml(weight.statusLabel)}</b><span>יעד ${weight.targetToday.min.toFixed(1)}–${weight.targetToday.max.toFixed(1)} ${escapeHtml(weight.unit)}</span></div>
      <div class="native-weight-delta ${deltaTone}"><strong>${deltaArrow} ${Math.abs(weight.weeklyDelta).toFixed(1)}</strong><span>מהשבוע שעבר</span></div>
    </div>
    <div class="native-weight-chart-wrap">${WeightChart(weight)}</div>
    <div class="native-chart-legend"><span><i class="is-line"></i>משקל בפועל</span><span><i class="is-band"></i>טווח יעד</span><span>ממוצע ${weight.averageWindowDays} ימים</span></div>
  </section>`;
}

function quickSummary(model) {
  const volume = model.muscleVolume;
  const weeklySets = volume.muscles.reduce((sum, muscle) => sum + Number(muscle.actual || 0), 0);
  const activeMuscles = volume.muscles.filter((muscle) => Number(muscle.actual) > 0).length;
  const rir = model.recovery.rirAdherence;
  const cycle = model.mesocycle;
  return `<section class="native-summary-strip" aria-label="סיכום מהיר">
    <div><strong>${escapeHtml(rir.value)}</strong><span>עמידה ב־RIR</span></div>
    <div><strong>${weeklySets.toFixed(0)}</strong><span>סטים השבוע</span></div>
    <div><strong>${activeMuscles}</strong><span>שרירים פעילים</span></div>
    <div><strong>${cycle.currentWeek}/${cycle.totalWeeks}</strong><span>מחזור נוכחי</span></div>
  </section>`;
}

function exerciseRow(exercise) {
  const positive = exercise.delta > 0;
  const negative = exercise.delta < 0;
  const tone = positive ? 'is-positive' : negative ? 'is-negative' : 'is-neutral';
  const arrow = positive ? '▲' : negative ? '▼' : '•';
  return `<article class="native-exercise-row">
    <div class="native-exercise-copy"><strong>${escapeHtml(exercise.label)}</strong><span>${escapeHtml(exercise.metric)}</span></div>
    <div class="native-exercise-value"><strong>${exercise.current.toFixed(1)} <small>${escapeHtml(exercise.unit)}</small></strong><span class="${tone}">${arrow} ${Math.abs(exercise.deltaPct).toFixed(1)}%</span></div>
    <div class="native-exercise-spark">${Sparkline(exercise)}</div>
  </article>`;
}

function ExerciseSection(performance) {
  if (!performance.hasData) {
    return `<section class="native-stats-section">${SectionHeader('ביצועי תרגילים', '1RM משוער לאורך זמן')}<div class="native-empty-state"><strong>אין עדיין גרף ביצועים</strong><span>סטים עם משקל וחזרות ייצרו את המגמה.</span></div></section>`;
  }
  const all = performance.allExercises || performance.exercises || [];
  const primary = all.slice(0, 3);
  const rest = all.slice(3);
  return `<section class="native-stats-section">
    ${SectionHeader('ביצועי תרגילים', performance.periodLabel || '1RM משוער לאורך זמן')}
    <div class="native-exercise-list">${primary.map(exerciseRow).join('')}</div>
    ${rest.length ? `<details class="native-disclosure"><summary>הצג את כל התרגילים <span>${all.length}</span></summary><div class="native-exercise-list native-exercise-list--extra">${rest.map(exerciseRow).join('')}</div></details>` : ''}
  </section>`;
}

function volumeRow(muscle, maxScale) {
  const [targetMin, targetMax] = muscle.target;
  const status = muscle.actual < targetMin ? 'low' : muscle.actual > targetMax ? 'high' : 'ok';
  const statusText = status === 'ok' ? 'בטווח' : status === 'low' ? 'מתחת' : 'מעל';
  return `<div class="native-volume-row" data-status="${status}">
    <div class="native-volume-label"><strong>${escapeHtml(muscle.label)}</strong><span>${muscle.actual} / ${targetMin}–${targetMax}</span></div>
    <div class="native-volume-track" aria-label="${escapeHtml(muscle.label)} ${muscle.actual} סטים, יעד ${targetMin} עד ${targetMax}"><i class="native-volume-target" style="left:${pct(targetMin, maxScale)};width:${pct(targetMax - targetMin, maxScale)}"></i><b style="width:${pct(muscle.actual, maxScale)}"></b></div>
    <span class="native-volume-state">${statusText}</span>
  </div>`;
}

function VolumeSection(volume) {
  const muscles = volume.muscles || [];
  const primary = muscles.slice(0, 5);
  const rest = muscles.slice(5);
  return `<section class="native-stats-section">
    ${SectionHeader('נפח לפי שריר', 'סטים אפקטיביים מול טווח היעד')}
    <div class="native-volume-list">${primary.map((muscle) => volumeRow(muscle, volume.maxScale)).join('')}</div>
    ${rest.length ? `<details class="native-disclosure"><summary>הצג את כל השרירים <span>${muscles.length}</span></summary><div class="native-volume-list native-volume-list--extra">${rest.map((muscle) => volumeRow(muscle, volume.maxScale)).join('')}</div></details>` : ''}
  </section>`;
}

function RecoverySection(recovery) {
  const metrics = [recovery.sleep, recovery.rirAdherence, recovery.readiness];
  const measured = metrics.filter((metric) => metric.value !== '—');
  const good = measured.filter((metric) => metric.tone === 'good').length;
  const overall = !measured.length ? 'אין מספיק נתונים' : good === measured.length ? 'טובה' : good ? 'מעורבת' : 'דורשת שיפור';
  return `<section class="native-stats-section">
    ${SectionHeader('התאוששות', 'תמונה אחת במקום שלושה Widgets')}
    <div class="native-recovery-overview"><strong>${escapeHtml(overall)}</strong><span>${measured.length}/${metrics.length} מדדים זמינים</span></div>
    <div class="native-recovery-list">
      ${metrics.map((metric) => `<div><span>${escapeHtml(metric.label)}</span><strong>${escapeHtml(metric.value)}${metric.unit ? ` <small>${escapeHtml(metric.unit)}</small>` : ''}</strong><em class="${metric.tone === 'good' ? 'is-good' : 'is-medium'}">${escapeHtml(metric.status)}</em></div>`).join('')}
    </div>
  </section>`;
}

function CycleSection(cycle) {
  return `<section class="native-stats-section native-cycle-section">
    ${SectionHeader(`מחזור ${cycle.totalWeeks} שבועות`, 'התקדמות המחזור')}
    <div class="native-cycle-weeks" dir="ltr">
      ${Array.from({ length: cycle.totalWeeks }, (_, index) => {
        const week = index + 1;
        const complete = cycle.completedWeeks.includes(week);
        const current = week === cycle.currentWeek;
        const deload = cycle.deloadWeeks.includes(week);
        return `<span class="${complete ? 'is-complete' : ''} ${current ? 'is-current' : ''} ${deload ? 'is-deload' : ''}" title="שבוע ${week}${deload ? ' · deload' : ''}">${week}</span>`;
      }).join('')}
    </div>
    <div class="native-cycle-meta"><strong>${escapeHtml(cycle.phaseLabel)}</strong><span>שבוע ${cycle.currentWeek} מתוך ${cycle.totalWeeks}</span></div>
    <div class="native-cycle-deload">${cycle.deloadWeeks.length ? `Deload: שבועות ${cycle.deloadWeeks.join(', ')}` : 'ללא שבוע Deload מתוכנן'}</div>
  </section>`;
}

export function StatisticsScreen({ model } = {}) {
  const resolvedModel = model || buildStatisticsModel();
  return `<div class="statistics-page statistics-page--native animate-enter" dir="rtl">
    ${BrandHeader()}
    ${WeightSection(resolvedModel.bodyWeight)}
    ${quickSummary(resolvedModel)}
    ${ExerciseSection(resolvedModel.exercisePerformance)}
    ${VolumeSection(resolvedModel.muscleVolume)}
    ${RecoverySection(resolvedModel.recovery)}
    ${CycleSection(resolvedModel.mesocycle)}
  </div>`;
}
