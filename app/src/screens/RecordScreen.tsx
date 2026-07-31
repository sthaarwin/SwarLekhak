import { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  ScrollView,
} from 'react-native';
import { Text } from 'react-native-paper';
import { TextInput } from 'react-native-paper';
import { useAudioPlayer } from 'expo-audio';
import { useDocumentStore } from '../store/useDocumentStore';
import { transcribeAudio } from '../services/sttService';
import { analyzeWithGemma, translateTranscript } from '../services/gemmaService';
import { startRecording, stopRecording, requestRecordPermission } from '../services/wavRecorderService';
import { colors, spacing } from '../theme';
import type { DocumentType } from '../types';

const BAR_COUNT = 32;
const TEMPLATES: { id: DocumentType | 'AUTO'; title: string; icon: string; color: string }[] = [
  { id: 'AUTO', title: 'स्वचालित', icon: '🤖', color: colors.primary },
  { id: 'NIVEDAN', title: 'निवेदन', icon: '📄', color: colors.govBlueDark },
  { id: 'MEDICAL', title: 'स्वास्थ्य', icon: '🏥', color: colors.tertiary },
  { id: 'POLICE_REPORT', title: 'प्रहरी उजुरी', icon: '⚖️', color: colors.secondary },
];

export default function RecordScreen({ navigation }: any) {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const waveAnims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.15))
  ).current;
  const waveInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [micScale] = useState(() => new Animated.Value(1));
  const [clarifying, setClarifying] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isEditingTranslation, setIsEditingTranslation] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const processingRef = useRef(false);
  const player = useAudioPlayer(null);

  const log = useCallback((msg: string) => {
    console.log('[Record]', msg);
    setDebugLog((prev) => [msg, ...prev].slice(0, 8));
  }, []);

  const {
    recordingStatus,
    setRecordingStatus,
    setAudioUri,
    setRawTranscript,
    setGemmaResult,
    setError,
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
    if (recordedUri) {
      player.replace(recordedUri);
    }
  }, [recordedUri]);

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
        setRecordedUri(null);
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
        setRecordedUri(null);
        if (result.documentType) {
          navigation.navigate('Document');
        }
      }
    } catch (err: any) {
      setError(err.message);
      setRecordedUri(null);
      setRecordingStatus('idle');
    } finally {
      processingRef.current = false;
    }
  };

  const handleMicPress = async () => {
    if (isRecording) {
      try {
        log('Stopping recording...');
        const uri = await stopRecording();
        log('Recording saved: ' + uri);
        setRecordedUri(uri);
        setAudioUri(uri);
        if (!uri) {
          setError('अडियो रेकर्ड गर्न सकिएन');
          setRecordingStatus('idle');
          return;
        }
        setRecordingStatus('preview');
      } catch (err: any) {
        log('ERROR stopping: ' + err.message);
        setError(err.message);
        setRecordingStatus('idle');
      }
    } else {
      try {
        log('Requesting mic permission...');
        const hasPermission = await requestRecordPermission();
        if (!hasPermission) {
          setError('माइक्रोफोन अनुमति आवश्यक छ');
          return;
        }
        setError(null);
        log('Starting recording...');
        await startRecording();
        log('Recording started');
        setRecordingStatus('recording');
        setAudioUri(null);
      } catch (err: any) {
        log('ERROR starting: ' + err.message);
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
    if (!recordedUri) return;
    try {
      setRecordingStatus('transcribing');
      setLiveTranscript('');
      setTranslatedText('');
      setIsEditingTranslation(false);
      const transcription = await transcribeAudio(recordedUri);
      setRawTranscript(transcription.rawTranscript);
      setLiveTranscript(transcription.rawTranscript);
      setRecordingStatus('editing');
    } catch (err: any) {
      setError(err.message);
      setRecordingStatus('preview');
    }
  };

  const handleUseTranscript = async () => {
    const text = liveTranscript.trim();
    if (!text) {
      setError('कृपया पाठ सम्पादन गर्नुहोस्');
      return;
    }
    setRawTranscript(text);

    const isDevanagari = /[\u0900-\u097F]/.test(text);
    if (isDevanagari) {
      log('Already Nepali — skipping translation');
      setIsEditingTranslation(false);
      await processTranscription(text);
      return;
    }

    if (processingRef.current) return;
    processingRef.current = true;
    try {
      setRecordingStatus('translating');
      log('Translating...');
      const translated = await translateTranscript(text);
      log('Translated: ' + translated.substring(0, 60));
      setTranslatedText(translated);
      setIsEditingTranslation(true);
      setRecordingStatus('editing');
    } catch (err: any) {
      log('ERROR translating: ' + err.message);
      setIsEditingTranslation(false);
      setRecordingStatus('editing');
    } finally {
      processingRef.current = false;
    }
  };

  const handleUseTranslation = async () => {
    const text = translatedText.trim();
    if (!text) {
      setError('कृपया अनुवाद सम्पादन गर्नुहोस्');
      return;
    }
    setRawTranscript(text);
    setIsEditingTranslation(false);
    await processTranscription(text);
  };

  const handleReRecord = () => {
    player.pause();
    player.seekTo(0);
    setRecordedUri(null);
    setAudioUri(null);
    setRecordingStatus('idle');
  };

  const statusText = isRecording
    ? 'रेकर्डिङ हुँदैछ...'
    : recordingStatus === 'editing'
    ? 'पाठ सम्पादन गर्नुहोस्'
    : isPreview
    ? 'रेकर्डिङ तयार छ'
    : recordingStatus === 'transcribing'
    ? 'लिप्यन्तरण हुँदै...'
    : recordingStatus === 'translating'
    ? 'नेपालीमा अनुवाद हुँदै...'
    : recordingStatus === 'processing'
    ? 'प्रशोधन हुँदै...'
    : clarifying
    ? 'जवाफ रेकर्ड गर्नुहोस्'
    : 'बोल्न सुरु गर्नुहोस्';

  const statusColor = isRecording ? colors.error : recordingStatus === 'editing' ? colors.tertiary : isPreview ? colors.tertiary : clarifying ? colors.tertiary : colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.dotPattern} pointerEvents="none" />

      {/* Template Carousel (hide during preview) */}
      {!isPreview && (
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
                  style={[
                    styles.templateChip,
                    isActive && { backgroundColor: template.color, borderColor: template.color },
                  ]}
                >
                  <Text style={styles.templateChipIcon}>{template.icon}</Text>
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

      <View style={styles.content}>
        {/* Waveform */}
        {!isPreview && (
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
              style={({ pressed }) => [
                styles.playButton,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.playButtonIcon}>
                {player.playing ? '⏸' : '▶️'}
              </Text>
            </Pressable>

            <View style={styles.previewActions}>
              <Pressable
                onPress={handleReRecord}
                style={({ pressed }) => [
                  styles.previewActionBtn,
                  styles.previewActionReRecord,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.previewActionIcon}>🔄</Text>
                <Text style={styles.previewActionLabel}>पुन: रेकर्ड</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirm}
                style={({ pressed }) => [
                  styles.previewActionBtn,
                  styles.previewActionConfirm,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.previewActionIcon}>✅</Text>
                <Text style={styles.previewActionLabel}>पुष्टि गर्नुहोस्</Text>
              </Pressable>
            </View>
          </View>
        ) : recordingStatus === 'editing' || recordingStatus === 'transcribing' || recordingStatus === 'translating' ? (
          <View style={styles.editingSection}>
            <TextInput
              multiline
              value={isEditingTranslation ? translatedText : liveTranscript}
              onChangeText={isEditingTranslation ? setTranslatedText : setLiveTranscript}
              placeholder={
                recordingStatus === 'transcribing'
                  ? 'लिप्यन्तरण हुँदैछ...'
                  : recordingStatus === 'translating'
                  ? 'नेपालीमा अनुवाद गर्दैछ...'
                  : isEditingTranslation
                  ? 'अनुवाद सम्पादन गर्नुहोस्...'
                  : 'लिप्यन्तरण सम्पादन गर्नुहोस्...'
              }
              style={styles.transcriptInput}
              textAlignVertical="top"
              editable={recordingStatus === 'editing'}
            />
            <View style={styles.previewActions}>
              <Pressable
                onPress={handleReRecord}
                style={({ pressed }) => [
                  styles.previewActionBtn,
                  styles.previewActionReRecord,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.previewActionIcon}>🔄</Text>
                <Text style={styles.previewActionLabel}>पुन: रेकर्ड</Text>
              </Pressable>

              <Pressable
                onPress={isEditingTranslation ? handleUseTranslation : handleUseTranscript}
                style={({ pressed }) => [
                  styles.previewActionBtn,
                  styles.previewActionConfirm,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.previewActionIcon}>✅</Text>
                <Text style={styles.previewActionLabel}>
                  {isEditingTranslation ? 'प्रयोग गर्नुहोस्' : 'अनुवाद गर्नुहोस्'}
                </Text>
              </Pressable>
            </View>
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
                  style={({ pressed }) => [
                    styles.micButton,
                    {
                      backgroundColor: isRecording ? colors.error : colors.primary,
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    },
                  ]}
                >
                  <Text style={styles.micIcon}>
                    {isRecording ? '⏹' : '🎤'}
                  </Text>
                </Pressable>
              </Animated.View>
            </View>
          </>
        )}

        {/* Status Text */}
        <View style={styles.statusSection}>
          <Text
            style={[
              styles.statusText,
              { color: statusColor },
            ]}
          >
            {statusText}
          </Text>
          <Text style={styles.subtitle}>
            {recordingStatus === 'editing'
              ? 'पाठ सम्पादन गरेर प्रयोग गर्नुहोस्'
              : isPreview
              ? 'आफ्नो रेकर्डिङ सुन्नुहोस् र पुष्टि गर्नुहोस्'
              : clarifying
              ? 'माथिको प्रश्नको जवाफ दिनुहोस्'
              : 'तपाईंको आवाज प्रशासनिक दस्तावेजमा परिवर्तन हुनेछ।'}
          </Text>
        </View>

        {/* Context Cards (hide during preview) */}
        {!isPreview && (
          <View style={styles.contextRow}>
            <View style={styles.contextCard}>
              <View
                style={[
                  styles.contextIconBox,
                  { backgroundColor: `${colors.tertiary}10` },
                ]}
              >
                <Text style={[styles.contextIcon, { color: colors.tertiary }]}>
                  🌐
                </Text>
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
                <Text style={[styles.contextIcon, { color: colors.primary }]}>
                  📄
                </Text>
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

        {/* Debug Log */}
        {__DEV__ && (
          <View style={styles.debugPanel}>
            {debugLog.map((line, i) => (
              <Text key={i} style={styles.debugLine}>{line}</Text>
            ))}
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
  dotPattern: {
    ...StyleSheet.absoluteFill,
    opacity: 0.05,
    backgroundColor: 'transparent',
    backgroundImage:
      'radial-gradient(circle at 2px 2px, #003f87 1px, transparent 0)',
    backgroundSize: '32px 32px',
  } as any,
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
  templateChipIcon: {
    fontSize: 16,
  },
  templateChipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMain,
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
  micIcon: {
    fontSize: 48,
  },
  previewSection: {
    alignItems: 'center',
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
  playButtonIcon: {
    fontSize: 40,
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
  previewActionIcon: {
    fontSize: 20,
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
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
  contextIcon: {
    fontSize: 20,
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
  debugPanel: {
    marginTop: 12,
    padding: 10,
    alignSelf: 'stretch',
    backgroundColor: '#000',
    borderRadius: 8,
    minHeight: 30,
  },
  debugLine: {
    fontSize: 11,
    color: '#0f0',
    fontFamily: 'monospace',
    lineHeight: 16,
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
