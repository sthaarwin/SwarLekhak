import { initWhisper, WhisperContext } from 'whisper.rn';
import { TranscriptionResult } from '../types';
import { ensureModelDownloaded } from './modelService';

let whisperContext: WhisperContext | null = null;

async function getWhisperContext(): Promise<WhisperContext> {
  if (whisperContext) return whisperContext;

  const modelPath = await ensureModelDownloaded();
  console.log('[STT] Initializing whisper context...');
  whisperContext = await initWhisper({
    filePath: modelPath,
    useGpu: false,
  });
  console.log('[STT] Whisper context ready');
  return whisperContext;
}

export async function transcribeAudio(audioUri: string): Promise<TranscriptionResult> {
  console.log('[STT] Transcribing audio from:', audioUri);

  try {
    const ctx = await getWhisperContext();
    const { promise } = ctx.transcribe(audioUri, {
      language: 'auto',
      maxThreads: 4,
    });

    const result = await promise;
    const transcript = (result.result || '').trim();
    console.log('[STT] Transcription result:', transcript);

    const hasDevanagari = /[\u0900-\u097F]/.test(transcript);
    const hasLatin = /[A-Za-z]/.test(transcript);
    if (!hasDevanagari && !hasLatin) {
      console.warn('[STT] Unsupported script in transcript');
      throw new Error('कृपया अंग्रेजी, नेपाली वा हिन्दीमा बोल्नुहोस्');
    }

    if (!transcript || transcript === '[BLANK_AUDIO]') {
      throw new Error('कृपया फेरि प्रयास गर्नुहोस् — अडियो स्पष्ट छैन');
    }

    return {
      rawTranscript: transcript,
      confidence: 0.95,
    };
  } catch (error: any) {
    console.error('[STT] Transcription failed:', error);
    throw error;
  }
}

export function releaseWhisper() {
  if (whisperContext) {
    whisperContext.release();
    whisperContext = null;
  }
}
