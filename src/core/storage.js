const SESSION_KEY = 'ironlog.session.v1';
const SETTINGS_KEY = 'ironlog.settings.v1';

const defaults = {
  theme: 'dark',
  reduceMotion: false,
};

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function readSession() {
  return safeParse(localStorage.getItem(SESSION_KEY), null);
}

export function writeSession(session) {
  if (!session) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function readSettings() {
  return { ...defaults, ...safeParse(localStorage.getItem(SETTINGS_KEY), {}) };
}

export function writeSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...defaults, ...settings }));
}
