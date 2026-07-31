import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as Record<string, string | undefined> || {};

export const OPENROUTER_API_KEY = extra.openrouterApiKey || '';
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
export const OPENROUTER_MODEL = 'google/gemma-4-26b-a4b-it:free';

export const MODEL_PROVIDER = (extra.modelProvider || 'openrouter') as 'openrouter' | 'ollama';

export const STT_PROVIDER = (extra.sttProvider ||
  (MODEL_PROVIDER === 'ollama' ? 'gemma' : 'whisper')) as 'gemma' | 'whisper';

export const OLLAMA_BASE_URL = extra.ollamaBaseUrl || 'http://localhost:11434';
export const OLLAMA_MODEL = extra.ollamaModel || 'gemma4:e4b';

export const SUPABASE_URL = extra.supabaseUrl || '';
export const SUPABASE_PUBLISHABLE_KEY = extra.supabasePublishableKey || '';
export const SUPABASE_JWKS_URL = extra.supabaseJwksUrl || '';
