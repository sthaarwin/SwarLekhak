import { View, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDocumentStore } from '../store/useDocumentStore';
import { colors, spacing, typeScale } from '../theme';

export default function HistoryScreen() {
  const { history, removeHistoryItem } = useDocumentStore();

  const docTypeMeta: Record<string, { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }> = {
    NIVEDAN: { label: 'निवेदन', icon: 'file-document-outline', color: colors.primary },
    MEDICAL: { label: 'स्वास्थ्य सिफारिस', icon: 'hospital-box-outline', color: colors.tertiary },
    POLICE_REPORT: { label: 'प्रहरी उजुरी', icon: 'scale-balance', color: colors.secondary },
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>इतिहास</Text>
          <Text style={styles.headerSubtitle}>
            तपाईंले सिर्जना गर्नुभएका दस्तावेजहरू
          </Text>
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <MaterialCommunityIcons name="file-search-outline" size={34} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>अहिलेसम्म कुनै दस्तावेज छैन</Text>
            <Text style={styles.emptyText}>
              पहिलो दस्तावेज बनाउन तलको रेकर्ड ट्याबमा गएर बोल्नुहोस्।
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {history.map((item) => {
              const meta = docTypeMeta[item.result.documentType];
              return (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <View style={styles.historyCardLeft}>
                      <View
                        style={[
                          styles.historyIconBox,
                          { backgroundColor: `${meta?.color || colors.primary}14` },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={meta?.icon || 'file-document-outline'}
                          size={20}
                          color={meta?.color || colors.primary}
                        />
                      </View>
                      <Text style={styles.historyDocType}>
                        {meta?.label || item.result.documentType}
                      </Text>
                    </View>
                    <View style={styles.historyCardRight}>
                      <Text style={styles.historyConfidence}>
                        {(item.result.confidenceScore * 100).toFixed(0)}%
                      </Text>
                      <Pressable
                        onPress={() => handleDelete(item.id)}
                        accessibilityRole="button"
                        accessibilityLabel="इतिहासबाट मेटाउनुहोस्"
                        hitSlop={8}
                        style={({ pressed }) => [
                          styles.deleteButton,
                          pressed && { transform: [{ scale: 0.9 }] },
                        ]}
                      >
                        <MaterialCommunityIcons name="delete-outline" size={20} color={colors.error} />
                      </Pressable>
                    </View>
                  </View>
                  <Text style={styles.historyTranscript} numberOfLines={2}>
                    {item.transcript}
                  </Text>
                  <Text style={styles.historyTimestamp}>
                    {new Date(item.timestamp).toLocaleDateString('ne-NP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
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
  },
  header: {
    marginBottom: spacing.stackGap * 2,
  },
  headerTitle: {
    ...typeScale.pageTitle,
    color: colors.govBlueDark,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...typeScale.body,
    color: colors.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textMain,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    padding: 16,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyDocType: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMain,
  },
  historyConfidence: {
    fontSize: 14,
    color: colors.tertiary,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  historyTranscript: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 4,
  },
  historyTimestamp: {
    fontSize: 12,
    color: colors.outlineVariant,
  },
});
