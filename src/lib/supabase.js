import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.3/+esm';

const SUPABASE_URL = 'https://fksycphsxkrsbtqfysjk.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ShoqoOgXVmvA_u7W9pSuGg_wL_2aRY5';
const nativeFetch = globalThis.fetch.bind(globalThis);

let client = null;
let refreshPromise = null;

const sleep = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function requestUrl(input) {
  return typeof input === 'string' ? input : input?.url || '';
}

async function isFutureJwtResponse(response) {
  if (response?.ok || ![401, 403].includes(Number(response?.status))) return false;
  try {
    const text = await response.clone().text();
    return /jwt\s+issued\s+at\s+future/i.test(text);
  } catch {
    return false;
  }
}

function authorizationHeader(input, init) {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  return headers.get('authorization') || '';
}

function tokenIssuedAt(input, init) {
  const header = authorizationHeader(input, init);
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token || token.split('.').length < 2) return null;
  try {
    const raw = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = raw.padEnd(Math.ceil(raw.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded));
    return Number.isFinite(Number(payload.iat)) ? Number(payload.iat) * 1000 : null;
  } catch {
    return null;
  }
}

function retryDelay(input, init, fallback = 900) {
  const issuedAt = tokenIssuedAt(input, init);
  if (!issuedAt) return fallback;
  const localLead = issuedAt - Date.now();
  return Math.min(5000, Math.max(fallback, localLead + 700));
}

async function refreshedAccessToken() {
  if (!client) return null;
  if (!refreshPromise) {
    refreshPromise = client.auth.refreshSession()
      .then(({ data, error }) => error ? null : data?.session?.access_token || null)
      .catch(() => null)
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

async function retryWithToken(input, init, token) {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  if (token) headers.set('authorization', `Bearer ${token}`);
  const options = { ...(init || {}), headers };
  return nativeFetch(input, options);
}

async function resilientFetch(input, init) {
  // Keep an untouched clone because Request bodies can be consumed by the first fetch.
  const retryInput = input instanceof Request ? input.clone() : input;
  const retryInit = init ? { ...init } : undefined;
  const response = await nativeFetch(input, init);
  if (!(await isFutureJwtResponse(response))) return response;

  // A just-issued token can briefly reach PostgREST before every Supabase edge clock
  // agrees on its iat. Do not surface that transient infrastructure detail to the UI.
  await sleep(retryDelay(retryInput, retryInit));

  const url = requestUrl(retryInput);
  if (url.includes('/auth/v1/')) {
    return nativeFetch(retryInput, retryInit);
  }

  const freshToken = await refreshedAccessToken();
  let retry = await retryWithToken(retryInput, retryInit, freshToken);
  if (!(await isFutureJwtResponse(retry))) return retry;

  // One final short grace period covers clock skew without creating an infinite loop.
  await sleep(1600);
  retry = await retryWithToken(retryInput, retryInit, freshToken);
  return retry;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    fetch: resilientFetch,
  },
  realtime: {
    params: { eventsPerSecond: 5 },
  },
});

client = supabase;
