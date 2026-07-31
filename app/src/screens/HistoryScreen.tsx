import { View, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { useDocumentStore } from '../store/useDocumentStore';
import { colors, spacing } from '../theme';

export default function HistoryScreen() {
  const { history, removeHistoryItem } = useDocumentStore();

  const docTypeLabels: Record<string, string> = {
    NIVEDAN: 'निवेदन',
    MEDICAL: 'स्वास्थ्य सिफारिस',
    POLICE_REPORT: 'प्रहरी उजुरी',
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
              <Text style={styles.emptyIcon}>📋</Text>
            </View>
            <Text style={styles.emptyText}>
              कुनै दस्तावेज इतिहास छैन। कृपया पहिला रेकर्ड गर्नुहोस्।
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {history.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyCardHeader}>
                  <View style={styles.historyCardLeft}>
                    <Text style={styles.historyDocType}>
                      {docTypeLabels[item.result.documentType] ||
                        item.result.documentType}
                    </Text>
                    <Text style={styles.historyConfidence}>
                      {(item.result.confidenceScore * 100).toFixed(0)}%
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleDelete(item.id)}
                    style={({ pressed }) => [
                      styles.deleteButton,
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <Text style={styles.deleteIcon}>🗑</Text>
                  </Pressable>
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
            ))}
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.govBlueDark,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
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
  emptyIcon: {
    fontSize: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
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
    gap: 8,
  },
  historyDocType: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  historyConfidence: {
    fontSize: 14,
    color: colors.tertiary,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 18,
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
