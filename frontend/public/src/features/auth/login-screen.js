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

      <div class="auth-form">
        <p id="loginError" class="form-error" role="alert" hidden></p>
        <button id="googleLoginButton" class="button button--primary button--full" type="button">
          <span>המשך עם Google</span>
          <span class="google-mark" aria-hidden="true">G</span>
        </button>
      </div>

      <p class="auth-note">Google מאמתת את הזהות שלך. נתוני האימונים נשמרים ב־IronLog ומוגנים לכל משתמש בנפרד.</p>
    </section>
  </main>`;
}
