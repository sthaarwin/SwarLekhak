import { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Button,
  Card,
  Chip,
  IconButton,
  Surface,
  Text,
  useTheme,
  Portal,
  Modal,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDocumentStore } from '../store/useDocumentStore';
import type { HistoryItem } from '../types';
import { spacing } from '../theme';

export default function HistoryScreen({ navigation }: any) {
  const theme = useTheme();
  const { history, removeHistoryItem, setGemmaResult } = useDocumentStore();
  const [previewItem, setPreviewItem] = useState<HistoryItem | null>(null);

  const docTypeMeta: Record<string, { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
    NIVEDAN: { label: 'निवेदन', icon: 'file-document-outline' },
    UJURI: { label: 'उजुरी', icon: 'scale-balance' },
    SIFARIS: { label: 'सिफारिस', icon: 'certificate-outline' },
    SAMJHAUTA: { label: 'सम्झौता', icon: 'handshake-outline' },
    RAJINAMA: { label: 'राजीनामा', icon: 'exit-to-app' },
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'इतिहास मेटाउने',
      'के तपाईं यो दस्तावेज इतिहास मेटाउन चाहनुहुन्छ? यो कार्य पूर्ववत गर्न सकिँदैन।',
      [
        { text: 'रद्द गर्नुहोस्', style: 'cancel' },
        {
          text: 'मेटाउनुहोस्',
          style: 'destructive',
          onPress: () => removeHistoryItem(id),
        },
      ]
    );
  };

  const handleEditDocument = (id: string) => {
    const item = history.find((entry) => entry.id === id);
    if (!item) return;

    setGemmaResult({
      ...item.result,
      extractedFields: { ...item.result.extractedFields },
      missingRequiredFields: [...(item.result.missingRequiredFields || [])],
    });
    const parentNavigation = navigation.getParent?.();
    if (parentNavigation) {
      parentNavigation.navigate('Document');
    } else {
      navigation.navigate('Document');
    }
  };

  return (
    <Surface style={styles.container} elevation={0}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <Text variant="headlineMedium" style={{ color: theme.colors.primary, marginBottom: 4 }}>
          इतिहास
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: spacing.lg }}>
          तपाईंले सिर्जना गर्नुभएका दस्तावेजहरू
        </Text>

        {history.length === 0 ? (
          <Card mode="outlined" style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <IconButton icon="file-search-outline" size={40} iconColor={theme.colors.onSurfaceVariant} />
              <Text variant="titleMedium" style={{ marginTop: 8 }}>अहिलेसम्म कुनै दस्तावेज छैन</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }}>
                पहिलो दस्तावेज बनाउन तलको रेकर्ड ट्याबमा गएर बोल्नुहोस्।
              </Text>
            </Card.Content>
          </Card>
        ) : (
          history.map((item) => {
            const meta = docTypeMeta[item.result.documentType];
            return (
              <Surface key={item.id} elevation={0} style={[styles.historyCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primaryContainer }]}>
                      <MaterialCommunityIcons name={meta?.icon || 'file-document-outline'} size={24} color={theme.colors.primary} />
                    </View>
                    <View>
                      <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
                        {meta?.label || item.result.documentType}
                      </Text>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {new Date(item.timestamp).toLocaleDateString('ne-NP', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardHeaderRight}>
                    <Chip compact mode="flat" style={{ backgroundColor: `${theme.colors.tertiary}18`, marginRight: 4 }}>
                      {(item.result.confidenceScore * 100).toFixed(0)}%
                    </Chip>
                    <IconButton
                      icon="eye-outline"
                      iconColor={theme.colors.primary}
                      size={20}
                      style={{ margin: 0 }}
                      onPress={() => setPreviewItem(item)}
                    />
                    <IconButton
                      icon="delete-outline"
                      iconColor={theme.colors.error}
                      size={20}
                      style={{ margin: 0 }}
                      onPress={() => handleDelete(item.id)}
                    />
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <Text variant="bodyMedium" numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                    {item.transcript}
                  </Text>
                  <Button
                    mode="contained"
                    icon="file-edit-outline"
                    compact
                    onPress={() => handleEditDocument(item.id)}
                    style={styles.editButton}
                  >
                    सम्पादन
                  </Button>
                </View>
              </Surface>
            );
          })
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={!!previewItem}
          onDismiss={() => setPreviewItem(null)}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: '700' }}>
              {previewItem ? docTypeMeta[previewItem.result.documentType]?.label : ''} (पूर्वावलोकन)
            </Text>
          </View>
          <Divider />
          <ScrollView style={styles.modalScroll}>
            <Text variant="labelMedium" style={{ color: theme.colors.primary, marginBottom: 4 }}>
              रेकर्ड गरिएको पाठ:
            </Text>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, lineHeight: 28, marginBottom: 16 }}>
              {previewItem?.transcript}
            </Text>
            <Text variant="labelMedium" style={{ color: theme.colors.tertiary, marginBottom: 4 }}>
              निकालेका विवरणहरू:
            </Text>
            {previewItem && Object.entries(previewItem.result.extractedFields).map(([key, val]) => val ? (
              <Text key={key} variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 2 }}>
                - {key}: {val}
              </Text>
            ) : null)}
          </ScrollView>
          <Button
            mode="contained"
            onPress={() => {
              const id = previewItem?.id;
              setPreviewItem(null);
              if (id) handleEditDocument(id);
            }}
            style={styles.modalButton}
          >
            सम्पादन गर्नुहोस्
          </Button>
        </Modal>
      </Portal>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.containerMargin,
    paddingTop: spacing.sectionPadding,
    paddingBottom: 100,
    gap: 12,
  },
  emptyCard: {
    marginTop: 40,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  historyCard: {
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  editButton: {
    borderRadius: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 16,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: spacing.lg,
  },
  modalScroll: {
    padding: spacing.lg,
  },
  modalButton: {
    margin: spacing.lg,
  },
});
