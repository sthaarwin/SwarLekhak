import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';

let WavRecorder: any = null;

try {
  WavRecorder = require('react-native').NativeModules.WavRecorder;
} catch (e) {
  console.warn('[WavRecorder] Native module not available');
}

export async function requestRecordPermission(): Promise<boolean> {
  try {
    const { requestRecordingPermissionsAsync } = require('expo-audio');
    const { granted } = await requestRecordingPermissionsAsync();
    console.log('[WavRecorder] Permission result:', granted);
    return granted;
  } catch (e) {
    console.warn('[WavRecorder] Permission request failed:', e);
    return false;
  }
}

export async function startRecording(): Promise<void> {
  if (Platform.OS !== 'android' || !WavRecorder) {
    throw new Error(
      'WavRecorder native module not found. Rebuild with: npx expo run:android'
    );
  }
  console.log('[WavRecorder] Native module present, starting...');

  const file = new File(Paths.cache, 'recording_' + Date.now() + '.wav');
  const dir = file.parentDirectory;
  await dir.create({ intermediates: true, idempotent: true });

  const path = file.uri.replace('file://', '');
  console.log('[WavRecorder] Recording to:', path);
  await WavRecorder.startRecording(path);
  console.log('[WavRecorder] Recording started');
}

export async function stopRecording(): Promise<string> {
  if (!WavRecorder) {
    throw new Error('WavRecorder not available');
  }
  console.log('[WavRecorder] Stopping...');
  const path = await WavRecorder.stopRecording();
  console.log('[WavRecorder] Stopped, path:', path);
  return 'file://' + path;
}
