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
    return granted;
  } catch (e) {
    console.warn('[WavRecorder] Permission request failed:', e);
    return false;
  }
}

export async function startRecording(): Promise<void> {
  if (Platform.OS !== 'android' || !WavRecorder) {
    throw new Error('WavRecorder not available on this platform');
  }

  const file = new File(Paths.cache, 'recording_' + Date.now() + '.wav');
  const dir = file.parentDirectory;
  await dir.create({ intermediates: true });

  const path = file.uri.replace('file://', '');
  await WavRecorder.startRecording(path);
}

export async function stopRecording(): Promise<string> {
  if (!WavRecorder) {
    throw new Error('WavRecorder not available');
  }
  const path = await WavRecorder.stopRecording();
  return 'file://' + path;
}
