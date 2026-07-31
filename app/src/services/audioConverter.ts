import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';

let WavConverter: any = null;

export async function convertToWav(inputUri: string): Promise<string> {
  if (Platform.OS !== 'android') {
    return inputUri;
  }

  try {
    WavConverter = require('react-native').NativeModules.WavConverter;
    if (!WavConverter) {
      console.warn('[AudioConverter] Native module not available, using original file');
      return inputUri;
    }
  } catch (e) {
    console.warn('[AudioConverter] Failed to load native module, using original file');
    return inputUri;
  }

  const outputFile = new File(Paths.cache, 'converted_' + Date.now() + '.wav');
  const outputDir = outputFile.parentDirectory;
  try {
    await outputDir.create({ intermediates: true });
  } catch (_) {}

  const outputPath = outputFile.uri.replace('file://', '');

  try {
    const result = await WavConverter.convertToWav(
      inputUri.replace('file://', ''),
      outputPath
    );
    console.log('[AudioConverter] Converted to WAV:', result);

    // Copy to fixed debug path so we can adb pull it
    try {
      const dst = new File(Paths.document, 'debug_audio.wav');
      await outputFile.copy(dst, { overwrite: true });
      console.log('[AudioConverter] Debug copy at:', dst.uri);
    } catch (copyErr) {
      console.warn('[AudioConverter] Debug copy failed:', copyErr);
    }

    return 'file://' + result;
  } catch (err: any) {
    console.error('[AudioConverter] Conversion failed:', err);
    return inputUri;
  }
}
