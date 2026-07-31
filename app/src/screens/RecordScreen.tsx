import { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Easing,
  Pressable,
  ScrollView,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { useDocumentStore } from '../store/useDocumentStore';
import { transcribeAudio } from '../services/sttService';
import { analyzeWithGemma, translateTranscript } from '../services/gemmaService';
import { startRecording, stopRecording, requestRecordPermission } from '../services/wavRecorderService';
import { colors, spacing, typeScale } from '../theme';
import type { DocumentType } from '../types';

const BAR_COUNT = 32;
const DEVANAGARI_RE = /[\u0900-\u097F]/;
const TEMPLATES: { id: DocumentType | 'AUTO'; title: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }[] = [
  { id: 'AUTO', title: 'स्वचालित', icon: 'auto-fix', color: colors.primary },
  { id: 'NIVEDAN', title: 'निवेदन', icon: 'file-document-outline', color: colors.govBlueDark },
  { id: 'MEDICAL', title: 'स्वास्थ्य', icon: 'hospital-box-outline', color: colors.tertiary },
  { id: 'POLICE_REPORT', title: 'प्रहरी उजुरी', icon: 'scale-balance', color: colors.secondary },
];

export default function RecordScreen({ navigation }: any) {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const waveAnims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.15))
  ).current;
  const waveInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [micScale] = useState(() => new Animated.Value(1));
  const [clarifying, setClarifying] = useState(false);
  const [transcript, setTranscript] = useState('');
  const processingRef = useRef(false);
  const player = useAudioPlayer(null);

  const {
    recordingStatus,
    setRecordingStatus,
    audioUri,
    setAudioUri,
    setRawTranscript,
    setGemmaResult,
    setError,
    error,
    addToHistory,
    addToConversationHistory,
    clearConversationHistory,
    gemmaResult,
    rawTranscript,
    selectedTemplate,
    setSelectedTemplate,
    conversationHistory,
  } = useDocumentStore();

  const isRecording = recordingStatus === 'recording';
  const isPreview = recordingStatus === 'preview';
  const isBusy = ['transcribing', 'translating', 'processing'].includes(recordingStatus);
  const isEditing = recordingStatus === 'editing';
  const needsTranslation = isEditing && !!transcript.trim() && !DEVANAGARI_RE.test(transcript);

  const animatePulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const animateWaves = useCallback(() => {
    if (waveInterval.current) clearInterval(waveInterval.current);
    waveInterval.current = setInterval(() => {
      waveAnims.forEach((anim) => {
        const val = isRecording
          ? Math.random() * 0.85 + 0.15
          : 0.15;
        Animated.timing(anim, {
          toValue: val,
          duration: 100,
          useNativeDriver: false,
        }).start();
      });
    }, 120);
  }, [isRecording, waveAnims]);

  useEffect(() => {
    if (isRecording) {
      animatePulse();
      animateWaves();
      Animated.spring(micScale, {
        toValue: 0.92,
        useNativeDriver: true,
      }).start();
    } else {
      if (waveInterval.current) clearInterval(waveInterval.current);
      waveAnims.forEach((anim) =>
        Animated.timing(anim, {
          toValue: 0.15,
          duration: 200,
          useNativeDriver: false,
        }).start()
      );
      Animated.spring(micScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
    return () => {
      if (waveInterval.current) clearInterval(waveInterval.current);
    };
  }, [isRecording]);

  useEffect(() => {
    return () => {
      clearConversationHistory();
    };
  }, []);

  useEffect(() => {
    if (audioUri) {
      player.replace(audioUri);
    }
  }, [audioUri]);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.8],
  });
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0],
  });

  const processTranscription = async (transcript: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      setRecordingStatus('processing');
      const result = await analyzeWithGemma(transcript, conversationHistory, selectedTemplate);

      if (gemmaResult?.extractedFields) {
        result.extractedFields = { ...gemmaResult.extractedFields, ...result.extractedFields };
        result.missingRequiredFields = (result.missingRequiredFields || []).filter(
          (f) => !result.extractedFields[f]
        );
      }
      setGemmaResult(result);

      if (result.missingRequiredFields && result.missingRequiredFields.length > 0) {
        setClarifying(true);
        addToConversationHistory({ role: 'user', content: transcript });
        addToConversationHistory({ role: 'assistant', content: result.followUpQuestionNepali || '' });
        setAudioUri(null);
        setRecordingStatus('idle');
      } else {
        addToConversationHistory({ role: 'user', content: transcript });
        addToHistory(
          conversationHistory.length > 0
            ? conversationHistory.map((e) => e.content).join(' ') + ' ' + transcript
            : transcript,
          result
        );
        setRecordingStatus('complete');
        clearConversationHistory();
        setAudioUri(null);
        if (result.documentType) {
          navigation.navigate('Document');
        }
      }
    } catch (err: any) {
      setError(err.message);
      setAudioUri(null);
      setRecordingStatus('idle');
    } finally {
      processingRef.current = false;
    }
  };

  const handleMicPress = async () => {
    if (isRecording) {
      try {
        const uri = await stopRecording();
        setAudioUri(uri);
        if (!uri) {
          setError('अडियो रेकर्ड गर्न सकिएन');
          setRecordingStatus('idle');
          return;
        }
        setRecordingStatus('preview');
      } catch (err: any) {
        setError(err.message);
        setRecordingStatus('idle');
      }
    } else {
      try {
        const hasPermission = await requestRecordPermission();
        if (!hasPermission) {
          setError('माइक्रोफोन अनुमति आवश्यक छ');
          return;
        }
        setError(null);
        await startRecording();
        setRecordingStatus('recording');
        setAudioUri(null);
      } catch (err: any) {
        setError(err.message);
        setRecordingStatus('idle');
      }
    }
  };

  const handlePlayPause = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleConfirm = async () => {
    player.pause();
    player.seekTo(0);
    if (!audioUri) return;
    try {
      setError(null);
      setRecordingStatus('transcribing');
      setTranscript('');
      const transcription = await transcribeAudio(audioUri);
      setRawTranscript(transcription.rawTranscript);
      setTranscript(transcription.rawTranscript);
      setRecordingStatus('editing');
    } catch (err: any) {
      setError(err.message);
      setRecordingStatus('preview');
    }
  };

  const handleUseText = async () => {
    const text = transcript.trim();
    if (!text) {
      setError('कृपया पाठ सम्पादन गर्नुहोस्');
      return;
    }
    setRawTranscript(text);
    setError(null);
    if (DEVANAGARI_RE.test(text)) {
      await processTranscription(text);
      return;
    }
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      setRecordingStatus('translating');
      const translated = await translateTranscript(text);
      setTranscript(translated);
      setRawTranscript(translated);
      setRecordingStatus('editing');
    } catch (err: any) {
      setError(err.message);
      setRecordingStatus('editing');
    } finally {
      processingRef.current = false;
    }
  };

  const handleReRecord = () => {
    player.pause();
    player.seekTo(0);
    setError(null);
    setAudioUri(null);
    setRecordingStatus('idle');
  };

  const statusText = isRecording
    ? 'रेकर्डिङ हुँदैछ...'
    : isEditing
    ? 'पाठ सम्पादन गर्नुहोस्'
    : isPreview
    ? 'रेकर्डिङ तयार छ'
    : recordingStatus === 'transcribing'
    ? 'आवाजबाट पाठ बनाउँदै...'
    : recordingStatus === 'translating'
    ? 'नेपालीमा अनुवाद गर्दै...'
    : recordingStatus === 'processing'
    ? 'दस्तावेज तयार गर्दै...'
    : clarifying
    ? 'जवाफ रेकर्ड गर्नुहोस्'
    : 'बोल्न सुरु गर्नुहोस्';

  const statusHint = isRecording
    ? 'काम सकिएपछि रोक्नुहोस्'
    : isEditing
    ? 'पाठ जाँचेर तलको बटन थिच्नुहोस्'
    : isPreview
    ? 'सुनेर पुष्टि गरेपछि पाठ देखिनेछ'
    : isBusy
    ? 'कृपया केही समय पर्खनुहोस्'
    : clarifying
    ? 'माथिको प्रश्नको जवाफ दिनुहोस्'
    : 'तपाईंको आवाज प्रशासनिक दस्तावेजमा परिवर्तन हुनेछ।';

  const statusColor = isRecording
    ? colors.error
    : isBusy
    ? colors.feedbackInfo
    : isEditing || isPreview || clarifying
    ? colors.tertiary
    : colors.primary;
  const statusIcon = isRecording
    ? 'record-circle-outline'
    : isBusy
    ? 'cog-sync-outline'
    : isEditing
    ? 'file-edit-outline'
    : isPreview
    ? 'check-circle-outline'
    : clarifying
    ? 'help-circle-outline'
    : 'microphone-outline';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      {/* Template Carousel (hide during preview) */}
      {!isPreview && !isBusy && (
        <View style={styles.carouselSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
          >
            {TEMPLATES.map((template) => {
              const isActive = selectedTemplate === template.id;
              return (
                <Pressable
                  key={template.id}
                  onPress={() => setSelectedTemplate(template.id)}
                  disabled={isRecording || isBusy || isEditing}
                  style={[
                    styles.templateChip,
                    isActive && { backgroundColor: template.color, borderColor: template.color },
                    (isRecording || isBusy || isEditing) && styles.disabledControl,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={template.icon}
                    size={16}
                    color={isActive ? '#fff' : template.color}
                  />
                  <Text
                    style={[
                      styles.templateChipLabel,
                      isActive && { color: '#fff' },
                    ]}
                  >
                    {template.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Clarification Banner */}
      {clarifying && gemmaResult?.followUpQuestionNepali && (
        <View style={styles.clarificationBanner}>
          <Text style={styles.clarificationLabel}>प्रश्न:</Text>
          <Text style={styles.clarificationText}>
            {gemmaResult.followUpQuestionNepali}
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner} accessibilityLiveRegion="polite">
          <MaterialCommunityIcons name="alert-circle-outline" size={22} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.content}>
        {/* Waveform */}
        {!isPreview && !isBusy && !isEditing && (
          <View style={styles.waveformContainer}>
            {waveAnims.map((anim, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.waveformBar,
                  {
                    backgroundColor: isRecording
                      ? `rgba(0, 63, 135, ${0.2 + (i / BAR_COUNT) * 0.8})`
                      : `${colors.primary}20`,
                    height: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['8%', '100%'],
                    }),
                  },
                ]}
              />
            ))}
          </View>
        )}

        {/* Preview UI */}
        {isPreview ? (
          <View style={styles.previewSection}>
            <Pressable
              onPress={handlePlayPause}
              disabled={recordingStatus !== 'preview'}
              accessibilityRole="button"
              accessibilityLabel={player.playing ? 'प्ले रोक्नुहोस्' : 'रेकर्डिङ सुन्नुहोस्'}
              style={({ pressed }) => [
                styles.playButton,
                recordingStatus !== 'preview' && styles.disabledButton,
                pressed && { transform: [{ scale: 0.94 }] },
              ]}
            >
              <MaterialCommunityIcons
                name={player.playing ? 'pause' : 'play'}
                size={40}
                color="#fff"
              />
            </Pressable>

            <View style={styles.previewActions}>
              <Pressable
                onPress={handleReRecord}
                disabled={recordingStatus !== 'preview'}
                accessibilityRole="button"
                accessibilityLabel="पुन: रेकर्ड"
                style={({ pressed }) => [
                  styles.previewActionBtn,
                  styles.previewActionReRecord,
                  recordingStatus !== 'preview' && styles.disabledButton,
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <MaterialCommunityIcons name="refresh" size={20} color={colors.error} />
                <Text style={[styles.previewActionLabel, styles.previewActionReRecordLabel]}>पुन: रेकर्ड</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirm}
                disabled={recordingStatus !== 'preview'}
                accessibilityRole="button"
                accessibilityLabel="रेकर्डिङ पुष्टि गर्नुहोस्"
                style={({ pressed }) => [
                  styles.previewActionBtn,
                  styles.previewActionComplete,
                  recordingStatus !== 'preview' && styles.disabledButton,
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <MaterialCommunityIcons name="check" size={20} color="#fff" />
                <Text style={styles.previewActionLabel}>पुष्टि गर्नुहोस्</Text>
              </Pressable>
            </View>
          </View>
        ) : isEditing ? (
          <View style={styles.editingSection}>
            <TextInput
              multiline
              value={transcript}
              onChangeText={setTranscript}
              placeholder={
                  'पाठ सम्पादन गर्नुहोस्...'
              }
              style={styles.transcriptInput}
              textAlignVertical="top"
              editable={isEditing}
            />
            <View style={styles.previewActions}>
              <Pressable
                onPress={handleReRecord}
                disabled={!isEditing}
                accessibilityRole="button"
                accessibilityLabel="पुन: रेकर्ड"
                style={({ pressed }) => [
                  styles.previewActionBtn,
                  styles.previewActionReRecord,
                  !isEditing && styles.disabledButton,
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <MaterialCommunityIcons name="refresh" size={20} color={colors.error} />
                <Text style={[styles.previewActionLabel, styles.previewActionReRecordLabel]}>पुन: रेकर्ड</Text>
              </Pressable>

              <Pressable
                onPress={handleUseText}
                disabled={!isEditing || !transcript.trim()}
                accessibilityRole="button"
                accessibilityLabel={DEVANAGARI_RE.test(transcript) ? 'पाठ प्रयोग गर्नुहोस्' : 'अनुवाद गर्नुहोस्'}
                style={({ pressed }) => [
                  styles.previewActionBtn,
                  styles.previewActionConfirm,
                  { backgroundColor: needsTranslation ? colors.accentWarm : colors.feedbackSuccess },
                  (!isEditing || !transcript.trim()) && styles.disabledButton,
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <MaterialCommunityIcons name={needsTranslation ? 'translate' : 'check'} size={20} color="#fff" />
                <Text style={styles.previewActionLabel}>
                  {needsTranslation ? 'अनुवाद गर्नुहोस्' : 'प्रयोग गर्नुहोस्'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : isBusy ? (
          <View style={styles.busySection}>
            <View style={[styles.busyIcon, { backgroundColor: `${statusColor}15` }]}>
              <ActivityIndicator size="large" color={statusColor} />
            </View>
            <Text style={[styles.busyTitle, { color: statusColor }]}>{statusText}</Text>
            <Text style={styles.busyText}>तपाईंको रेकर्डिङ सुरक्षित छ। यस स्क्रिनबाट बाहिर नजानुहोस्।</Text>
          </View>
        ) : (
          <>
            {/* Mic Button with Pulse Rings */}
            <View style={styles.micSection}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: pulseScale }],
                    opacity: pulseOpacity,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.pulseRing,
                  styles.pulseRingSecond,
                  {
                    transform: [{ scale: pulseScale }],
                    opacity: pulseOpacity,
                  },
                ]}
              />
              <Animated.View style={{ transform: [{ scale: micScale }] }}>
                <Pressable
                  onPress={handleMicPress}
                  disabled={isBusy}
                  accessibilityRole="button"
                  accessibilityLabel={isRecording ? 'रेकर्डिङ रोक्नुहोस्' : 'रेकर्डिङ सुरु गर्नुहोस्'}
                  style={({ pressed }) => [
                    styles.micButton,
                    {
                      backgroundColor: isRecording ? colors.error : colors.primary,
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    },
                    isBusy && styles.disabledButton,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={isRecording ? 'stop' : 'microphone'}
                    size={48}
                    color="#fff"
                  />
                </Pressable>
              </Animated.View>
            </View>
          </>
        )}

        {/* Status Text */}
        {!isBusy && (
          <View style={styles.statusSection}>
            <MaterialCommunityIcons name={statusIcon} size={22} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            <Text style={styles.subtitle}>{statusHint}</Text>
          </View>
        )}

        {/* Context Cards (hide during preview) */}
        {!isPreview && !isBusy && !isEditing && (
          <View style={styles.contextRow}>
            <View style={styles.contextCard}>
              <View
                style={[
                  styles.contextIconBox,
                  { backgroundColor: `${colors.tertiary}10` },
                ]}
              >
                <MaterialCommunityIcons name="translate" size={20} color={colors.tertiary} />
              </View>
              <View>
                <Text style={styles.contextLabel}>LANGUAGE</Text>
                <Text style={styles.contextValue}>नेपाली (NP)</Text>
              </View>
            </View>
            <View style={styles.contextCard}>
              <View
                style={[
                  styles.contextIconBox,
                  { backgroundColor: `${colors.primary}10` },
                ]}
              >
                <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.contextLabel}>TEMPLATE</Text>
                <Text style={styles.contextValue}>
                  {TEMPLATES.find((t) => t.id === selectedTemplate)?.title || 'स्वचालित'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Skip clarification */}
        {clarifying && (
          <Pressable
            onPress={async () => {
              setClarifying(false);
              clearConversationHistory();
              setRecordingStatus('complete');
              if (gemmaResult) {
                addToHistory(rawTranscript || '', gemmaResult);
                navigation.navigate('Document');
              }
            }}
            style={({ pressed }) => [
              styles.skipButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.skipButtonText}>
              अझै पनि दस्तावेज हेर्नुहोस् →
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowTop: {
    position: 'absolute',
    top: -90,
    alignSelf: 'center',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: `${colors.primary}12`,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -110,
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: `${colors.tertiary}0F`,
  },
  carouselSection: {
    paddingTop: spacing.sectionPadding,
    paddingBottom: 8,
  },
  carouselContent: {
    paddingHorizontal: spacing.containerMargin,
    gap: 10,
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceContainerLowest,
  },
  templateChipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMain,
  },
  disabledControl: {
    opacity: 0.45,
  },
  clarificationBanner: {
    marginHorizontal: spacing.containerMargin,
    marginTop: 12,
    padding: 14,
    backgroundColor: `${colors.tertiary}10`,
    borderWidth: 1,
    borderColor: colors.tertiary,
    borderRadius: 12,
  },
  clarificationLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.tertiary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  clarificationText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textMain,
    lineHeight: 28,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: spacing.containerMargin,
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.errorContainer,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.containerMargin,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
    height: 128,
    width: '100%',
    maxWidth: 320,
    marginBottom: 40,
  },
  waveformBar: {
    width: 5,
    borderRadius: 3,
  },
  micSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  pulseRing: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: `${colors.primary}33`,
  },
  pulseRingSecond: {
    backgroundColor: `${colors.primary}1A`,
  },
  micButton: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  previewSection: {    alignItems: 'center',
    marginBottom: 32,
  },
  playButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.45,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 16,
  },
  previewActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  previewActionReRecord: {
    backgroundColor: `${colors.error}20`,
    borderWidth: 1,
    borderColor: colors.error,
  },
  previewActionConfirm: {
    backgroundColor: colors.primary,
  },
  previewActionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  statusText: {
    ...typeScale.sectionTitle,
    marginBottom: 8,
  },
  subtitle: {
    ...typeScale.body,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  contextRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 400,
  },
  contextCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    padding: 14,
  },
  contextIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.textMuted,
  },
  contextValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMain,
  },
  skipButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  busySection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  busyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  busyTitle: {
    ...typeScale.cardTitle,
    textAlign: 'center',
    marginBottom: 8,
  },
  busyText: {
    ...typeScale.body,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  editingSection: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  transcriptInput: {
    backgroundColor: colors.surface,
    minHeight: 160,
    marginBottom: 16,
    fontSize: 16,
  },
});
