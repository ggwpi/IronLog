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
    if (node.hasAttribute('data-iron-scroll-root') || canElementScroll(node)) {
      if (node.scrollHeight > node.clientHeight + 1) return node;
    }
    node = node.parentElement;
  }
  return null;
}

function scrollTopForHeader(header) {
  const root = headerScrollRoot(header);
  return root ? Math.max(0, Number(root.scrollTop || 0)) : documentScrollTop();
}

function normalizeHeader(header) {
  header.classList.add('iron-page-header');
  if (!header.hasAttribute('data-iron-page-header')) header.setAttribute('data-iron-page-header', '');

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
   to #app. The same runtime then upgrades them to the exact same header system. */
if (document.body) new MutationObserver(scheduleSync).observe(document.body, { childList: true, subtree: true });

scheduleSync();
