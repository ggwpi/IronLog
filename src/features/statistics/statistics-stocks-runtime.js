const STYLE_ID = 'ironlog-statistics-stocks-style';
const ENHANCED_ATTR = 'stocksInteractive';
const SVG_NS = 'http://www.w3.org/2000/svg';

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const link = document.createElement('link');
  link.id = STYLE_ID;
  link.rel = 'stylesheet';
  link.href = '/src/features/statistics/statistics-stocks.css?v=1';
  document.head.appendChild(link);
}

function numeric(value) {
  const match = String(value ?? '').replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function formatKg(value) {
  return Number.isFinite(value) ? `${value.toFixed(1)} ק״ג` : '—';
}

function signed(value, digits = 1) {
  if (!Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${Math.abs(value).toFixed(digits)}`;
}

function parsePathPoints(path) {
  const values = (path?.getAttribute('d') || '').match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
  const points = [];
  for (let index = 0; index + 1 < values.length; index += 2) {
    points.push({ x: values[index], y: values[index + 1] });
  }
  return points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

function recoverSeries(points, current, baseline) {
  if (points.length < 2 || !Number.isFinite(current)) return [];

  // Sparkline() uses top=3, height=34 and an integer y-domain derived from
  // floor(min*0.9) / ceil(max*1.1). Recovering that domain lets the detail
  // runtime expose the original values without duplicating chart data in DOM.
  const normalized = points.map((point) => (37 - point.y) / 34);
  const lastT = normalized.at(-1);
  let best = null;

  for (let span = 1; span <= 1000; span += 1) {
    const minFloat = current - lastT * span;
    const domainMin = Math.round(minFloat);
    if (Math.abs(minFloat - domainMin) > 0.34) continue;
    const domainMax = domainMin + span;
    const series = normalized.map((t) => domainMin + t * span);
    const seriesMin = Math.min(...series);
    const seriesMax = Math.max(...series);
    const expectedMin = Math.floor(seriesMin * 0.9);
    const rawMax = Math.ceil(seriesMax * 1.1);
    const expectedMax = rawMax === expectedMin ? expectedMin + 10 : rawMax;
    if (expectedMin !== domainMin || expectedMax !== domainMax) continue;

    const lastError = Math.abs(series.at(-1) - current);
    if (lastError > 0.35) continue;
    const baselineError = Number.isFinite(baseline) ? Math.abs(series[0] - baseline) : 0;
    const score = lastError * 4 + baselineError;
    if (!best || score < best.score) best = { score, series };
  }

  if (best) return best.series.map((value) => Math.round(value * 10) / 10);

  const firstY = points[0].y;
  const lastY = points.at(-1).y;
  if (Number.isFinite(baseline) && Math.abs(lastY - firstY) > 0.001) {
    const slope = (current - baseline) / (lastY - firstY);
    return points.map((point) => Math.round((baseline + (point.y - firstY) * slope) * 10) / 10);
  }

  return points.map((_, index) => index === points.length - 1 ? current : null);
}

function svgElement(name, attrs = {}) {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
}

function localPoint(svg, clientX, clientY) {
  const matrix = svg.getScreenCTM();
  if (!matrix) return null;
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  return point.matrixTransform(matrix.inverse());
}

function nearestIndex(svg, points, clientX, clientY) {
  const local = localPoint(svg, clientX, clientY);
  if (!local) return 0;
  let bestIndex = 0;
  let bestDistance = Infinity;
  points.forEach((point, index) => {
    const distance = Math.abs(point.x - local.x);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function metricNodes(page) {
  return [...page.querySelectorAll('[data-performance-hero] .statistics-detail-metric strong')];
}

function ensureQuote(page) {
  const hero = page.querySelector('[data-performance-hero]');
  if (!hero) return null;
  let quote = hero.querySelector('.stocks-performance-quote');
  if (!quote) {
    quote = document.createElement('div');
    quote.className = 'stocks-performance-quote';
    quote.innerHTML = '<strong data-stocks-quote-value>—</strong><span data-stocks-quote-change>—</span>';
    const metrics = hero.querySelector('.statistics-detail-metrics');
    hero.insertBefore(quote, metrics || null);
  }
  return quote;
}

function currentHeroValues(page) {
  const metrics = metricNodes(page);
  return {
    current: numeric(metrics[0]?.textContent),
    baseline: numeric(metrics[2]?.textContent),
    deltaText: metrics[1]?.textContent?.trim() || '',
  };
}

function setQuote(page, value, changeText) {
  const quote = ensureQuote(page);
  if (!quote) return;
  const valueNode = quote.querySelector('[data-stocks-quote-value]');
  const changeNode = quote.querySelector('[data-stocks-quote-change]');
  if (valueNode) valueNode.textContent = formatKg(value);
  if (changeNode) changeNode.textContent = changeText || '—';
}

function defaultChangeText(values) {
  if (!values.length || !Number.isFinite(values[0]) || !Number.isFinite(values.at(-1))) return 'הנתון האחרון';
  const delta = values.at(-1) - values[0];
  const pct = values[0] ? delta / values[0] * 100 : 0;
  return `${signed(delta)} ק״ג  ·  ${signed(pct)}% מהתחלה`;
}

function fixBackButton(page) {
  const back = page.querySelector('.statistics-detail-back');
  if (!back || back.dataset.stocksArrow === 'true') return;
  back.dataset.stocksArrow = 'true';
  back.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 4.5 16 12l-7.5 7.5"/></svg>';
}

function selectionLayer(svg) {
  let layer = svg.querySelector('[data-stocks-selection-layer]');
  if (!layer) {
    layer = svgElement('g', { 'data-stocks-selection-layer': 'true' });
    svg.appendChild(layer);
  }
  return layer;
}

function clearLayer(layer) {
  while (layer.firstChild) layer.firstChild.remove();
}

function drawSelection(svg, points, indices) {
  const layer = selectionLayer(svg);
  clearLayer(layer);
  const viewBox = svg.viewBox.baseVal;
  const top = viewBox?.y ?? 0;
  const bottom = (viewBox?.y ?? 0) + (viewBox?.height || 40);
  const selected = [...new Set(indices)].sort((a, b) => a - b);

  if (selected.length === 2) {
    const x1 = points[selected[0]].x;
    const x2 = points[selected[1]].x;
    layer.appendChild(svgElement('rect', {
      x: Math.min(x1, x2), y: top, width: Math.max(0.01, Math.abs(x2 - x1)), height: bottom - top,
      class: 'stocks-chart-range',
    }));
  }

  selected.forEach((index, order) => {
    const point = points[index];
    layer.appendChild(svgElement('line', {
      x1: point.x, x2: point.x, y1: top, y2: bottom,
      class: order ? 'stocks-chart-crosshair stocks-chart-crosshair--secondary' : 'stocks-chart-crosshair',
    }));
    layer.appendChild(svgElement('circle', {
      cx: point.x, cy: point.y, r: 5.1,
      class: 'stocks-chart-focus-halo',
    }));
    layer.appendChild(svgElement('circle', {
      cx: point.x, cy: point.y, r: 2.8,
      class: 'stocks-chart-focus-dot',
    }));
  });
}

function ensureReadout(chart) {
  let readout = chart.querySelector('.stocks-chart-readout');
  if (!readout) {
    readout = document.createElement('div');
    readout.className = 'stocks-chart-readout';
    readout.innerHTML = '<span></span><strong></strong><em></em>';
    chart.appendChild(readout);
  }
  return readout;
}

function showOnePoint(page, chart, svg, points, values, index) {
  const value = values[index];
  const first = values.find((item) => Number.isFinite(item));
  const delta = Number.isFinite(value) && Number.isFinite(first) ? value - first : null;
  const pct = Number.isFinite(delta) && first ? delta / first * 100 : null;
  drawSelection(svg, points, [index]);
  setQuote(page, value, Number.isFinite(delta) ? `${signed(delta)} ק״ג  ·  ${signed(pct)}% מהתחלה` : 'ערך בנקודה שנבחרה');
  const readout = ensureReadout(chart);
  readout.querySelector('span').textContent = `מדידה ${index + 1} מתוך ${points.length}`;
  readout.querySelector('strong').textContent = formatKg(value);
  readout.querySelector('em').textContent = Number.isFinite(delta) ? `${signed(delta)} ק״ג מהתחלה` : '';
}

function showTwoPoints(page, chart, svg, points, values, firstIndex, secondIndex) {
  const a = Math.min(firstIndex, secondIndex);
  const b = Math.max(firstIndex, secondIndex);
  const first = values[a];
  const second = values[b];
  const delta = Number.isFinite(first) && Number.isFinite(second) ? second - first : null;
  const pct = Number.isFinite(delta) && first ? delta / first * 100 : null;
  drawSelection(svg, points, [a, b]);
  setQuote(page, delta, Number.isFinite(delta) ? `${signed(pct)}% בין שתי המדידות` : 'השוואת שתי נקודות');
  const readout = ensureReadout(chart);
  readout.querySelector('span').textContent = `מדידות ${a + 1}–${b + 1}`;
  readout.querySelector('strong').textContent = Number.isFinite(delta) ? `${signed(delta)} ק״ג` : '—';
  readout.querySelector('em').textContent = Number.isFinite(pct) ? `${signed(pct)}% שינוי` : '';
}

function resetChart(page, chart, svg, values) {
  chart.classList.remove('is-scrubbing', 'is-comparing');
  clearLayer(selectionLayer(svg));
  const readout = chart.querySelector('.stocks-chart-readout');
  if (readout) readout.classList.remove('is-visible');
  const current = values.findLast?.((value) => Number.isFinite(value)) ?? [...values].reverse().find((value) => Number.isFinite(value));
  setQuote(page, current, defaultChangeText(values));
}

function addHint(panel) {
  if (panel.querySelector('.stocks-chart-hint')) return;
  const hint = document.createElement('div');
  hint.className = 'stocks-chart-hint';
  hint.innerHTML = '<span>לחיצה ארוכה + גרירה</span><span>שתי אצבעות להשוואה</span>';
  const axis = panel.querySelector('.statistics-detail-axis-copy');
  if (axis) axis.insertAdjacentElement('afterend', hint);
  else panel.querySelector('.statistics-detail-chart')?.insertAdjacentElement('afterend', hint);
}

function enhancePerformanceChart(page) {
  if (!page || page.dataset.statsDetailPage !== 'performance') return;
  fixBackButton(page);
  const panel = page.querySelector('[data-performance-chart]');
  const chart = panel?.querySelector('.statistics-detail-chart');
  const svg = chart?.querySelector('.native-sparkline');
  const path = svg?.querySelector('path');
  if (!panel || !chart || !svg || !path || chart.dataset[ENHANCED_ATTR] === 'true') return;

  chart.dataset[ENHANCED_ATTR] = 'true';
  chart.setAttribute('aria-label', 'גרף ביצועים אינטראקטיבי. לחץ לחיצה ארוכה וגרור כדי לבדוק כל מדידה.');
  svg.setAttribute('aria-hidden', 'true');
  const points = parsePathPoints(path);
  if (points.length < 2) return;

  const hero = currentHeroValues(page);
  const values = recoverSeries(points, hero.current, hero.baseline);
  setQuote(page, hero.current, defaultChangeText(values));
  addHint(panel);

  let holdTimer = null;
  let active = false;
  let mode = 1;
  let startTouches = [];
  let lastTouches = [];

  const clearHold = () => {
    if (holdTimer) window.clearTimeout(holdTimer);
    holdTimer = null;
  };

  const update = (touches) => {
    if (!touches.length) return;
    const readout = ensureReadout(chart);
    readout.classList.add('is-visible');
    if (touches.length >= 2) {
      mode = 2;
      chart.classList.add('is-comparing');
      const firstIndex = nearestIndex(svg, points, touches[0].clientX, touches[0].clientY);
      const secondIndex = nearestIndex(svg, points, touches[1].clientX, touches[1].clientY);
      showTwoPoints(page, chart, svg, points, values, firstIndex, secondIndex);
    } else {
      mode = 1;
      chart.classList.remove('is-comparing');
      const index = nearestIndex(svg, points, touches[0].clientX, touches[0].clientY);
      showOnePoint(page, chart, svg, points, values, index);
    }
  };

  const activate = () => {
    holdTimer = null;
    if (!lastTouches.length) return;
    active = true;
    chart.classList.add('is-scrubbing');
    update(lastTouches);
    if (navigator.vibrate) navigator.vibrate(6);
  };

  chart.addEventListener('touchstart', (event) => {
    if (!event.touches.length || event.touches.length > 2) return;
    clearHold();
    lastTouches = [...event.touches].map((touch) => ({ clientX: touch.clientX, clientY: touch.clientY }));
    startTouches = lastTouches.map((touch) => ({ ...touch }));
    if (active) {
      update(lastTouches);
      return;
    }
    holdTimer = window.setTimeout(activate, 180);
  }, { passive: true });

  chart.addEventListener('touchmove', (event) => {
    lastTouches = [...event.touches].slice(0, 2).map((touch) => ({ clientX: touch.clientX, clientY: touch.clientY }));
    if (active) {
      if (event.cancelable) event.preventDefault();
      update(lastTouches);
      return;
    }
    if (!startTouches.length || !lastTouches.length) return;
    const dx = lastTouches[0].clientX - startTouches[0].clientX;
    const dy = lastTouches[0].clientY - startTouches[0].clientY;
    if (Math.hypot(dx, dy) > 11) clearHold();
  }, { passive: false });

  const finishTouch = () => {
    clearHold();
    startTouches = [];
    lastTouches = [];
    if (!active) return;
    active = false;
    mode = 1;
    resetChart(page, chart, svg, values);
  };
  chart.addEventListener('touchend', finishTouch, { passive: true });
  chart.addEventListener('touchcancel', finishTouch, { passive: true });

  let mouseDown = false;
  chart.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    mouseDown = true;
    active = true;
    chart.classList.add('is-scrubbing');
    update([{ clientX: event.clientX, clientY: event.clientY }]);
  });
  chart.addEventListener('mousemove', (event) => {
    if (!mouseDown) return;
    update([{ clientX: event.clientX, clientY: event.clientY }]);
  });
  const finishMouse = () => {
    if (!mouseDown) return;
    mouseDown = false;
    active = false;
    resetChart(page, chart, svg, values);
  };
  chart.addEventListener('mouseup', finishMouse);
  chart.addEventListener('mouseleave', finishMouse);
}

function enhance() {
  ensureStyles();
  document.querySelectorAll('.statistics-detail-page').forEach((page) => {
    fixBackButton(page);
    enhancePerformanceChart(page);
  });
}

let queued = false;
function scheduleEnhance() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    enhance();
  });
}

new MutationObserver(scheduleEnhance).observe(document.body, { childList: true, subtree: true });
window.addEventListener('pageshow', scheduleEnhance);
window.addEventListener('ironlog:navigate', scheduleEnhance);
ensureStyles();
scheduleEnhance();
