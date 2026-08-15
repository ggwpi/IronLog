import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.3/+esm';

const SUPABASE_URL = 'https://fksycphsxkrsbtqfysjk.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ShoqoOgXVmvA_u7W9pSuGg_wL_2aRY5';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  realtime: {
    params: { eventsPerSecond: 5 },
  },
});

