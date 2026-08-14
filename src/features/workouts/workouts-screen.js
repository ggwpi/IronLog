import { escapeHtml } from '../../core/escape-html.js';
import { WORKOUTS } from './workout-catalog.js';

function WorkoutCard(workout) {
  const targetLabel = workout.targets.join(' · ');

  return `<article class="workout-card" data-workout-id="${escapeHtml(workout.id)}">
    <div class="workout-card__body">
      <div class="workout-card__heading">
        <div>
          <span class="workout-card__short">${escapeHtml(workout.short)}</span>
          <h2>${escapeHtml(workout.title)}</h2>
        </div>
        <span class="workout-card__day">DAY ${workout.day}</span>
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
        <p>בחר אימון כדי לראות את הפרטים שלו.</p>
      </div>
    </header>
    <section class="workout-grid" aria-label="תוכנית האימונים">
      ${WORKOUTS.map(WorkoutCard).join('')}
    </section>
  </div>`;
}
