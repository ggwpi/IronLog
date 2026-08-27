const PERFORMANCE_PAGE = '.statistics-detail-page[data-stats-detail-page="performance"]';

function numeric(value) {
  const match = String(value ?? '').replace(',', '.').match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function signedDelta(text) {
  const raw = String(text ?? '').trim();
  const magnitude = numeric(raw);
  if (!Number.isFinite(magnitude)) return null;
  if (raw.includes('▼') || raw.includes('↓') || raw.includes('−') || /(^|\s)-\s*\d/.test(raw)) return -Math.abs(magnitude);
  if (raw.includes('▲') || raw.includes('↑') || raw.includes('+')) return Math.abs(magnitude);
  return magnitude;
}

function repairTrend(page) {
  const metrics = [...page.querySelectorAll('[data-performance-hero] .statistics-detail-metric strong')];
  if (metrics.length < 3) return;

  const current = numeric(metrics[0]?.textContent);
  const deltaPct = signedDelta(metrics[1]?.textContent);
  if (!Number.isFinite(deltaPct)) return;

  page.dataset.stocksTrend = deltaPct < -0.001 ? 'down' : deltaPct > 0.001 ? 'up' : 'flat';

  if (!Number.isFinite(current)) return;
  const divisor = 1 + deltaPct / 100;
  if (Math.abs(divisor) < 0.001) return;
  const baseline = current / divisor;
  if (Number.isFinite(baseline)) metrics[2].textContent = `${baseline.toFixed(1)} ק״ג`;
}

function repairAll() {
  document.querySelectorAll(PERFORMANCE_PAGE).forEach(repairTrend);
}

let queued = false;
function scheduleRepair() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    repairAll();
  });
}

new MutationObserver(scheduleRepair).observe(document.body, { childList: true, subtree: true, characterData: true });
window.addEventListener('pageshow', scheduleRepair);
window.addEventListener('ironlog:navigate', scheduleRepair);
repairAll();
