const paths = {
  home: '<path d="M3 10.8 12 3l9 7.8v8.7a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H4.5A1.5 1.5 0 0 1 3 19.5z"/>',
  dumbbell: '<path d="M6.5 8.5v7m11-7v7M4 10v4m16-4v4M6.5 12h11M2.5 9.5h3v5h-3zm16 0h3v5h-3z"/>',
  chart: '<path d="M4 20V10m6 10V4m6 16v-7m4 7V7"/>',
  settings: '<path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"/><path d="m19.4 15 .1 2-2.1 1.2-1.7-1a7.8 7.8 0 0 1-1.8 1l-.4 2H10l-.4-2a7.7 7.7 0 0 1-1.8-1l-1.7 1L4 17l.1-2a8 8 0 0 1-1-1.8L1.5 12l1.6-1.2a8 8 0 0 1 1-1.8L4 7l2.1-1.2 1.7 1a8 8 0 0 1 1.8-1l.4-2h3.5l.4 2a8 8 0 0 1 1.8 1l1.7-1L19.5 7l-.1 2a8 8 0 0 1 1 1.8L22 12l-1.6 1.2a8 8 0 0 1-1 1.8Z"/>',
  arrow: '<path d="m9 18 6-6-6-6"/>',
  bolt: '<path d="M13 2 5.5 13H11l-1 9 8.5-12H13z"/>',
  calendar: '<path d="M6 3v3m12-3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  logout: '<path d="M10 4H5v16h5m4-4 4-4-4-4m4 4H9"/>',
  moon: '<path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 9 9 0 1 0 20.5 15.5Z"/>',
  motion: '<path d="M3 8h9M3 12h14M3 16h9M17 6l4 6-4 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
};

export function Icon(name, { size = 22, className = '' } = {}) {
  const content = paths[name] || paths.home;
  return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;
}
