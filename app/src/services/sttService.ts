import { File, UploadType } from 'expo-file-system';
import { TranscriptionResult } from '../types';
import { normalizeNepaliWords } from './nepaliDictionary';
import { OLLAMA_BASE_URL, OLLAMA_MODEL } from '../config';

async function transcribeWithGemma(audioUri: string): Promise<string> {
  console.log('[STT] Gemma STT from:', audioUri);
  const file = new File(audioUri);
  const result = await file.upload(`${OLLAMA_BASE_URL}/v1/audio/transcriptions`, {
    uploadType: UploadType.MULTIPART,
    fieldName: 'file',
    mimeType: 'audio/wav',
    parameters: { model: OLLAMA_MODEL },
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Ollama STT ${result.status}: ${result.body.substring(0, 200)}`);
  }

  const data = JSON.parse(result.body);
  return (data.text || '').trim();
}

export async function transcribeAudio(
  audioUri: string
): Promise<TranscriptionResult> {
  console.log('[STT] Transcribing audio from:', audioUri);

  try {
    const raw = await transcribeWithGemma(audioUri);
    const transcript = normalizeNepaliWords(raw);
    console.log('[STT] Transcription result:', transcript);

    if (!transcript || transcript === '[BLANK_AUDIO]') {
      throw new Error('कृपया फेरि प्रयास गर्नुहोस् — अडियो स्पष्ट छैन');
    }

    assertNepaliOrEnglish(transcript);

    return {
      rawTranscript: transcript,
      confidence: 0.95,
    };
  } catch (error: any) {
    console.error('[STT] Transcription failed:', error);
    throw error;
  }
}

function isAllowed(char: string): boolean {
  const code = char.codePointAt(0)!;
  if (code >= 0x0900 && code <= 0x097f) return true; // Devanagari
  if (code >= 0x0041 && code <= 0x005a) return true; // A-Z
  if (code >= 0x0061 && code <= 0x007a) return true; // a-z
  if (code >= 0x0030 && code <= 0x0039) return true; // 0-9
  if (' .,!?()-:;\'"।॥/#₹%&@\n\t'.includes(char)) return true;
  return false;
}

function assertNepaliOrEnglish(transcript: string): void {
  const hasDevanagari = /[\u0900-\u097f]/.test(transcript);
  const hasLatin = /[A-Za-z]/.test(transcript);
  if (!hasDevanagari && !hasLatin) {
    throw new Error('कृपया अंग्रेजी, नेपाली वा हिन्दीमा बोल्नुहोस्');
  }

  for (const char of transcript) {
    if (!isAllowed(char)) {
      console.warn('[STT] Rejected transcript with non-Nepali/English script:', transcript);
      throw new Error('पहिचान असफल — कृपया फेरि प्रयास गर्नुहोस्');
    }
  }
}
