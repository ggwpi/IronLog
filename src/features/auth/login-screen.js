import { Icon } from '../../components/icons.js';

export function LoginScreen() {
  return `<main class="auth-shell">
    <section class="auth-panel animate-enter">
      <div class="brand-lockup">
        <div class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></div>
        <div><strong>IRONLOG</strong><small>TRAIN. TRACK. PROGRESS.</small></div>
      </div>

      <div class="auth-copy">
        <span class="eyebrow">WELCOME BACK</span>
        <h1>האימון שלך.<br><em>ברור יותר.</em></h1>
        <p>התחבר כדי להמשיך לעקוב אחרי האימונים וההתקדמות שלך.</p>
      </div>

      <form id="loginForm" class="auth-form" novalidate>
        <label class="field">
          <span>אימייל</span>
          <div class="field-control">${Icon('user', { size: 19 })}<input id="emailInput" type="email" inputmode="email" autocomplete="email" placeholder="name@example.com" required></div>
        </label>
        <label class="field">
          <span>סיסמה</span>
          <div class="field-control"><span class="password-dot">••</span><input id="passwordInput" type="password" autocomplete="current-password" placeholder="••••••••" minlength="4" required></div>
        </label>
        <p id="loginError" class="form-error" role="alert" hidden></p>
        <button class="button button--primary button--full" type="submit"><span>התחבר</span>${Icon('arrow', { size: 20 })}</button>
      </form>

      <p class="auth-note">בגרסת הבסיס ההתחברות נשמרת מקומית במכשיר. חיבור ל־backend/auth אמיתי יתווסף כשנבנה את שכבת הנתונים.</p>
    </section>
  </main>`;
}
