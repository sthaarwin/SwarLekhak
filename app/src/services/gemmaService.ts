import { GemmaAnalysisResult, ConversationEntry, DocumentType } from '../types';
import {
  OPENROUTER_API_KEY,
  OPENROUTER_BASE_URL,
  OPENROUTER_MODEL,
  MODEL_PROVIDER,
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
} from '../config';

const SYSTEM_PROMPT = `You are Swar-Lekhak, an AI administrative assistant for Nepal. You convert spoken Nepali into structured government documents. Always respond with valid JSON only, no markdown, no code fences.`;

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

async function callOpenRouter(userPrompt: string): Promise<GemmaAnalysisResult> {
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
        { role: 'system', content: SYSTEM_PROMPT },
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
  return parseGemmaResponse(text);
}

async function callOllama(userPrompt: string): Promise<GemmaAnalysisResult> {
  const response = await fetch(`${OLLAMA_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
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
  return parseGemmaResponse(text);
}

export async function analyzeWithGemma(
  rawTranscript: string,
  conversationHistory?: ConversationEntry[],
  selectedTemplate?: DocumentType | 'AUTO'
): Promise<GemmaAnalysisResult> {
  const userPrompt = buildUserPrompt(rawTranscript, conversationHistory, selectedTemplate);
  console.log('[Gemma] Analyzing:', rawTranscript.substring(0, 50));

  const primary = MODEL_PROVIDER === 'ollama' ? 'ollama' : 'openrouter';
  const secondary = primary === 'ollama' ? 'openrouter' : 'ollama';

  const providers: { name: string; call: () => Promise<GemmaAnalysisResult> }[] = [];

  if (primary === 'openrouter' && OPENROUTER_API_KEY) {
    providers.push({ name: 'OpenRouter', call: () => callOpenRouter(userPrompt) });
  }
  if (primary === 'ollama') {
    providers.push({ name: 'Ollama', call: () => callOllama(userPrompt) });
  }

  if (secondary === 'openrouter' && OPENROUTER_API_KEY) {
    providers.push({ name: 'OpenRouter', call: () => callOpenRouter(userPrompt) });
  }
  if (secondary === 'ollama') {
    providers.push({ name: 'Ollama', call: () => callOllama(userPrompt) });
  }

  for (const provider of providers) {
    try {
      console.log(`[Gemma] Trying ${provider.name}...`);
      const result = await provider.call();
      console.log(`[Gemma] ${provider.name} succeeded`);
      return result;
    } catch (error) {
      console.warn(`[Gemma] ${provider.name} failed:`, error);
    }
  }

  console.warn('[Gemma] All providers failed, falling back to demo');
  return getDemoResult(rawTranscript);
}

export { getDemoResult };
