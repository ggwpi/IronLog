import { Icon } from './icons.js';

const items = [
  ['home', 'בית', 'home'],
  ['workouts', 'אימונים', 'dumbbell'],
  ['statistics', 'סטטיסטיקה', 'chart'],
  ['settings', 'פרופיל', 'user'],
];

export function BottomNav(activeRoute) {
  return `<nav class="bottom-nav ios-tab-bar" aria-label="ניווט ראשי">
    ${items.map(([route, label, icon]) => `
      <button type="button" class="nav-item ${activeRoute === route ? 'is-active' : ''}" data-route="${route}" aria-current="${activeRoute === route ? 'page' : 'false'}" aria-label="${label}">
        ${Icon(icon, { size: 22 })}<span>${label}</span>
      </button>`).join('')}
  </nav>`;
}
