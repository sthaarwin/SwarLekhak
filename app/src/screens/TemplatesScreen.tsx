import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing } from '../theme';
import { useDocumentStore } from '../store/useDocumentStore';
import type { DocumentType } from '../types';

const TEMPLATES = [
  {
    id: 'NIVEDAN' as DocumentType,
    title: 'निवेदन',
    description: 'सरकारी कार्यालय वा संस्थाका लागि औपचारिक निवेदन पत्र तयार पार्नुहोस्।',
    icon: '📄',
    iconBg: colors.primaryFixed,
    iconColor: colors.primary,
  },
  {
    id: 'MEDICAL' as DocumentType,
    title: 'स्वास्थ्य सिफारिस',
    description: 'बिदा वा अन्य प्रयोजनका लागि स्वास्थ्य अवस्थाको आधिकारिक सिफारिस।',
    icon: '🏥',
    iconBg: colors.tertiaryFixed,
    iconColor: colors.tertiary,
  },
  {
    id: 'POLICE_REPORT' as DocumentType,
    title: 'एजहार',
    description: 'प्रहरी प्रशासनमा दिइने उजुरी वा घटनाको विस्तृत विवरण।',
    icon: '⚖️',
    iconBg: colors.secondaryContainer,
    iconColor: colors.secondary,
  },
];

export default function TemplatesScreen({ navigation }: any) {
  const { setSelectedTemplate } = useDocumentStore();

  const handleSelect = (template: (typeof TEMPLATES)[0]) => {
    setSelectedTemplate(template.id);
    navigation.navigate('Record');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>टेम्प्लेट छान्नुहोस्</Text>
          <Text style={styles.headerSubtitle}>
            तपाईंले तयार पार्न चाहनुभएको कागजातको प्रकार चयन गर्नुहोस्।
          </Text>
        </View>

        <View style={styles.templateList}>
          {TEMPLATES.map((template) => (
            <Pressable
              key={template.id}
              onPress={() => handleSelect(template)}
              style={({ pressed }) => [
                styles.templateCard,
                pressed && styles.templateCardPressed,
              ]}
            >
              <View
                style={[
                  styles.templateIconBox,
                  { backgroundColor: template.iconBg },
                ]}
              >
                <Text style={styles.templateIcon}>{template.icon}</Text>
              </View>
              <View style={styles.templateInfo}>
                <Text style={styles.templateTitle}>{template.title}</Text>
                <Text style={styles.templateDescription}>
                  {template.description}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.emptyState}>
          <View style={styles.emptyIconBox}>
            <Text style={styles.emptyIcon}>+</Text>
          </View>
          <Text style={styles.emptyText}>
            नयाँ प्रकारको टेम्प्लेट आवश्यक छ? हाम्रो ग्राहक सेवामा सम्पर्क
            गर्नुहोस्।
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
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
  templateList: {
    gap: 12,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    padding: 18,
    gap: 16,
  },
  templateCardPressed: {
    borderColor: colors.primary,
    opacity: 0.9,
  },
  templateIconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateIcon: {
    fontSize: 28,
  },
  templateInfo: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textMain,
  },
  templateDescription: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 20,
  },
  chevron: {
    fontSize: 24,
    color: colors.outlineVariant,
  },
  emptyState: {
    marginTop: 48,
    padding: spacing.sectionPadding,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyIconBox: {
    backgroundColor: colors.surfaceContainer,
    padding: 12,
    borderRadius: 24,
    marginBottom: 12,
  },
  emptyIcon: {
    fontSize: 32,
    color: colors.textMuted,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
