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

function safeGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemove(key) {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function readSession() {
  return safeParse(safeGet(SESSION_KEY), null);
}

export function writeSession(session) {
  if (!session) return safeRemove(SESSION_KEY);
  return safeSet(SESSION_KEY, JSON.stringify(session));
}

export function readSettings() {
  return { ...defaults, ...safeParse(safeGet(SETTINGS_KEY), {}) };
}

export function writeSettings(settings) {
  return safeSet(SETTINGS_KEY, JSON.stringify({ ...defaults, ...settings }));
}
