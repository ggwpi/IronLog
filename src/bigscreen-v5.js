(() => {
  'use strict';
  if (window.__IRONLOG_V6_LOADER__) return;
  window.__IRONLOG_V6_LOADER__ = true;
  const script = document.createElement('script');
  script.src = '/src/bigscreen-v6.js?v=6';
  script.defer = true;
  document.head.appendChild(script);
})();
