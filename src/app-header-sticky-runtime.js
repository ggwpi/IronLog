const ROOT_CLASS = 'iron-header-scrolled';
const ACTIVE_CLASS = 'is-iron-header-scrolled';
const GLOBAL_GLASS_ACTIVE_CLASS = 'is-active';
const HEADER_SELECTOR = '[data-iron-page-header],.app-page-header,.statistics-detail-topbar';
const GLOBAL_GLASS_ID = 'ironGlobalHeaderGlass';
let frame = 0;

function documentScrollTop() {
  return Math.max(
    window.scrollY || 0,
    document.documentElement?.scrollTop || 0,
    document.body?.scrollTop || 0,
  );
}

function canElementScroll(element) {
  if (!(element instanceof Element)) return false;
  const style = getComputedStyle(element);
  const overflowY = style.overflowY;
  const allowsScroll = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
  return allowsScroll && element.scrollHeight > element.clientHeight + 1;
}

function headerScrollRoot(header) {
  let node = header.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    if ((node.hasAttribute('data-iron-scroll-root') || canElementScroll(node)) && node.scrollHeight > node.clientHeight + 1) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

function scrollTopForHeader(header) {
  const root = headerScrollRoot(header);
  const nestedTop = root ? Math.max(0, Number(root.scrollTop || 0)) : 0;
  return Math.max(documentScrollTop(), nestedTop);
}

function ensureGlobalGlass() {
  let glass = document.getElementById(GLOBAL_GLASS_ID);
  if (glass) return glass;

  glass = document.createElement('div');
  glass.id = GLOBAL_GLASS_ID;
  glass.className = 'iron-global-header-glass';
  glass.dataset.ironGlobalHeaderGlass = '';
  glass.setAttribute('aria-hidden', 'true');
  document.body.append(glass);
  return glass;
}

function normalizeHeader(header) {
  header.classList.add('iron-page-header');
  if (!header.hasAttribute('data-iron-page-header')) header.setAttribute('data-iron-page-header', '');

  const root = headerScrollRoot(header);
  if (root && !root.hasAttribute('data-iron-scroll-root')) root.setAttribute('data-iron-scroll-root', '');
}

function isVisibleHeader(header) {
  if (!(header instanceof HTMLElement)) return false;
  const style = getComputedStyle(header);
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || 1) === 0) return false;
  const rect = header.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
}

function numericZIndex(element) {
  const value = Number.parseInt(getComputedStyle(element).zIndex, 10);
  return Number.isFinite(value) ? value : 0;
}

function topmostHeader(headers) {
  let winner = null;
  let winnerZ = -Infinity;

  headers.forEach((header) => {
    if (!header.classList.contains(ACTIVE_CLASS) || !isVisibleHeader(header)) return;
    const z = numericZIndex(header);
    if (!winner || z >= winnerZ) {
      winner = header;
      winnerZ = z;
    }
  });

  return winner;
}

function syncGlobalGlass(headers) {
  const glass = ensureGlobalGlass();
  const activeHeader = topmostHeader(headers);

  if (!activeHeader) {
    glass.classList.remove(GLOBAL_GLASS_ACTIVE_CLASS);
    glass.style.setProperty('--iron-global-header-height', '0px');
    return;
  }

  const rect = activeHeader.getBoundingClientRect();
  const style = getComputedStyle(activeHeader);
  const bottomCover = Number.parseFloat(style.getPropertyValue('--iron-header-glass-bottom-cover')) || 10;
  const viewportHeight = window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 0;
  const height = Math.max(0, Math.min(viewportHeight, Math.ceil(rect.bottom + bottomCover)));

  glass.style.setProperty('--iron-global-header-height', `${height}px`);
  glass.classList.add(GLOBAL_GLASS_ACTIVE_CLASS);
}

function syncHeaderState() {
  frame = 0;
  const headers = [...document.querySelectorAll(HEADER_SELECTOR)];
  let anyScrolled = false;

  headers.forEach((header) => {
    normalizeHeader(header);
    const scrolled = scrollTopForHeader(header) > 6;
    header.classList.toggle(ACTIVE_CLASS, scrolled);
    anyScrolled ||= scrolled;
  });

  document.documentElement.classList.toggle(ROOT_CLASS, anyScrolled);
  syncGlobalGlass(headers);
}

function scheduleSync() {
  if (frame) return;
  frame = requestAnimationFrame(syncHeaderState);
}

window.addEventListener('scroll', scheduleSync, { passive: true });
document.addEventListener('scroll', scheduleSync, { passive: true, capture: true });
window.visualViewport?.addEventListener('scroll', scheduleSync, { passive: true });
window.visualViewport?.addEventListener('resize', scheduleSync, { passive: true });
window.addEventListener('resize', scheduleSync, { passive: true });
window.addEventListener('orientationchange', scheduleSync, { passive: true });
window.addEventListener('pageshow', scheduleSync);
window.addEventListener('hashchange', scheduleSync);
window.addEventListener('popstate', scheduleSync);
window.addEventListener('ironlog:navigate', scheduleSync);

if (document.body) new MutationObserver(scheduleSync).observe(document.body, { childList: true, subtree: true });

scheduleSync();
