import { Card, StatTile } from '../../components/ui.js';

const bars = [34, 48, 42, 64, 52, 76, 58];

export function StatisticsScreen() {
  const summary = Card(`
    <div class="stats-grid stats-grid--wide">
      ${StatTile({ label: 'אימונים', value: '0', meta: '30 ימים' })}
      ${StatTile({ label: 'נפח כולל', value: '0', meta: 'ק״ג' })}
      ${StatTile({ label: 'זמן', value: '0', meta: 'שעות' })}
    </div>
  `, { className: 'summary-strip' });

  const chart = Card(`
    <div class="section-title"><div><span class="eyebrow">ACTIVITY</span><h3>עקביות שבועית</h3></div><span class="section-caption">7 שבועות</span></div>
    <div class="chart-placeholder" aria-label="תרשים דמו">
      <div class="chart-grid-lines" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="chart-bars">${bars.map((height, index) => `<span style="--h:${height}%;--delay:${index * 45}ms"></span>`).join('')}</div>
    </div>
    <p class="chart-note">התרשים כרגע הוא placeholder. בשלב הנתונים נחבר אותו לסטים ולאימונים אמיתיים.</p>
  `, { className: 'chart-card' });

  return `<div class="screen animate-enter">
    <header class="screen-header"><div><span class="eyebrow">STATISTICS</span><h1>סטטיסטיקה</h1><p>כל המגמות החשובות במקום אחד.</p></div></header>
    ${summary}
    ${chart}
  </div>`;
}
