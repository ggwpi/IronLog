const STYLE_ID = 'ironlog-statistics-detail-style';
let detailPage = null;
let ownsHistoryEntry = false;
let activePerformanceItems = [];

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const link = document.createElement('link');
  link.id = STYLE_ID;
  link.rel = 'stylesheet';
  link.href = '/src/features/statistics/statistics-detail.css?v=1';
  document.head.appendChild(link);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function text(element, fallback = '') {
  return element?.textContent?.replace(/\s+/g, ' ').trim() || fallback;
}

function numeric(value) {
  const match = String(value || '').replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function metric(value, label) {
  return `<div class="statistics-detail-metric"><strong>${escapeHtml(value || '—')}</strong><span>${escapeHtml(label)}</span></div>`;
}

function cloneSvg(element) {
  if (!element) return '';
  const clone = element.cloneNode(true);
  clone.removeAttribute('width');
  clone.removeAttribute('height');
  return clone.outerHTML;
}

function topbar(title) {
  return `<header class="statistics-detail-topbar">
    <button class="statistics-detail-back" type="button" data-stats-detail-close aria-label="חזרה לסטטיסטיקה">›</button>
    <div class="statistics-detail-title"><small>סטטיסטיקה</small><strong>${escapeHtml(title)}</strong></div>
    <span aria-hidden="true"></span>
  </header>`;
}

function shell(title, content) {
  return `<div class="statistics-detail-shell">${topbar(title)}${content}</div>`;
}

function weightDetail(section) {
  const current = text(section.querySelector('.native-weight-current strong'));
  const unit = text(section.querySelector('.native-weight-current span'), 'ק״ג');
  const status = text(section.querySelector('.native-weight-status b'));
  const target = text(section.querySelector('.native-weight-status span'));
  const delta = text(section.querySelector('.native-weight-delta strong'));
  const deltaLabel = text(section.querySelector('.native-weight-delta span'));
  const legend = text(section.querySelector('.native-chart-legend'));
  const chart = cloneSvg(section.querySelector('.native-weight-chart'));

  return shell('משקל גוף', `
    <section class="statistics-detail-hero">
      <span class="statistics-detail-kicker">מגמה מול טווח יעד</span>
      <h1>${escapeHtml(current)} ${escapeHtml(unit)}</h1>
      <p>${escapeHtml(status)} · ${escapeHtml(target)}</p>
      <div class="statistics-detail-metrics">
        ${metric(`${current} ${unit}`, 'ממוצע נוכחי')}
        ${metric(delta, deltaLabel || 'שינוי שבועי')}
        ${metric(status, 'מצב מול היעד')}
      </div>
    </section>
    <section class="statistics-detail-chart-panel">
      <div class="statistics-detail-section-label"><strong>גרף מלא</strong><span>כל המדידות הזמינות</span></div>
      <div class="statistics-detail-chart">${chart}</div>
      <p class="statistics-detail-note">${escapeHtml(legend || 'הקו מציג את המשקל בפועל והטווח המסומן מציג את טווח היעד לאורך התקופה.')}</p>
    </section>
    <section class="statistics-detail-list">
      <div class="statistics-detail-list__head"><strong>איך לקרוא את הגרף</strong><span>המסך המורחב משתמש באותם נתונים שמופיעים בסקירה</span></div>
      <div class="statistics-detail-selector">
        <button type="button"><span class="statistics-detail-selector__copy"><strong>משקל נוכחי</strong><span>ממוצע חלון המדידה האחרון</span></span><span class="statistics-detail-selector__value"><strong>${escapeHtml(current)} ${escapeHtml(unit)}</strong><span>${escapeHtml(status)}</span></span><i class="statistics-detail-selector__dot"></i></button>
        <button type="button"><span class="statistics-detail-selector__copy"><strong>טווח יעד</strong><span>היעד המחושב להיום</span></span><span class="statistics-detail-selector__value"><strong>${escapeHtml(target.replace(/^יעד\s*/, ''))}</strong><span>יעד</span></span><i class="statistics-detail-selector__dot"></i></button>
        <button type="button"><span class="statistics-detail-selector__copy"><strong>שינוי שבועי</strong><span>לעומת השבוע הקודם</span></span><span class="statistics-detail-selector__value"><strong>${escapeHtml(delta)}</strong><span>${escapeHtml(deltaLabel)}</span></span><i class="statistics-detail-selector__dot"></i></button>
      </div>
    </section>`);
}

function collectPerformance(section) {
  return [...section.querySelectorAll('.native-exercise-row')].map((row, index) => {
    const name = text(row.querySelector('.native-exercise-copy strong'), `תרגיל ${index + 1}`);
    const metricLabel = text(row.querySelector('.native-exercise-copy span'), '1RM משוער');
    const valueText = text(row.querySelector('.native-exercise-value > strong'));
    const deltaText = text(row.querySelector('.native-exercise-value > span'));
    const current = numeric(valueText);
    const deltaPct = numeric(deltaText);
    const baseline = current != null && deltaPct != null && Math.abs(1 + deltaPct / 100) > 0.001
      ? current / (1 + deltaPct / 100)
      : null;
    return {
      index,
      row,
      name,
      metricLabel,
      valueText,
      deltaText,
      current,
      deltaPct,
      baseline,
      sparkline: cloneSvg(row.querySelector('.native-sparkline')),
    };
  });
}

function performanceHero(item) {
  const trend = item.deltaPct == null ? 'אין שינוי מחושב'
    : item.deltaPct > 0 ? 'מגמת עלייה'
      : item.deltaPct < 0 ? 'מגמת ירידה' : 'ללא שינוי';
  const baseline = item.baseline == null ? '—' : `${item.baseline.toFixed(1)} ק״ג`;
  return `<section class="statistics-detail-hero" data-performance-hero>
    <span class="statistics-detail-kicker">${escapeHtml(item.metricLabel)}</span>
    <h1>${escapeHtml(item.name)}</h1>
    <p>${escapeHtml(trend)} לאורך הנתונים הזמינים</p>
    <div class="statistics-detail-metrics">
      ${metric(item.valueText, 'ערך נוכחי')}
      ${metric(item.deltaText, 'שינוי מההתחלה')}
      ${metric(baseline, 'תחילת התקופה')}
    </div>
  </section>`;
}

function performanceChart(item) {
  return `<section class="statistics-detail-chart-panel" data-performance-chart>
    <div class="statistics-detail-section-label"><strong>מגמת ביצועים</strong><span>${escapeHtml(item.metricLabel)}</span></div>
    <div class="statistics-detail-chart">${item.sparkline}</div>
    <div class="statistics-detail-axis-copy"><span>תחילת התקופה</span><span>היום</span></div>
    <p class="statistics-detail-note">הגרף המורחב מציג את אותה סדרת 1RM משוער מהסקירה, אבל בקנה מידה גדול יותר כדי שיהיה קל לראות שינויי כיוון.</p>
  </section>`;
}

function performanceSelector(items, selectedIndex) {
  return `<section class="statistics-detail-list">
    <div class="statistics-detail-list__head"><strong>כל התרגילים</strong><span>לחץ על תרגיל כדי להעביר את הגרף אליו</span></div>
    <div class="statistics-detail-selector" data-performance-selector>
      ${items.map((item) => `<button type="button" data-performance-index="${item.index}" class="${item.index === selectedIndex ? 'is-selected' : ''}">
        <span class="statistics-detail-selector__copy"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.metricLabel)}</span></span>
        <span class="statistics-detail-selector__value"><strong>${escapeHtml(item.valueText)}</strong><span>${escapeHtml(item.deltaText)}</span></span>
        <i class="statistics-detail-selector__dot"></i>
      </button>`).join('')}
    </div>
  </section>`;
}

function performanceDetail(section, focusedRow) {
  activePerformanceItems = collectPerformance(section);
  if (!activePerformanceItems.length) return shell('ביצועי תרגילים', '<section class="statistics-detail-hero"><h1>אין נתונים להצגה</h1></section>');
  let selectedIndex = 0;
  if (focusedRow) {
    const found = activePerformanceItems.find((item) => item.row === focusedRow);
    if (found) selectedIndex = found.index;
  }
  const selected = activePerformanceItems[selectedIndex] || activePerformanceItems[0];
  return shell('ביצועי תרגילים', `${performanceHero(selected)}${performanceChart(selected)}${performanceSelector(activePerformanceItems, selected.index)}`);
}

function volumeDetail(section, focusedRow) {
  const rows = [...section.querySelectorAll('.native-volume-row')];
  const statuses = rows.map((row) => row.dataset.status || 'low');
  const inRange = statuses.filter((status) => status === 'ok').length;
  const below = statuses.filter((status) => status === 'low').length;
  const above = statuses.filter((status) => status === 'high').length;
  const clones = rows.map((row) => {
    const clone = row.cloneNode(true);
    clone.classList.toggle('is-focused', row === focusedRow);
    return clone.outerHTML;
  }).join('');
  return shell('נפח לפי שריר', `
    <section class="statistics-detail-hero">
      <span class="statistics-detail-kicker">סטים אפקטיביים מול טווח היעד</span>
      <h1>נפח האימון השבועי</h1>
      <p>כל קבוצות השריר מוצגות כאן יחד, כולל אלו שנמצאות מתחת או מעל לטווח.</p>
      <div class="statistics-detail-volume-summary">
        <div><strong>${inRange}</strong><span>בטווח</span></div>
        <div><strong>${below}</strong><span>מתחת</span></div>
        <div><strong>${above}</strong><span>מעל</span></div>
      </div>
    </section>
    <section class="statistics-detail-list">
      <div class="statistics-detail-list__head"><strong>כל קבוצות השריר</strong><span>הפס הצבעוני הוא הנפח בפועל והאזור המסומן הוא טווח היעד</span></div>
      <div class="statistics-detail-volume-list">${clones}</div>
    </section>`);
}

function setPerformanceSelection(page, index) {
  const item = activePerformanceItems.find((entry) => entry.index === index);
  if (!item) return;
  const hero = page.querySelector('[data-performance-hero]');
  const chart = page.querySelector('[data-performance-chart]');
  if (hero) hero.outerHTML = performanceHero(item);
  if (chart) chart.outerHTML = performanceChart(item);
  page.querySelectorAll('[data-performance-index]').forEach((button) => {
    button.classList.toggle('is-selected', Number(button.dataset.performanceIndex) === index);
  });
  page.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

function prefersReducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion');
}

function renderDetail(kind, source, focusedRow = null) {
  if (kind === 'weight') return weightDetail(source);
  if (kind === 'performance') return performanceDetail(source, focusedRow);
  if (kind === 'volume') return volumeDetail(source, focusedRow);
  return '';
}

function closeDetail({ fromHistory = false } = {}) {
  if (!detailPage) return;
  const page = detailPage;
  detailPage = null;
  activePerformanceItems = [];
  if (!fromHistory && ownsHistoryEntry) {
    ownsHistoryEntry = false;
    history.back();
  } else {
    ownsHistoryEntry = false;
  }
  page.classList.add('is-closing');
  page.classList.remove('is-visible');
  window.setTimeout(() => page.remove(), prefersReducedMotion() ? 0 : 300);
}

function openDetail(kind, source, focusedRow = null) {
  if (!source || detailPage) return;
  ensureStyles();
  const content = renderDetail(kind, source, focusedRow);
  if (!content) return;
  const page = document.createElement('main');
  page.className = 'statistics-detail-page';
  page.dataset.statsDetailPage = kind;
  page.setAttribute('aria-label', kind === 'weight' ? 'פירוט משקל גוף' : kind === 'performance' ? 'פירוט ביצועי תרגילים' : 'פירוט נפח לפי שריר');
  page.innerHTML = content;
  document.body.appendChild(page);
  detailPage = page;
  requestAnimationFrame(() => requestAnimationFrame(() => page.classList.add('is-visible')));
  history.pushState({ ...(history.state || {}), ironlogStatisticsDetail: kind }, '', location.href);
  ownsHistoryEntry = true;
}

function decorateOverview() {
  const page = document.querySelector('.statistics-page--native');
  if (!page) return;
  const weight = page.querySelector('.native-weight-section');
  const performance = page.querySelector('[data-stats-key="performance"]');
  const volume = page.querySelector('[data-stats-key="volume"]');
  if (weight) {
    weight.classList.add('is-detail-section');
    weight.dataset.statisticsDetail = 'weight';
    weight.tabIndex = 0;
    weight.setAttribute('role', 'button');
    weight.setAttribute('aria-label', 'פתח פירוט משקל גוף');
  }
  [performance, volume].forEach((section) => {
    if (!section) return;
    section.classList.add('is-detail-section');
    section.querySelector('.native-stats-section__head')?.setAttribute('tabindex', '0');
    section.querySelector('.native-stats-section__head')?.setAttribute('role', 'button');
  });
  if (performance) performance.dataset.statisticsDetail = 'performance';
  if (volume) volume.dataset.statisticsDetail = 'volume';
}

function openFromTarget(target) {
  const page = target.closest('.statistics-page--native');
  if (!page || target.closest('.native-disclosure > summary')) return false;
  const weight = target.closest('.native-weight-section');
  if (weight) {
    openDetail('weight', weight);
    return true;
  }
  const performance = target.closest('[data-stats-key="performance"]');
  if (performance) {
    const row = target.closest('.native-exercise-row');
    if (row || target.closest('.native-stats-section__head')) {
      openDetail('performance', performance, row);
      return true;
    }
  }
  const volume = target.closest('[data-stats-key="volume"]');
  if (volume) {
    const row = target.closest('.native-volume-row');
    if (row || target.closest('.native-stats-section__head')) {
      openDetail('volume', volume, row);
      return true;
    }
  }
  return false;
}

document.addEventListener('click', (event) => {
  if (detailPage) {
    if (event.target.closest('[data-stats-detail-close]')) {
      event.preventDefault();
      closeDetail();
      return;
    }
    const exercise = event.target.closest('[data-performance-index]');
    if (exercise) {
      event.preventDefault();
      setPerformanceSelection(detailPage, Number(exercise.dataset.performanceIndex));
    }
    return;
  }
  if (openFromTarget(event.target)) event.preventDefault();
}, true);

document.addEventListener('keydown', (event) => {
  if (detailPage) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDetail();
    }
    return;
  }
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const target = event.target;
  if (target.matches('.native-weight-section,[data-stats-key="performance"] .native-stats-section__head,[data-stats-key="volume"] .native-stats-section__head')) {
    event.preventDefault();
    openFromTarget(target);
  }
});

window.addEventListener('popstate', () => {
  if (detailPage) closeDetail({ fromHistory: true });
});
window.addEventListener('hashchange', () => {
  if (detailPage && !location.hash.includes('statistics')) closeDetail({ fromHistory: true });
});

const appRoot = document.querySelector('#app');
if (appRoot) new MutationObserver(decorateOverview).observe(appRoot, { childList: true, subtree: true });
ensureStyles();
decorateOverview();
