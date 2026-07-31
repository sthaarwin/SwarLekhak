import { File, Directory, Paths } from 'expo-file-system';

const MODEL_URL = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin';
const MODEL_FILENAME = 'ggml-base.bin';

function getModelDir(): Directory {
  return new Directory(Paths.cache, 'whisper-models');
}

function getModelFile(): File {
  return new File(getModelDir(), MODEL_FILENAME);
}

export async function ensureModelDownloaded(
  onProgress?: (progress: number) => void
): Promise<string> {
  const modelFile = getModelFile();

  try {
    const info = await modelFile.info();
    if (info.exists && (info.size ?? 0) > 0) {
      console.log('[Model] Model already cached:', modelFile.uri);
      return modelFile.uri;
    }
  } catch (_) {}

  console.log('[Model] Downloading base model...');
  const dir = getModelDir();
  await dir.create({ intermediates: true, idempotent: true });

  const downloaded = await File.downloadFileAsync(MODEL_URL, modelFile, {
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

export async function getModelPath(): Promise<string | null> {
  try {
    const modelFile = getModelFile();
    const info = await modelFile.info();
    if (info.exists && (info.size ?? 0) > 0) {
      return modelFile.uri;
    }
    return null;
  } catch (e) {
    return null;
  }
}
