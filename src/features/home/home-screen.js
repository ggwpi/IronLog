import { escapeHtml } from '../../core/escape-html.js';

const schedule = [
  { day: 1, short: 'PUSH A', title: 'Chest + Biceps', subtitle: 'Chest · Biceps', exercises: 7, sets: 24, minutes: 72 },
  { day: 2, short: 'LEGS A', title: 'Legs Heavy + Abs', subtitle: 'Quads · Hamstrings · Glutes · Core', exercises: 8, sets: 29, minutes: 88 },
  { day: 3, short: 'PULL A', title: 'Back + Triceps', subtitle: 'Back · Triceps · Rear Delts', exercises: 8, sets: 27, minutes: 82 },
  { day: 4, short: 'PUSH B', title: 'Shoulders + Chest', subtitle: 'Shoulders · Chest', exercises: 5, sets: 20, minutes: 64 },
  { day: 5, short: 'LEGS B', title: 'Legs Hypertrophy + Abs', subtitle: 'Quads · Hamstrings · Calves · Core', exercises: 8, sets: 30, minutes: 86 },
  { day: 6, short: 'ARMS', title: 'Arms + Shoulders', subtitle: 'Biceps · Triceps · Delts', exercises: 8, sets: 27, minutes: 76 },
];

const weekLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'בוקר טוב';
  if (hour < 18) return 'צהריים טובים';
  return 'ערב טוב';
}

function nearestWorkout() {
  const currentDay = new Date().getDay();
  const today = schedule.find((item) => item.day === currentDay);
  if (today) return { ...today, timing: 'היום' };

  const next = schedule.find((item) => item.day > currentDay) || schedule[0];
  return { ...next, timing: currentDay === 0 ? 'מחר' : 'האימון הבא' };
}

function athleteArt() {
  return `<svg class="home-athlete" viewBox="0 0 260 390" role="img" aria-label="דמות מתאמן גרפית">
    <defs>
      <linearGradient id="bodyShade" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#202823"/><stop offset=".55" stop-color="#0b100d"/><stop offset="1" stop-color="#030504"/>
      </linearGradient>
      <linearGradient id="bodyEdge" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#d2ff16" stop-opacity=".02"/><stop offset=".48" stop-color="#d2ff16" stop-opacity=".65"/><stop offset="1" stop-color="#d2ff16" stop-opacity=".06"/>
      </linearGradient>
      <filter id="softGlow"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <ellipse cx="130" cy="355" rx="82" ry="12" fill="#d2ff16" opacity=".07" filter="url(#softGlow)"/>
    <circle cx="130" cy="70" r="31" fill="url(#bodyShade)" stroke="#3e4d37" stroke-width="1.3"/>
    <path d="M98 100 C78 112 66 147 65 187 C64 229 77 260 89 287 L82 351 L117 351 L126 264 L134 264 L143 351 L178 351 L171 287 C183 260 196 229 195 187 C194 147 182 112 162 100 C153 113 144 121 130 121 C116 121 107 113 98 100Z" fill="url(#bodyShade)" stroke="#34402f" stroke-width="1.5"/>
    <path d="M101 110 C88 129 82 158 84 195 M159 110 C172 129 178 158 176 195 M96 148 C113 138 147 138 164 148 M91 194 C111 184 149 184 169 194" fill="none" stroke="#d2ff16" stroke-opacity=".24" stroke-width="1.2"/>
    <path d="M93 122 C70 135 54 172 49 222 C46 256 53 284 67 306 L81 294 C71 270 70 248 73 219 C77 180 86 153 103 139Z" fill="url(#bodyShade)" stroke="#303b2d" stroke-width="1.2"/>
    <path d="M167 122 C190 135 206 172 211 222 C214 256 207 284 193 306 L179 294 C189 270 190 248 187 219 C183 180 174 153 157 139Z" fill="url(#bodyShade)" stroke="#303b2d" stroke-width="1.2"/>
    <path d="M83 132 C101 113 114 116 130 130 C146 116 159 113 177 132" fill="none" stroke="url(#bodyEdge)" stroke-width="3" opacity=".72"/>
    <path d="M103 143 C110 169 118 191 130 207 C142 191 150 169 157 143" fill="#d2ff16" opacity=".08"/>
    <path d="M130 123 L130 261" stroke="#d2ff16" stroke-opacity=".18" stroke-width="1"/>
  </svg>`;
}

function weekActivity(currentDay) {
  return weekLabels.map((label, index) => {
    const jsDay = index + 1 <= 6 ? index + 1 : 0;
    const planned = schedule.some((item) => item.day === jsDay);
    const current = jsDay === currentDay;
    const height = planned ? [48, 64, 55, 72, 61, 46, 18][index] : 18;
    return `<div class="home-day ${current ? 'is-today' : ''} ${planned ? 'is-planned' : ''}">
      <div class="home-day__bar"><i style="--activity:${height}%"></i></div>
      <span>${label}</span>
    </div>`;
  }).join('');
}

export function HomeScreen({ userName = 'מתאמן' } = {}) {
  const safeName = escapeHtml(userName);
  const workout = nearestWorkout();
  const currentDay = new Date().getDay();
  const weeklySets = schedule.reduce((total, item) => total + item.sets, 0);
  const weeklyMinutes = schedule.reduce((total, item) => total + item.minutes, 0);

  return `<div class="home-art animate-enter" dir="rtl">
    <header class="home-art__header">
      <div>
        <span>${greeting()},</span>
        <h1>${safeName}<b>.</b></h1>
      </div>
      <span class="home-pulse" aria-hidden="true">⌁</span>
    </header>

    <section class="home-focus" aria-label="האימון הקרוב">
      <div class="home-focus__copy">
        <span class="home-kicker">${workout.timing} · NEXT WORKOUT</span>
        <h2>${workout.short}</h2>
        <h3>${workout.title}</h3>
        <p>${workout.subtitle}</p>
        <div class="home-workout-meta">
          <span><strong>${workout.exercises}</strong> תרגילים</span>
          <span><strong>${workout.sets}</strong> סטים</span>
          <span><strong>~${workout.minutes}</strong> דק׳</span>
        </div>
        <button class="home-start" type="button" data-route="workouts"><span>פתח אימון</span><i>↗</i></button>
      </div>

      <div class="home-body-stage">
        <div class="home-orbit home-orbit--outer" aria-hidden="true"></div>
        <div class="home-orbit home-orbit--inner" aria-hidden="true"></div>
        ${athleteArt()}

        <div class="home-bubble home-bubble--top">
          <span>WEEK</span><strong>6</strong><small>אימונים</small>
        </div>
        <div class="home-bubble home-bubble--left">
          <span>SETS</span><strong>${weeklySets}</strong><small>מתוכננים</small>
        </div>
        <div class="home-bubble home-bubble--right">
          <span>TIME</span><strong>${Math.round(weeklyMinutes / 60)}h</strong><small>שבועי</small>
        </div>
      </div>
    </section>

    <section class="home-activity" aria-label="פעילות שבועית">
      <div class="home-activity__heading">
        <div><span class="home-kicker">CALENDAR ACTIVITY</span><h3>השבוע שלך</h3></div>
        <span class="home-activity__note">יום נוכחי מסומן בירוק</span>
      </div>
      <div class="home-week">${weekActivity(currentDay)}</div>
    </section>

    <section class="home-insights" aria-label="נתוני תוכנית">
      <div><span>VOLUME PLAN</span><strong>${weeklySets}</strong><small>סטים / שבוע</small></div>
      <i></i>
      <div><span>TRAINING TIME</span><strong>${Math.round(weeklyMinutes / 60)}:${String(weeklyMinutes % 60).padStart(2, '0')}</strong><small>שעות / שבוע</small></div>
      <i></i>
      <div><span>CONSISTENCY</span><strong>6/7</strong><small>ימי תוכנית</small></div>
    </section>
  </div>`;
}
