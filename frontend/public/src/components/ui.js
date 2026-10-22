export function Card(content, { className = '', interactive = false, attributes = '' } = {}) {
  const tag = interactive ? 'button' : 'section';
  const type = interactive ? ' type="button"' : '';
  return `<${tag}${type} class="card ${interactive ? 'card--interactive' : ''} ${className}" ${attributes}>${content}</${tag}>`;
}

export function Button(label, { variant = 'primary', icon = '', attributes = '', className = '' } = {}) {
  return `<button type="button" class="button button--${variant} ${className}" ${attributes}>${icon}<span>${label}</span></button>`;
}

export function Badge(label, { tone = 'neutral' } = {}) {
  return `<span class="badge badge--${tone}">${label}</span>`;
}

export function StatTile({ label, value, meta = '' }) {
  return `<div class="stat-tile"><span>${label}</span><strong>${value}</strong>${meta ? `<small>${meta}</small>` : ''}</div>`;
}

export function EmptyState({ icon = '', title, description, action = '' }) {
  return `<div class="empty-state">${icon}<h3>${title}</h3><p>${description}</p>${action}</div>`;
}
