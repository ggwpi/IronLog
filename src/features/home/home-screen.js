import { Card, Badge, StatTile } from '../../components/ui.js';
import { Icon } from '../../components/icons.js';
import { escapeHtml } from '../../core/escape-html.js';

export function HomeScreen({ userName = 'מתאמן' } = {}) {
  const safeName = escapeHtml(userName);
  const hero = Card(`
    <div class="hero-card__copy">
      ${Badge('READY TO TRAIN', { tone: 'accent' })}
      <h2>האימון הבא מתחיל<br><em>כשאתה מוכן.</em></h2>
      <p>בקרוב נכניס לכאן את התוכנית שלך, סטים, מנוחות והתקדמות.</p>
      <button class="button button--primary" type="button" data-route="workouts">${Icon('bolt', { size: 19 })}<span>פתח אימונים</span></button>
    </div>
    <div class="hero-orbit" aria-hidden="true"><div class="hero-orbit__ring"></div><div class="hero-orbit__core">IL</div></div>
  `, { className: 'hero-card' });

  const activity = Card(`
    <div class="section-title"><div><span class="eyebrow">OVERVIEW</span><h3>השבוע שלך</h3></div><span class="section-caption">נתוני דמו</span></div>
    <div class="stats-grid">
      ${StatTile({ label: 'אימונים', value: '0', meta: 'השבוע' })}
      ${StatTile({ label: 'זמן אימון', value: '0', meta: 'דקות' })}
      ${StatTile({ label: 'רצף', value: '—', meta: 'ימים' })}
    </div>
  `, { className: 'overview-card' });

  const quick = Card(`
    <div class="quick-row__icon">${Icon('calendar', { size: 22 })}</div>
    <div class="quick-row__copy"><strong>אין אימון מתוכנן להיום</strong><span>נוסיף בניית תוכנית בשלב הבא.</span></div>
    <div class="quick-row__arrow">${Icon('arrow', { size: 20 })}</div>
  `, { className: 'quick-row', interactive: true, attributes: 'data-route="workouts"' });

  return `<div class="screen animate-enter">
    <header class="screen-header">
      <div><span class="eyebrow">IRONLOG</span><h1>ערב טוב, ${safeName}</h1></div>
      <div class="avatar">${safeName.slice(0, 1)}</div>
    </header>
    ${hero}
    ${activity}
    <div class="section-title section-title--outside"><div><span class="eyebrow">NEXT UP</span><h3>פעולות מהירות</h3></div></div>
    ${quick}
  </div>`;
}
