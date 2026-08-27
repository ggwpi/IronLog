const ROOT_CLASS = 'iron-header-scrolled';
const ACTIVE_CLASS = 'is-iron-header-scrolled';
const HEADER_SELECTOR = '[data-iron-page-header],.app-page-header,.statistics-detail-topbar';
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
  /* Use the maximum so a harmless overflow declaration can never mask actual
     document scrolling. Full-screen nested pages still work because their own
     scrollTop wins while documentScrollTop() stays at zero. */
  return Math.max(documentScrollTop(), nestedTop);
}

function ensureGlassLayer(header) {
  let glass = header.querySelector(':scope > [data-iron-header-glass]');
  if (glass) return glass;
  glass = document.createElement('span');
  glass.className = 'iron-header-glass';
  glass.dataset.ironHeaderGlass = '';
  glass.setAttribute('aria-hidden', 'true');
  header.prepend(glass);
  return glass;
}

function normalizeHeader(header) {
  header.classList.add('iron-page-header');
  if (!header.hasAttribute('data-iron-page-header')) header.setAttribute('data-iron-page-header', '');
  ensureGlassLayer(header);

  const root = headerScrollRoot(header);
  if (root && !root.hasAttribute('data-iron-scroll-root')) root.setAttribute('data-iron-scroll-root', '');
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
window.addEventListener('pageshow', scheduleSync);
window.addEventListener('hashchange', scheduleSync);
window.addEventListener('popstate', scheduleSync);
window.addEventListener('ironlog:navigate', scheduleSync);

/* Observe the whole body because full-screen/detail pages may be mounted next
   to #app. The same runtime upgrades them to the same header component. */
if (document.body) new MutationObserver(scheduleSync).observe(document.body, { childList: true, subtree: true });

scheduleSync();
