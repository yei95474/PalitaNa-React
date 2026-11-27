import { createClient } from '@supabase/supabase-js';

const demo = import.meta.env.MODE === 'demo';
const url = demo ? undefined : import.meta.env.VITE_SUPABASE_URL;
const key = demo ? undefined : import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
if (Boolean(url) !== Boolean(key)) {
    throw new Error('Set the Supabase URL and public client key, or omit both for demo mode.');
}

export const supabase = url ? createClient(url, key) : null;
