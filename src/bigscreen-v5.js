(() => {
  'use strict';
  if (window.__IRONLOG_V6_LOADER__) return;
  window.__IRONLOG_V6_LOADER__ = true;
  const v6 = document.createElement('script');
  v6.src = '/src/bigscreen-v6.js?v=6';
  v6.defer = true;
  v6.addEventListener('load', () => {
    const clean = document.createElement('script');
    clean.src = '/src/bigscreen-v7.js?v=7';
    clean.defer = true;
    document.head.appendChild(clean);
  }, { once:true });
  document.head.appendChild(v6);
})();
