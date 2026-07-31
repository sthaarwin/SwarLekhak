require('dotenv').config();

module.exports = ({ config }) => {
  return {
    ...config,
    name: 'Swar-Lekhak',
    slug: 'swar-lekhak',
    plugins: [
      [
        'expo-audio',
        {
          microphonePermission: 'Allow $(PRODUCT_NAME) to access your microphone.',
        },
      ],
      'expo-sharing',
    ],
    extra: {
      googleAiApiKey: process.env.GOOGLE_AI_API_KEY || '',
      openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
      modelProvider: process.env.MODEL_PROVIDER || 'openrouter',
      sttProvider: process.env.STT_PROVIDER || '',
      ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      ollamaModel: process.env.OLLAMA_MODEL || 'gemma4:e4b',
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || '',
      supabaseJwksUrl: process.env.SUPABASE_JWKS_URL || '',
    },
  };
};
