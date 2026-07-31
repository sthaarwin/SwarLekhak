import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typeScale } from '../theme';
import { useDocumentStore } from '../store/useDocumentStore';
import type { DocumentType } from '../types';

const TEMPLATES = [
  {
    id: 'NIVEDAN' as DocumentType,
    title: 'निवेदन',
    description: 'सरकारी कार्यालय वा संस्थाका लागि औपचारिक निवेदन पत्र तयार पार्नुहोस्।',
    icon: 'file-document-outline' as keyof typeof MaterialCommunityIcons.glyphMap,
    iconBg: colors.primaryFixed,
    iconColor: colors.primary,
  },
  {
    id: 'MEDICAL' as DocumentType,
    title: 'स्वास्थ्य सिफारिस',
    description: 'बिदा वा अन्य प्रयोजनका लागि स्वास्थ्य अवस्थाको आधिकारिक सिफारिस।',
    icon: 'hospital-box-outline' as keyof typeof MaterialCommunityIcons.glyphMap,
    iconBg: colors.tertiaryFixed,
    iconColor: colors.tertiary,
  },
  {
    id: 'POLICE_REPORT' as DocumentType,
    title: 'एजहार',
    description: 'प्रहरी प्रशासनमा दिइने उजुरी वा घटनाको विस्तृत विवरण।',
    icon: 'scale-balance' as keyof typeof MaterialCommunityIcons.glyphMap,
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
                <MaterialCommunityIcons
                  name={template.icon}
                  size={28}
                  color={template.iconColor}
                />
              </View>
              <View style={styles.templateInfo}>
                <Text style={styles.templateTitle}>{template.title}</Text>
                <Text style={styles.templateDescription}>
                  {template.description}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={26} color={colors.outlineVariant} />
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <MaterialCommunityIcons name="plus-circle-outline" size={24} color={colors.textMuted} />
          <Text style={styles.footerText}>
            नयाँ प्रकारको टेम्प्लेट चाहिन्छ? हामीलाई भन्नुहोस्।
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
    ...typeScale.pageTitle,
    color: colors.govBlueDark,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...typeScale.body,
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateInfo: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textMain,
  },
  templateDescription: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 20,
  },
  footer: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
