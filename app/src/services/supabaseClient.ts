import { createClient } from '@supabase/supabase-js';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../config';

const memoryStore = new Map<string, string>();

const authStorage = {
  getItem: (key: string) => Promise.resolve(memoryStore.get(key) ?? null),
  setItem: (key: string, value: string) => {
    memoryStore.set(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    memoryStore.delete(key);
    return Promise.resolve();
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
