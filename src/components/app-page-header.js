import { escapeHtml } from '../core/escape-html.js';

export function AppPageHeader({
  title,
  subtitle = '',
  rootClass = '',
  headingClass = '',
  subtitleAbove = false,
} = {}) {
  const safeTitle = escapeHtml(title || '');
  const safeSubtitle = escapeHtml(subtitle || '');

  return `<header class="app-page-header ios-navigation-title ${rootClass}" data-iron-page-header>
    <div class="app-page-heading ${headingClass}">
      <div class="app-page-heading__inner">
        ${subtitleAbove && safeSubtitle ? `<span class="app-page-subtitle app-page-subtitle--above">${safeSubtitle}</span>` : ''}
        <h1>${safeTitle}</h1>
        ${!subtitleAbove && safeSubtitle ? `<p class="app-page-subtitle">${safeSubtitle}</p>` : ''}
      </div>
    </div>
  </header>`;
}
