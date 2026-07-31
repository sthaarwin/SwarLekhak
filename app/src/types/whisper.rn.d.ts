declare module 'whisper.rn' {
  export type TranscribeOptions = {
    language?: string;
    translate?: boolean;
    maxThreads?: number;
    nProcessors?: number;
    maxContext?: number;
    maxLen?: number;
    tokenTimestamps?: boolean;
    tdrzEnable?: boolean;
    wordThold?: number;
    offset?: number;
    duration?: number;
    temperature?: number;
    temperatureInc?: number;
    beamSize?: number;
    bestOf?: number;
    prompt?: string;
  };

  export type TranscribeResult = {
    result: string;
    language: string;
    segments: Array<{ text: string; t0: number; t1: number }>;
    isAborted: boolean;
  };

  export type TranscribeFileOptions = TranscribeOptions & {
    onProgress?: (progress: number) => void;
    onNewSegments?: (result: {
      nNew: number;
      totalNNew: number;
      result: string;
      segments: TranscribeResult['segments'];
    }) => void;
  };

  export class WhisperContext {
    transcribe(
      filePathOrBase64: string | number,
      options?: TranscribeFileOptions
    ): { stop: () => Promise<void>; promise: Promise<TranscribeResult> };
    release(): Promise<void>;
  }

  export type ContextOptions = {
    filePath: string | number;
    isBundleAsset?: boolean;
    useGpu?: boolean;
    useCoreMLIos?: boolean;
    useFlashAttn?: boolean;
  };

  export function initWhisper(options: ContextOptions): Promise<WhisperContext>;
  export function releaseAllWhisper(): Promise<void>;
  export const libVersion: string;
  export function toggleNativeLog(enabled: boolean): Promise<void>;
}
