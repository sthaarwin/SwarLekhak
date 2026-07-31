import { GemmaAnalysisResult, ConversationEntry, DocumentType } from '../types';
import {
  OPENROUTER_API_KEY,
  OPENROUTER_BASE_URL,
  OPENROUTER_MODEL,
  MODEL_PROVIDER,
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
} from '../config';

const SYSTEM_PROMPT = `You are Swar-Lekhak, an AI administrative assistant for Nepal. You convert spoken or typed Nepali into structured government documents. Always respond with valid JSON only, no markdown, no code fences.

The user input may be in Devanagari (नेपाली), romanized/transliterated Nepali (e.g. "ujuri" = उजुरी/complaint, "nibedan" = निवेदन/application, "polis" = प्रहरी/police), or plain English. Understand the meaning regardless of script and map administrative concepts correctly.

NAMES AND PROPER NOUNS: Never translate, transliterate, or modify personal names, place names, or organization names. Preserve them exactly as the user wrote or spoke them (e.g. "Arbin", "अर्बिन", "Ramesh" stay as-is). If a name appears in romanized form, keep it romanized; if in Devanagari, keep it Devanagari. Only translate common words and administrative terms.`;

function buildUserPrompt(
  rawTranscript: string,
  conversationHistory?: ConversationEntry[],
  selectedTemplate?: DocumentType | 'AUTO'
): string {
  let conversationContext = '';
  if (conversationHistory && conversationHistory.length > 0) {
    conversationContext =
      conversationHistory
        .map((entry) => `${entry.role === 'user' ? 'User' : 'Assistant'}: ${entry.content}`)
        .join('\n') + '\n';
  }

  let templateHint = '';
  if (selectedTemplate && selectedTemplate !== 'AUTO') {
    templateHint = `\nTemplate Hint: The user intends to create a ${selectedTemplate} document. Prioritize extracting fields relevant to this document type.`;
  }

  return `Previous conversation:
${conversationContext}Latest user input: "${rawTranscript}"${templateHint}

Tasks:
1. Detect Document Type: NIVEDAN, MEDICAL, or POLICE_REPORT${selectedTemplate && selectedTemplate !== 'AUTO' ? ` (user selected: ${selectedTemplate})` : ''}.
2. Extract available entities (Name, Address, Ward Number, Subject, Incident details, Dates).
3. Identify crucial missing information required for an official government application.
4. Calculate a confidence score (0.0 to 1.0) on transcription clarity.
5. If required fields are missing, draft a natural, polite follow-up question in Nepali.

Output strict JSON matching this structure:
{
  "documentType": "NIVEDAN",
  "confidenceScore": 0.92,
  "extractedFields": {
    "applicantName": "...",
    "address": "...",
    "wardNo": "..."
  },
  "missingRequiredFields": ["wardNo"],
  "followUpQuestionNepali": "कृपया तपाईंको वडा नम्बर कति हो, भनिदिनुहुन्छ?"
}`;
}

const DEMO_NIVEDAN: GemmaAnalysisResult = {
  documentType: 'NIVEDAN',
  confidenceScore: 0.89,
  extractedFields: {
    applicantName: 'राम बहादुर गुरुङ',
    address: 'काठमाडौं-१५, बल्खु',
    wardNo: '१५',
    subject: 'वडा सिफारिसको लागि निवेदन',
  },
  missingRequiredFields: [],
  followUpQuestionNepali: null,
};

const DEMO_MEDICAL: GemmaAnalysisResult = {
  documentType: 'MEDICAL',
  confidenceScore: 0.85,
  extractedFields: {
    applicantName: 'सीता देवी शर्मा',
    address: 'ललितपुर-३, पाटन',
    wardNo: '३',
    subject: 'स्वास्थ्य परीक्षण प्रतिवेदन',
    date: '२०८१-०४-१५',
  },
  missingRequiredFields: ['wardNo'],
  followUpQuestionNepali: 'कृपया तपाईंको वडा नम्बर कति हो, भनिदिनुहुन्छ?',
};

const DEMO_POLICE: GemmaAnalysisResult = {
  documentType: 'POLICE_REPORT',
  confidenceScore: 0.82,
  extractedFields: {
    applicantName: 'अनिता केसी',
    address: 'भक्तपुर-८, चाँगुनारायण',
    wardNo: '८',
    subject: 'चोरी सम्बन्धी उजुरी',
    incidentDetails: 'मिति २०८१-०३-२७ को राति अज्ञात व्यक्तिले घरको ताला फोडी नगद ५०,००० चोरी गरेको',
    date: '२०८१-०३-२८',
  },
  missingRequiredFields: [],
  followUpQuestionNepali: null,
};

function getDemoResult(transcript: string): GemmaAnalysisResult {
  const lower = transcript.toLowerCase();
  if (lower.includes('स्वास्थ्य') || lower.includes('मेडिकल') || lower.includes('रोगी') || lower.includes('बिरामी')) {
    return DEMO_MEDICAL;
  }
  if (lower.includes('उजुरी') || lower.includes('चोरी') || lower.includes('पुलिस') || lower.includes('घटना')) {
    return DEMO_POLICE;
  }
  return DEMO_NIVEDAN;
}

function parseGemmaResponse(text: string): GemmaAnalysisResult {
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response: ' + text.substring(0, 100));
  }
  return JSON.parse(jsonMatch[0]) as GemmaAnalysisResult;
}

const TRANSLATE_PROMPT = `You are Swar-Lekhak, an AI administrative assistant for Nepal. Translate the user's message into clean, natural Nepali in Devanagari script (नेपाली). The input may be romanized Nepali, Devanagari, or English. 

NAMES AND PROPER NOUNS: Never translate, transliterate, or modify personal names, place names, or organization names. Preserve them exactly as written or spoken (e.g. "Arbin", "अर्बिन", "Ramesh" stay as-is). Only translate the surrounding common words.

Output only the translated Nepali text. No quotes, no JSON, no explanations.`;

async function callOpenRouterText(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://swar-lekhak.app',
      'X-Title': 'Swar-Lekhak',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('OpenRouter returned empty response');
  return text;
}

async function callOllamaText(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 1024,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama ${response.status}: ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('Ollama returned empty response');
  return text;
}

async function callOpenRouter(userPrompt: string): Promise<GemmaAnalysisResult> {
  return parseGemmaResponse(await callOpenRouterText(SYSTEM_PROMPT, userPrompt));
}

async function callOllama(userPrompt: string): Promise<GemmaAnalysisResult> {
  return parseGemmaResponse(await callOllamaText(SYSTEM_PROMPT, userPrompt));
}

function buildProviders<T>(primaryCall: () => Promise<T>, secondaryCall: () => Promise<T>): { name: string; call: () => Promise<T> }[] {
  const providers: { name: string; call: () => Promise<T> }[] = [];
  const push = (name: string, call: () => Promise<T>) => {
    if (name === 'openrouter' && !OPENROUTER_API_KEY) return;
    providers.push({ name, call });
  };
  if (MODEL_PROVIDER === 'ollama') {
    push('Ollama', primaryCall);
    push('OpenRouter', secondaryCall);
  } else {
    push('OpenRouter', primaryCall);
    push('Ollama', secondaryCall);
  }
  return providers;
}

async function runWithFallback<T>(providers: { name: string; call: () => Promise<T> }[]): Promise<T> {
  let lastError: unknown = null;
  for (const provider of providers) {
    try {
      console.log(`[Gemma] Trying ${provider.name}...`);
      const result = await provider.call();
      console.log(`[Gemma] ${provider.name} succeeded`);
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`[Gemma] ${provider.name} failed:`, error);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('All providers failed');
}

export async function translateTranscript(rawTranscript: string): Promise<string> {
  console.log('[Gemma] Translating:', rawTranscript.substring(0, 50));
  const providers = buildProviders(
    () => callOpenRouterText(TRANSLATE_PROMPT, rawTranscript),
    () => callOllamaText(TRANSLATE_PROMPT, rawTranscript)
  );
  const text = await runWithFallback(providers);
  return text.trim();
}

export async function analyzeWithGemma(
  rawTranscript: string,
  conversationHistory?: ConversationEntry[],
  selectedTemplate?: DocumentType | 'AUTO'
): Promise<GemmaAnalysisResult> {
  const userPrompt = buildUserPrompt(rawTranscript, conversationHistory, selectedTemplate);
  console.log('[Gemma] Analyzing:', rawTranscript.substring(0, 50));

  const providers = buildProviders(
    () => callOpenRouter(userPrompt),
    () => callOllama(userPrompt)
  );

  try {
    return await runWithFallback(providers);
  } catch (error) {
    console.warn('[Gemma] All providers failed, falling back to demo');
    return getDemoResult(rawTranscript);
  }
}

export { getDemoResult };
