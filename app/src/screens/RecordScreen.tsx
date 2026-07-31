import { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import {
  ActivityIndicator,
  Banner,
  Button,
  Card,
  Chip,
  FAB,
  IconButton,
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useAudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useDocumentStore } from '../store/useDocumentStore';
import { transcribeAudio } from '../services/sttService';
import { analyzeWithGemma, translateTranscript } from '../services/gemmaService';
import { startRecording, stopRecording, requestRecordPermission } from '../services/wavRecorderService';
import { colors, spacing } from '../theme';
import type { DocumentType } from '../types';

const BAR_COUNT = 32;
const DEVANAGARI_RE = /[\u0900-\u097F]/;
const TEMPLATES: { id: DocumentType | 'AUTO'; title: string; icon: string }[] = [
  { id: 'AUTO', title: 'स्वचालित', icon: 'auto-fix' },
  { id: 'NIVEDAN', title: 'निवेदन', icon: 'file-document-outline' },
  { id: 'UJURI', title: 'उजुरी', icon: 'scale-balance' },
  { id: 'SIFARIS', title: 'सिफारिस', icon: 'certificate-outline' },
  { id: 'SAMJHAUTA', title: 'सम्झौता', icon: 'handshake-outline' },
  { id: 'RAJINAMA', title: 'राजीनामा', icon: 'exit-to-app' },
];

export default function RecordScreen({ navigation }: any) {
  const theme = useTheme();
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const waveAnims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.15))
  ).current;
  const waveInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [micScale] = useState(() => new Animated.Value(1));
  const [clarifying, setClarifying] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speakingFollowUp, setSpeakingFollowUp] = useState(false);
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
  const followUpQuestion = gemmaResult?.followUpQuestionNepali?.trim() || '';

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
        const val = isRecording ? Math.random() * 0.85 + 0.15 : 0.15;
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
      Speech.stop();
      clearConversationHistory();
    };
  }, []);

  useEffect(() => {
    if (audioUri) {
      player.replace(audioUri);
    }
  }, [audioUri]);

  const stopFollowUpSpeech = useCallback(() => {
    Speech.stop();
    setSpeakingFollowUp(false);
  }, []);

  const speakFollowUp = useCallback((text: string) => {
    const speechText = text.trim();
    if (!speechText) return;

    Speech.stop();
    setSpeakingFollowUp(true);
    Speech.speak(speechText, {
      language: 'ne-NP',
      rate: 0.92,
      pitch: 1,
      onDone: () => setSpeakingFollowUp(false),
      onStopped: () => setSpeakingFollowUp(false),
      onError: () => {
        setSpeakingFollowUp(false);
        setError('प्रश्न सुनाउन सकिएन');
      },
    });
  }, [setError]);

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
        if (result.followUpQuestionNepali) {
          speakFollowUp(result.followUpQuestionNepali);
        }
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
    stopFollowUpSpeech();
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
    stopFollowUpSpeech();
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleConfirm = async () => {
    stopFollowUpSpeech();
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
    stopFollowUpSpeech();
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
    stopFollowUpSpeech();
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
    ? theme.colors.error
    : isBusy
    ? colors.feedbackInfo
    : isEditing || isPreview || clarifying
    ? theme.colors.tertiary
    : theme.colors.primary;

  return (
    <Surface style={styles.container} elevation={0}>
      {!isPreview && !isBusy && (
        <View style={styles.carouselSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
          >
            {TEMPLATES.map((template) => (
              <Chip
                key={template.id}
                selected={selectedTemplate === template.id}
                icon={template.icon}
                onPress={() => setSelectedTemplate(template.id)}
                disabled={isRecording || isBusy || isEditing}
                mode={selectedTemplate === template.id ? 'flat' : 'outlined'}
                showSelectedOverlay
                style={styles.templateChip}
              >
                {template.title}
              </Chip>
            ))}
          </ScrollView>
        </View>
      )}

      {clarifying && gemmaResult?.followUpQuestionNepali && (
        <Banner
          visible
          icon="help-circle-outline"
          style={styles.banner}
          actions={[
            {
              label: speakingFollowUp ? 'रोक्नुहोस्' : 'सुन्नुहोस्',
              onPress: () => {
                if (speakingFollowUp) {
                  stopFollowUpSpeech();
                } else {
                  speakFollowUp(followUpQuestion);
                }
              },
            },
          ]}
        >
          <View style={{ flexDirection: 'column', marginVertical: 4 }}>
            <Text variant="titleSmall" style={{ marginBottom: 4 }}>प्रश्न:</Text>
            <Text variant="bodyLarge">{gemmaResult.followUpQuestionNepali}</Text>
          </View>
        </Banner>
      )}

      {!!error && (
        <Banner
          visible
          icon="alert-circle-outline"
          style={styles.errorBanner}
          actions={[]}
        >
          {error}
        </Banner>
      )}

      <View style={styles.content}>
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
                      : `${theme.colors.primary}33`,
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

        {isPreview ? (
          <View style={styles.actionSection}>
            <FAB
              icon={player.playing ? 'pause' : 'play'}
              onPress={handlePlayPause}
              disabled={recordingStatus !== 'preview'}
              color={theme.colors.primary}
              customSize={80}
              style={styles.fab}
            />
            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                icon="refresh"
                onPress={handleReRecord}
                disabled={recordingStatus !== 'preview'}
                textColor={theme.colors.error}
                style={styles.halfButton}
              >
                पुन: रेकर्ड
              </Button>
              <Button
                mode="contained"
                icon="check"
                onPress={handleConfirm}
                disabled={recordingStatus !== 'preview'}
                style={styles.halfButton}
              >
                पुष्टि गर्नुहोस्
              </Button>
            </View>
          </View>
        ) : isEditing ? (
          <View style={styles.editingSection}>
            <TextInput
              multiline
              value={transcript}
              onChangeText={setTranscript}
              placeholder="पाठ सम्पादन गर्नुहोस्..."
              mode="outlined"
              style={styles.transcriptInput}
              textAlignVertical="top"
              editable={isEditing}
            />
            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                icon="refresh"
                onPress={handleReRecord}
                disabled={!isEditing}
                textColor={theme.colors.error}
                style={styles.halfButton}
              >
                पुन: रेकर्ड
              </Button>
              <Button
                mode="contained"
                icon={needsTranslation ? 'translate' : 'check'}
                onPress={handleUseText}
                disabled={!isEditing || !transcript.trim()}
                buttonColor={needsTranslation ? colors.accentWarm : colors.feedbackSuccess}
                style={styles.halfButton}
              >
                {needsTranslation ? 'अनुवाद गर्नुहोस्' : 'प्रयोग गर्नुहोस्'}
              </Button>
            </View>
          </View>
        ) : isBusy ? (
          <View style={styles.busySection}>
            <Surface style={[styles.busyIcon, { backgroundColor: `${statusColor}18` }]} elevation={1}>
              <ActivityIndicator size="large" color={statusColor} />
            </Surface>
            <Text variant="titleLarge" style={{ color: statusColor, textAlign: 'center' }}>
              {statusText}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
              तपाईंको रेकर्डिङ सुरक्षित छ। यस स्क्रिनबाट बाहिर नजानुहोस्।
            </Text>
          </View>
        ) : (
          <View style={styles.micSection}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                  backgroundColor: `${theme.colors.primary}33`,
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
                  backgroundColor: `${theme.colors.primary}18`,
                },
              ]}
            />
            <Animated.View style={{ transform: [{ scale: micScale }] }}>
              <FAB
                icon={isRecording ? 'stop' : 'microphone'}
                onPress={handleMicPress}
                disabled={isBusy}
                color={isRecording ? theme.colors.error : theme.colors.primary}
                customSize={80}
                style={styles.fab}
              />
            </Animated.View>
          </View>
        )}

        {!isBusy && (
          <View style={styles.statusSection}>
            <Chip
              icon={
                isRecording ? 'record-circle-outline'
                : isEditing ? 'file-edit-outline'
                : isPreview ? 'check-circle-outline'
                : clarifying ? 'help-circle-outline'
                : 'microphone-outline'
              }
              mode="flat"
              style={{ backgroundColor: `${statusColor}18` }}
              textStyle={{ color: statusColor, fontWeight: '600' }}
            >
              {statusText}
            </Chip>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}
            >
              {statusHint}
            </Text>
          </View>
        )}

        {!isPreview && !isBusy && !isEditing && (
          <View style={styles.contextRow}>
            <Surface 
              elevation={0}
              style={[
                styles.contextCardMain,
                { backgroundColor: theme.colors.tertiaryContainer }
              ]}
            >
              <View style={styles.contextCardInner}>
                <View style={[styles.contextIconWrapper, { backgroundColor: '#ffffff66' }]}>
                  <IconButton icon="translate" size={20} iconColor={theme.colors.tertiary} style={styles.contextIcon} />
                </View>
                <View style={styles.contextTextColumn}>
                  <Text variant="labelSmall" style={{ color: theme.colors.tertiary, opacity: 0.85 }}>भाषा</Text>
                  <Text variant="titleMedium" style={{ color: theme.colors.onTertiaryContainer, fontWeight: '700' }}>नेपाली</Text>
                </View>
              </View>
            </Surface>
            <Surface 
              elevation={0} 
              style={[
                styles.contextCardMain,
                { backgroundColor: theme.colors.primaryContainer }
              ]}
            >
              <View style={styles.contextCardInner}>
                <View style={[styles.contextIconWrapper, { backgroundColor: '#ffffff66' }]}>
                  <IconButton icon="file-document-outline" size={20} iconColor={theme.colors.primary} style={styles.contextIcon} />
                </View>
                <View style={styles.contextTextColumn}>
                  <Text variant="labelSmall" style={{ color: theme.colors.primary, opacity: 0.85 }}>टेम्प्लेट</Text>
                  <Text variant="titleMedium" numberOfLines={1} style={{ color: theme.colors.onPrimaryContainer, fontWeight: '700' }}>
                    {TEMPLATES.find((t) => t.id === selectedTemplate)?.title || 'स्वचालित'}
                  </Text>
                </View>
              </View>
            </Surface>
          </View>
        )}

        {clarifying && (
          <Button
            mode="text"
            onPress={async () => {
              stopFollowUpSpeech();
              setClarifying(false);
              clearConversationHistory();
              setRecordingStatus('complete');
              if (gemmaResult) {
                addToHistory(rawTranscript || '', gemmaResult);
                navigation.navigate('Document');
              }
            }}
            style={styles.skipButton}
          >
            अझै पनि दस्तावेज हेर्नुहोस् →
          </Button>
        )}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  carouselSection: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  carouselContent: {
    paddingHorizontal: spacing.containerMargin,
    gap: spacing.sm,
  },
  templateChip: {
    marginRight: 4,
  },
  banner: {
    marginHorizontal: spacing.containerMargin,
    marginTop: spacing.sm,
  },
  errorBanner: {
    marginHorizontal: spacing.containerMargin,
    marginTop: spacing.sm,
    backgroundColor: colors.errorContainer,
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
    height: 100,
    width: '100%',
    maxWidth: 320,
    marginBottom: spacing.lg,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
  },
  micSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    height: 120,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  pulseRingSecond: {},
  fab: {
    borderRadius: 40,
  },
  actionSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    maxWidth: 360,
  },
  halfButton: {
    flex: 1,
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  contextRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    maxWidth: 400,
    marginTop: spacing.sm,
  },
  contextCardMain: {
    flex: 1,
    borderRadius: 24,
  },
  contextCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: 8,
  },
  contextIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  contextIcon: {
    margin: 0,
  },
  contextTextColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  skipButton: {
    marginTop: spacing.sm,
  },
  busySection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  busyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  editingSection: {
    alignSelf: 'stretch',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  transcriptInput: {
    minHeight: 180,
    backgroundColor: 'transparent',
  },
});
