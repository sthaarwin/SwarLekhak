import { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  TextInput as RNTextInput,
  Alert,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NepaliDate from 'nepali-datetime';
import { useDocumentStore } from '../store/useDocumentStore';
import { exportDocumentPdf } from '../services/documentPdfService';
import { colors, spacing, typeScale } from '../theme';

export default function DocumentScreen() {
  const { gemmaResult } = useDocumentStore();
  const shadowAnim = useRef(new Animated.Value(0)).current;

  const [editableFields, setEditableFields] = useState<Record<string, string>>({});
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Animated.timing(shadowAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    if (gemmaResult?.extractedFields) {
      const filtered: Record<string, string> = {};
      for (const [key, val] of Object.entries(gemmaResult.extractedFields)) {
        if (val !== undefined) filtered[key] = val;
      }
      setEditableFields(filtered);
    }
  }, [gemmaResult]);

  if (!gemmaResult) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            कुनै दस्तावेज छैन। कृपया पहिला रेकर्ड गर्नुहोस्।
          </Text>
        </View>
      </View>
    );
  }

  const getDocLabel = (type: string) => {
    switch (type) {
      case 'NIVEDAN': return 'निवेदन';
      case 'UJURI': return 'उजुरी';
      case 'SIFARIS': return 'सिफारिस';
      case 'SAMJHAUTA': return 'सम्झौता';
      case 'RAJINAMA': return 'राजीनामा';
      default: return 'कागजात';
    }
  };
  const docTypeLabel = getDocLabel(gemmaResult.documentType);

  const getField = (key: string, fallback: string = '...........................') =>
    editableFields[key] || fallback;

  const shadowElevation = shadowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  const renderField = (key: string, label: string, fallback?: string) => (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <RNTextInput
        style={styles.fieldInput}
        value={getField(key, fallback)}
        onChangeText={(text) =>
          setEditableFields((prev) => ({ ...prev, [key]: text }))
        }
        placeholder={fallback}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );

  const handleExportPdf = async () => {
    try {
      setExporting(true);
      await exportDocumentPdf(editableFields);
    } catch (err: any) {
      Alert.alert('त्रुटि', 'PDF निर्यात गर्न सकिएन: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.prelabel}>अन्तिम पूर्वावलोकन</Text>
            <Text style={styles.pageTitle}>दस्तावेज पूर्वावलोकन</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusIcon}>✓</Text>
            <Text style={styles.statusText}>तयार छ</Text>
          </View>
        </View>

        {/* Document Canvas */}
        <Animated.View
          style={[
            styles.documentCanvas,
            {
              shadowOpacity: 0.05,
              shadowRadius: shadowElevation,
              elevation: shadowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 4],
              }),
            },
          ]}
        >
          {/* Watermark Header */}
          <View style={styles.docHeader}>
            <View>
              <Text style={styles.govTitle}>नेपाल सरकार</Text>
              <Text style={styles.govSubtitle}>प्रशासनिक सेवा विभाग</Text>
            </View>
            <View>
              {renderField('date', 'मिति', (new NepaliDate() as any).format('YYYY/MM/DD', 'np'))}
            </View>
          </View>

          {/* Editable Content */}
          <View style={styles.docBody}>
            <View style={styles.docSubject}>
              <Text style={styles.subjectPrefix}>विषय: </Text>
              <RNTextInput
                style={styles.subjectInput}
                value={getField('subject')}
                onChangeText={(text) =>
                  setEditableFields((prev) => ({ ...prev, subject: text }))
                }
                placeholder="..........................."
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <Text style={styles.salutation}>महोदय,</Text>

            {renderField('applicantName', 'आवेदकको नाम')}
            {renderField('address', 'ठेगाना')}
            {renderField('wardNo', 'वडा नम्बर')}

            {gemmaResult.documentType === 'UJURI' && (
              <>
                {renderField('incidentDetails', 'घटना विवरण')}
              </>
            )}

            <Text style={styles.docParagraph}>
              यस सम्बन्धमा थप केही जानकारी आवश्यक परेमा कार्यालयको प्रशासन
              शाखामा सम्पर्क राख्न सकिनेछ। यो सिफारिस जारी भएको मितिले ३०
              दिनसम्म मान्य रहने व्यहोरा समेत अनुरोध छ।
            </Text>

            {/* Signature Area */}
            <View style={styles.signatureArea}>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureLabel}>अधिकृत हस्ताक्षर</Text>
                <Text style={styles.signatureName}>
                  नाम: ...........................
                </Text>
                <Text style={styles.signatureName}>
                  दर्जा: शाखा अधिकृत
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.docFooter}>
            यो एक स्वचालित रूपमा उत्पन्न दस्तावेज हो
          </Text>
        </Animated.View>

        {/* Metadata Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: `${colors.primary}10` }]}>
              <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.statLabel}>फाइल प्रकार</Text>
              <Text style={styles.statValue}>{docTypeLabel}</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: `${colors.primary}10` }]}>
              <MaterialCommunityIcons name="translate" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.statLabel}>भाषा</Text>
              <Text style={styles.statValue}>नेपाली (देवनागरी)</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: `${colors.primary}10` }]}>
              <MaterialCommunityIcons name="format-list-bulleted" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.statLabel}>शब्द संख्या</Text>
              <Text style={styles.statValue}>
                {Object.values(editableFields)
                  .filter(Boolean)
                  .join(' ')
                  .split(/\s+/).filter(Boolean).length}
                {' शब्द'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Bar */}
      <View style={styles.actionBar}>
        <Button
          mode="contained"
          icon="file-pdf-box"
          buttonColor={colors.govBlueDark}
          textColor="#fff"
          style={styles.actionBtn}
          labelStyle={styles.actionBtnLabel}
          onPress={handleExportPdf}
          loading={exporting}
          disabled={exporting}
        >
          PDF निर्यात गर्नुहोस्
        </Button>
      </View>
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
    paddingBottom: 180,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.containerMargin,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.stackGap,
  },
  prelabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  pageTitle: {
    ...typeScale.sectionTitle,
    color: colors.govBlueDark,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.tertiary}10`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusIcon: {
    fontSize: 14,
    color: colors.tertiary,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.tertiary,
  },
  documentCanvas: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    padding: spacing.sectionPadding,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: 20,
    marginBottom: 28,
  },
  govTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.govBlueDark,
    textTransform: 'uppercase',
  },
  govSubtitle: {
    fontSize: 14,
    color: colors.secondary,
  },
  docBody: {
    paddingHorizontal: 4,
  },
  docSubject: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    flexWrap: 'wrap',
  },
  subjectPrefix: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.onSurface,
  },
  subjectInput: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.onSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingVertical: 2,
    minWidth: 120,
    textAlign: 'center',
  },
  salutation: {
    fontSize: 18,
    marginBottom: 20,
    color: colors.onSurface,
  },
  fieldRow: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    fontSize: 18,
    color: colors.onSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingVertical: 4,
    lineHeight: 28,
  },
  docParagraph: {
    fontSize: 18,
    lineHeight: 36,
    marginBottom: 20,
    textAlign: 'justify',
    color: colors.onSurface,
  },
  signatureArea: {
    marginTop: 60,
    alignItems: 'flex-end',
  },
  signatureLine: {
    width: 192,
    borderTopWidth: 1,
    borderTopColor: colors.onSurfaceVariant,
    paddingTop: 6,
    alignItems: 'center',
  },
  signatureLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
  },
  signatureName: {
    fontSize: 14,
    color: colors.secondary,
  },
  docFooter: {
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginTop: 20,
    opacity: 0.4,
  },
  statsRow: {
    gap: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    padding: 14,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.secondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMain,
  },
  actionBar: {
    position: 'absolute',
    bottom: 30,
    left: spacing.containerMargin,
    right: spacing.containerMargin,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: `${colors.surfaceContainerHighest}CC`,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 10,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 24,
  },
  actionBtnLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
