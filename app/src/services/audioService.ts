import { requestRecordingPermissionsAsync } from 'expo-audio';

export async function requestMicrophonePermission(): Promise<boolean> {
  const { granted } = await requestRecordingPermissionsAsync();
  return granted;
}
