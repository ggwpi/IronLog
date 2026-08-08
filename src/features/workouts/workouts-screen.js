import { Card, Button, EmptyState } from '../../components/ui.js';
import { Icon } from '../../components/icons.js';

export function WorkoutsScreen() {
  const empty = Card(EmptyState({
    icon: `<div class="empty-state__icon">${Icon('dumbbell', { size: 30 })}</div>`,
    title: 'עוד אין אימונים',
    description: 'זה יהיה המקום לתוכנית האימונים, בחירת יום, תרגילים ומעקב בזמן אמת.',
    action: Button('צור אימון ראשון', { icon: Icon('plus', { size: 18 }), attributes: 'data-demo-action="new-workout"' }),
  }), { className: 'empty-card' });

  return `<div class="screen animate-enter">
    <header class="screen-header screen-header--stacked">
      <div><span class="eyebrow">WORKOUTS</span><h1>אימונים</h1><p>ניהול פשוט וברור של כל תוכנית האימונים.</p></div>
      ${Button('אימון חדש', { variant: 'secondary', icon: Icon('plus', { size: 18 }), attributes: 'data-demo-action="new-workout"' })}
    </header>
    ${empty}
  </div>`;
}
