import { File, Directory, Paths } from 'expo-file-system';
import { SttModel } from '../types';

const MODELS: Record<SttModel, { url: string; filename: string }> = {
  tiny: {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
    filename: 'ggml-tiny.bin',
  },
  base: {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
    filename: 'ggml-base.bin',
  },
  small: {
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
    filename: 'ggml-small.bin',
  },
};

function getModelDir(): Directory {
  return new Directory(Paths.cache, 'whisper-models');
}

function getModelFile(model: SttModel): File {
  return new File(getModelDir(), MODELS[model].filename);
}

export async function ensureModelDownloaded(
  model: SttModel,
  onProgress?: (progress: number) => void
): Promise<string> {
  const modelFile = getModelFile(model);

  try {
    const info = await modelFile.info();
    if (info.exists && (info.size ?? 0) > 0) {
      console.log(`[Model] ${model} already cached:`, modelFile.uri);
      return modelFile.uri;
    }
  } catch (_) {}

  console.log(`[Model] Downloading ${model} model...`);
  const dir = getModelDir();
  await dir.create({ intermediates: true, idempotent: true });

  const downloaded = await File.downloadFileAsync(MODELS[model].url, modelFile, {
    onProgress: ({ bytesWritten, totalBytes }) => {
      if (totalBytes > 0) {
        const pct = Math.round((bytesWritten / totalBytes) * 100);
        onProgress?.(pct);
        console.log(`[Model] Download: ${pct}% (${bytesWritten}/${totalBytes})`);
      }
    },
  });

  console.log('[Model] Download complete:', downloaded.uri);
  return downloaded.uri;
}

export async function getModelPath(model: SttModel): Promise<string | null> {
  try {
    const modelFile = getModelFile(model);
    const info = await modelFile.info();
    if (info.exists && (info.size ?? 0) > 0) {
      return modelFile.uri;
    }
    return null;
  } catch (e) {
    return null;
  }
}
