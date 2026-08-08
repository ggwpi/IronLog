import { Icon } from './icons.js';

const items = [
  ['home', 'בית', 'home'],
  ['workouts', 'אימונים', 'dumbbell'],
  ['statistics', 'סטטיסטיקה', 'chart'],
  ['settings', 'הגדרות', 'settings'],
];

export function BottomNav(activeRoute) {
  return `<nav class="bottom-nav" aria-label="ניווט ראשי">
    <div class="nav-highlight" aria-hidden="true" style="--index:${items.findIndex(([route]) => route === activeRoute)}"></div>
    ${items.map(([route, label, icon]) => `
      <button type="button" class="nav-item ${activeRoute === route ? 'is-active' : ''}" data-route="${route}" aria-current="${activeRoute === route ? 'page' : 'false'}">
        ${Icon(icon, { size: 21 })}<span>${label}</span>
      </button>`).join('')}
  </nav>`;
}
