import { AnatomyVisual } from '../../components/anatomy-visual.js';
import { escapeHtml } from '../../core/escape-html.js';
import { WORKOUTS } from './workout-catalog.js';

function WorkoutCard(workout) {
  const targetLabel = workout.targets.join(' · ');
  const anatomyLabel = `שרירי המטרה: ${workout.targets.join(', ')}`;

  return `<article class="workout-card" data-workout-id="${escapeHtml(workout.id)}">
    <div class="workout-card__visual">
      ${AnatomyVisual({ assetId: workout.anatomyId, label: anatomyLabel })}
      <span class="workout-card__day">DAY ${workout.day}</span>
    </div>
    <div class="workout-card__body">
      <div class="workout-card__heading">
        <div>
          <span class="workout-card__short">${escapeHtml(workout.short)}</span>
          <h2>${escapeHtml(workout.title)}</h2>
        </div>
        <button class="workout-card__open" type="button" data-demo-action="open-workout" aria-label="פתח ${escapeHtml(workout.title)}">↗</button>
      </div>
      <p class="workout-card__targets">${escapeHtml(targetLabel)}</p>
      <div class="workout-card__stats" aria-label="פרטי אימון">
        <span><strong>${workout.exercises}</strong><small>תרגילים</small></span>
        <span><strong>${workout.sets}</strong><small>סטים</small></span>
        <span><strong>~${workout.minutes}</strong><small>דק׳</small></span>
      </div>
    </div>
  </article>`;
}

export function WorkoutsScreen() {
  return `<div class="screen workouts-screen animate-enter">
    <header class="screen-header screen-header--stacked workouts-header">
      <div>
        <span class="eyebrow">WORKOUTS</span>
        <h1>האימונים שלך</h1>
        <p>בחר אימון. התמונות נטענות ישירות מנכסי IronLog וניתן להחליף כל אחת בקובץ תמונה אחר בהמשך.</p>
      </div>
    </header>
    <section class="workout-grid" aria-label="תוכנית האימונים">
      ${WORKOUTS.map(WorkoutCard).join('')}
    </section>
  </div>`;
}
