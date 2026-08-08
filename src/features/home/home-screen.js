import { escapeHtml } from '../../core/escape-html.js';

const schedule = [
  { day: 1, short: 'PUSH A', title: 'Chest + Biceps', subtitle: 'Chest · Biceps', exercises: 7, sets: 24, minutes: 72, figures: [{ view: 'front', zones: ['chest', 'biceps'] }] },
  { day: 2, short: 'LEGS A', title: 'Legs Heavy + Abs', subtitle: 'Quads · Hamstrings · Glutes · Core', exercises: 8, sets: 29, minutes: 88, figures: [{ view: 'front', zones: ['quads', 'abs'] }, { view: 'back', zones: ['hamstrings', 'glutes'] }] },
  { day: 3, short: 'PULL A', title: 'Back + Triceps', subtitle: 'Back · Triceps · Rear Delts', exercises: 8, sets: 27, minutes: 82, figures: [{ view: 'back', zones: ['back', 'triceps'] }] },
  { day: 4, short: 'PUSH B', title: 'Shoulders + Chest', subtitle: 'Shoulders · Chest', exercises: 5, sets: 20, minutes: 64, figures: [{ view: 'front', zones: ['shoulders', 'chest'] }] },
  { day: 5, short: 'LEGS B', title: 'Legs Hypertrophy + Abs', subtitle: 'Quads · Hamstrings · Calves · Core', exercises: 8, sets: 30, minutes: 86, figures: [{ view: 'front', zones: ['quads', 'abs'] }, { view: 'back', zones: ['hamstrings', 'calves'] }] },
  { day: 6, short: 'ARMS', title: 'Arms + Shoulders', subtitle: 'Biceps · Triceps · Delts', exercises: 8, sets: 27, minutes: 76, figures: [{ view: 'front', zones: ['biceps', 'shoulders'] }, { view: 'back', zones: ['triceps', 'shoulders'] }] },
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

function bodyGeometry(back = false) {
  const torso = back
    ? '<path class="an-body" d="M82 84 Q120 63 158 84 L169 123 Q157 182 150 230 Q143 257 120 274 Q97 257 90 230 Q83 182 71 123Z"/>'
    : '<path class="an-body" d="M82 84 Q120 66 158 84 L169 123 Q160 181 150 230 Q143 255 120 272 Q97 255 90 230 Q80 181 71 123Z"/>';
  const torsoDetail = back
    ? '<path class="an-panel" d="M89 99 Q120 76 151 99 L145 175 Q120 198 95 175Z"/><path class="an-cut" d="M120 82V237M94 116Q120 132 146 116M94 145Q120 158 146 145M99 178Q120 190 141 178"/>'
    : '<path class="an-panel" d="M91 100 Q120 83 149 100 L145 151 Q120 165 95 151Z"/><path class="an-deep" d="M101 158 H139 L136 230 Q120 241 104 230Z"/><path class="an-cut" d="M120 83V236M96 121Q120 132 144 121M105 177H135M106 198H134M108 218H132"/>';

  return `<ellipse class="an-head" cx="120" cy="39" rx="24" ry="29"/>
    <path class="an-panel" d="M109 64 L131 64 L136 84 Q120 93 104 84Z"/>
    ${torso}${torsoDetail}
    <path class="an-body" d="M73 100 Q55 109 48 139 L39 232 Q40 250 55 252 L66 178 L82 119Z"/>
    <path class="an-body" d="M167 100 Q185 109 192 139 L201 232 Q200 250 185 252 L174 178 L158 119Z"/>
    <path class="an-panel" d="M49 137 Q61 121 72 130 L63 189 Q54 198 44 188Z"/>
    <path class="an-panel" d="M191 137 Q179 121 168 130 L177 189 Q186 198 196 188Z"/>
    <path class="an-body" d="M92 242 Q120 226 148 242 L151 281 Q120 300 89 281Z"/>
    <path class="an-body" d="M91 276 Q76 306 78 360 L88 426 Q93 445 105 438 L112 354 L117 291Z"/>
    <path class="an-body" d="M149 276 Q164 306 162 360 L152 426 Q147 445 135 438 L128 354 L123 291Z"/>
    <path class="an-body" d="M88 421 Q82 454 92 492 L108 492 L112 436Z"/>
    <path class="an-body" d="M152 421 Q158 454 148 492 L132 492 L128 436Z"/>
    <path class="an-cut" d="M91 290Q102 313 112 329M149 290Q138 313 128 329M91 359Q101 378 108 398M149 359Q139 378 132 398"/>`;
}

function accent(zone, back = false) {
  const common = {
    shoulders: '<path class="an-accent" d="M58 104 Q68 91 82 101 Q86 112 80 132 Q69 142 57 132 Q52 117 58 104Z"/><path class="an-accent" d="M182 104 Q172 91 158 101 Q154 112 160 132 Q171 142 183 132 Q188 117 182 104Z"/>',
    biceps: '<path class="an-accent" d="M54 132 Q65 126 69 140 L65 181 Q59 194 49 184 L48 150 Q49 138 54 132Z"/><path class="an-accent" d="M186 132 Q175 126 171 140 L175 181 Q181 194 191 184 L192 150 Q191 138 186 132Z"/>',
    triceps: '<path class="an-accent" d="M50 139 Q60 128 67 143 L63 189 Q56 199 47 187 L45 154 Q45 145 50 139Z"/><path class="an-accent" d="M190 139 Q180 128 173 143 L177 189 Q184 199 193 187 L195 154 Q195 145 190 139Z"/>',
    glutes: '<ellipse class="an-accent" cx="103" cy="265" rx="18" ry="18"/><ellipse class="an-accent" cx="137" cy="265" rx="18" ry="18"/>',
    quads: '<path class="an-accent" d="M92 282 Q81 311 83 356 Q91 378 106 360 L114 294Z"/><path class="an-accent" d="M148 282 Q159 311 157 356 Q149 378 134 360 L126 294Z"/>',
    hamstrings: '<path class="an-accent" d="M92 294 Q82 327 86 382 L105 397 L113 300Z"/><path class="an-accent" d="M148 294 Q158 327 154 382 L135 397 L127 300Z"/>',
    calves: '<path class="an-accent" d="M88 382 Q82 416 91 447 L106 439 L109 390Z"/><path class="an-accent" d="M152 382 Q158 416 149 447 L134 439 L131 390Z"/>',
  };
  if (common[zone]) return common[zone];
  if (zone === 'back') return '<path class="an-accent" d="M91 97 Q120 76 149 97 L145 174 Q120 196 95 174Z"/>';
  if (zone === 'chest') return back ? '' : '<path class="an-accent" d="M91 101 Q105 88 119 99 L117 146 Q102 151 94 139Z"/><path class="an-accent" d="M149 101 Q135 88 121 99 L123 146 Q138 151 146 139Z"/>';
  if (zone === 'abs') return back ? '' : '<path class="an-accent" d="M104 158 H136 L134 229 Q120 240 106 229Z"/>';
  return '';
}

function anatomyFigure({ view, zones }) {
  const back = view === 'back';
  const highlights = zones.map((zone) => accent(zone, back)).join('');
  return `<div class="home-figure">
    <svg class="home-figure__svg" viewBox="0 0 240 520" role="img" aria-label="${escapeHtml(zones.join(' + '))} anatomy">
      ${bodyGeometry(back)}${highlights}
    </svg>
    <span>${back ? 'BACK' : 'FRONT'}</span>
  </div>`;
}

function anatomyVisual(workout) {
  return `<div class="home-anatomy" aria-label="שרירי המטרה של ${escapeHtml(workout.title)}">
    <div class="home-anatomy__halo" aria-hidden="true"></div>
    <div class="home-anatomy__figures">${workout.figures.map(anatomyFigure).join('')}</div>
    <div class="home-anatomy__caption"><span>TODAY'S FOCUS</span><strong>${escapeHtml(workout.subtitle)}</strong></div>
  </div>`;
}

function weekActivity(currentDay) {
  const activity = [72, 44, 83, 58, 76, 51, 12];
  return weekLabels.map((label, index) => {
    const jsDay = index < 6 ? index + 1 : 0;
    const planned = schedule.some((item) => item.day === jsDay);
    const current = jsDay === currentDay;
    return `<div class="home-day ${current ? 'is-today' : ''} ${planned ? 'is-planned' : ''}">
      <div class="home-day__line"><i style="--activity:${planned ? activity[index] : 8}%"></i><b></b></div>
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
      <div><span>${greeting()},</span><h1>${safeName}<b>.</b></h1></div>
      <span class="home-pulse" aria-hidden="true">⌁</span>
    </header>

    <section class="home-workout" aria-label="האימון הקרוב">
      <div class="home-workout__copy">
        <span class="home-kicker">${workout.timing} · NEXT WORKOUT</span>
        <h2>${workout.short}</h2>
        <h3>${workout.title}</h3>
        <p>${workout.subtitle}</p>
        <div class="home-workout-meta">
          <span><strong>${workout.exercises}</strong><small>תרגילים</small></span>
          <span><strong>${workout.sets}</strong><small>סטים</small></span>
          <span><strong>~${workout.minutes}</strong><small>דק׳</small></span>
        </div>
        <button class="home-start" type="button" data-route="workouts"><span>פתח אימון</span><i>↗</i></button>
      </div>
      ${anatomyVisual(workout)}
    </section>

    <section class="home-metrics" aria-label="סיכום תוכנית שבועי">
      <div><span>TRAINING DAYS</span><strong>6</strong><small>השבוע</small></div><i></i>
      <div><span>WEEKLY SETS</span><strong>${weeklySets}</strong><small>מתוכננים</small></div><i></i>
      <div><span>TRAINING TIME</span><strong>${Math.round(weeklyMinutes / 60)}h</strong><small>בקירוב</small></div>
    </section>

    <section class="home-activity" aria-label="פעילות שבועית">
      <div class="home-activity__heading"><div><span class="home-kicker">CALENDAR ACTIVITY</span><h3>השבוע שלך</h3></div><span>${currentDay === 0 ? 'REST DAY' : 'ACTIVE WEEK'}</span></div>
      <div class="home-week">${weekActivity(currentDay)}</div>
    </section>
  </div>`;
}
