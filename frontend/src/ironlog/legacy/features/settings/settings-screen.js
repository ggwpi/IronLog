import { Card } from '../../components/ui.js';
import { Icon } from '../../components/icons.js';
import { AppPageHeader } from '../../components/app-page-header.js';
import { escapeHtml } from '../../core/escape-html.js';

function SettingRow({ icon, title, description, control }) {
  return `<div class="setting-row"><div class="setting-row__icon">${Icon(icon, { size: 20 })}</div><div class="setting-row__copy"><strong>${title}</strong><span>${description}</span></div>${control}</div>`;
}

export function SettingsScreen({ user, settings }) {
  const safeName = escapeHtml(user?.name || 'IronLog User');
  const safeEmail = escapeHtml(user?.email || '');
  return `<div class="screen settings-page animate-enter">
    ${AppPageHeader({
      title: 'הגדרות',
      subtitle: 'העדפות. חשבון. אפליקציה.',
      rootClass: 'screen-header settings-app-header',
      brandClass: 'settings-brand',
      headingClass: 'settings-heading',
    })}

    ${Card(`
      <div class="profile-row"><div class="avatar avatar--large">${safeName.slice(0, 1)}</div><div><strong>${safeName}</strong><span>${safeEmail}</span></div></div>
    `, { className: 'settings-card' })}

    ${Card(`
      ${SettingRow({ icon: 'moon', title: 'מצב כהה', description: 'ערכת הנושא הראשית של IronLog', control: '<span class="status-pill">פעיל</span>' })}
      ${SettingRow({ icon: 'motion', title: 'צמצום אנימציות', description: 'מפחית תנועה ומעברים בממשק', control: `<label class="switch"><input id="reduceMotionToggle" type="checkbox" ${settings.reduceMotion ? 'checked' : ''}><span></span></label>` })}
    `, { className: 'settings-card settings-list' })}

    <button type="button" class="logout-button" id="logoutButton">${Icon('logout', { size: 20 })}<span>התנתק</span></button>
  </div>`;
}
