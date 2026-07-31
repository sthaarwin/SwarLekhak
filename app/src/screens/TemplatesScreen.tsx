import { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import {
  Card,
  Divider,
  IconButton,
  List,
  Surface,
  Text,
  useTheme,
  Portal,
  Modal,
  Button,
} from 'react-native-paper';
import { useDocumentStore } from '../store/useDocumentStore';
import { spacing } from '../theme';
import type { DocumentType } from '../types';

const TEMPLATES = [
  {
    id: 'NIVEDAN' as DocumentType,
    title: 'निवेदन',
    description: 'सरकारी कार्यालय वा संस्थाका लागि औपचारिक निवेदन पत्र तयार पार्नुहोस्।',
    icon: 'file-document-outline',
  },
  {
    id: 'UJURI' as DocumentType,
    title: 'उजुरी',
    description: 'प्रहरी वा प्रशासनमा दिइने उजुरी वा घटनाको विवरण।',
    icon: 'scale-balance',
  },
  {
    id: 'SIFARIS' as DocumentType,
    title: 'सिफारिस',
    description: 'वडा वा स्थानीय निकायबाट चाहिने सिफारिस पत्र।',
    icon: 'certificate-outline',
  },
  {
    id: 'SAMJHAUTA' as DocumentType,
    title: 'सम्झौता',
    description: 'दुई पक्षबीच हुने लिखित सम्झौता वा कागज।',
    icon: 'handshake-outline',
  },
  {
    id: 'RAJINAMA' as DocumentType,
    title: 'राजीनामा',
    description: 'पद वा जिम्मेवारीबाट राजीनामा दिने औपचारिक पत्र।',
    icon: 'exit-to-app',
  },
];

const PREVIEW_TEXTS: Record<DocumentType, string> = {
  NIVEDAN: "विषय: [विषय]\n\nमहोदय,\nउपरोक्त विषयमा म/हामी [ठेगाना] निवासी [आवेदकको नाम] ले तपसिलको व्यहोरा उल्लेख गरी यो निवेदन पेश गरेको छु। आवश्यक कारबाहीका लागि अनुरोध छ।",
  UJURI: "विषय: उजुरी सम्बन्धमा।\n\nमहोदय,\nमिति [मिति] मा [ठेगाना] मा भएको [घटना विवरण] को विषयलाई लिएर म [आवेदकको नाम] ले यो उजुरी दर्ता गराएको छु। यस विषयमा उचित छानबिन गरी न्याय पाऊँ।",
  SIFARIS: "विषय: सिफारिस गरिएको बारे।\n\nजो जससँग सम्बन्धित छ।\nयस [वडा नम्बर] वडा कार्यालयको अभिलेख अनुसार [ठेगाना] निवासी [आवेदकको नाम] ले पेश गरेको विवरण ठीक साँचो रहेकोले सोही अनुसार सिफारिस गरिन्छ।",
  SAMJHAUTA: "लिखितम सम्झौता पत्र\n\nप्रथम पक्ष: [आवेदकको नाम]\nदोस्रो पक्ष: [अन्य व्यक्तिको नाम]\nहामी दुवै पक्षको आपसी सहमतिमा मिति [मिति] का दिन यो सम्झौता पत्र तयार गरी मान्य हुने शर्तहरू मञ्जुर गरेका छौं।",
  RAJINAMA: "विषय: राजीनामा स्वीकृत गर्ने सम्बन्धमा।\n\nमहोदय,\nम [आवेदकको नाम] ले हाल काम गरिरहेको पदबाट आफ्नो व्यक्तिगत कारणले गर्दा मिति [मिति] देखि लागू हुने गरी यो राजीनामा पेश गरेको छु।",
};

export default function TemplatesScreen({ navigation }: any) {
  const theme = useTheme();
  const { setSelectedTemplate } = useDocumentStore();
  const [previewTemplate, setPreviewTemplate] = useState<DocumentType | null>(null);

  const handleSelect = (template: (typeof TEMPLATES)[0]) => {
    setSelectedTemplate(template.id);
    navigation.navigate('Record');
  };

  return (
    <Surface style={styles.container} elevation={0}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={{ color: theme.colors.primary, marginBottom: 4 }}>
          टेम्प्लेट छान्नुहोस्
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: spacing.lg }}>
          तपाईंले तयार पार्न चाहनुभएको कागजातको प्रकार चयन गर्नुहोस्।
        </Text>

        <Card mode="elevated" elevation={1} style={styles.listCard}>
          {TEMPLATES.map((template, index) => (
            <View key={template.id}>
              {index > 0 && <Divider />}
              <List.Item
                title={template.title}
                description={template.description}
                descriptionNumberOfLines={2}
                left={(props) => (
                  <List.Icon {...props} icon={template.icon} color={theme.colors.primary} />
                )}
                right={(props) => (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <IconButton
                      icon="eye-outline"
                      size={20}
                      onPress={() => setPreviewTemplate(template.id)}
                      iconColor={theme.colors.primary}
                    />
                    <List.Icon {...props} icon="chevron-right" />
                  </View>
                )}
                onPress={() => handleSelect(template)}
                titleStyle={{ fontWeight: '600' }}
              />
            </View>
          ))}
        </Card>

        <View style={styles.footer}>
          <IconButton icon="plus-circle-outline" size={20} iconColor={theme.colors.onSurfaceVariant} />
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            नयाँ प्रकारको टेम्प्लेट चाहिन्छ? हामीलाई भन्नुहोस्।
          </Text>
        </View>
        <Portal>
          <Modal
            visible={!!previewTemplate}
            onDismiss={() => setPreviewTemplate(null)}
            contentContainerStyle={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                {TEMPLATES.find((t) => t.id === previewTemplate)?.title} (पूर्वावलोकन)
              </Text>
            </View>
            <Divider />
            <ScrollView style={styles.modalScroll}>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 28 }}>
                {previewTemplate ? PREVIEW_TEXTS[previewTemplate] : ''}
              </Text>
            </ScrollView>
            <Button
              mode="contained"
              onPress={() => {
                const id = previewTemplate;
                setPreviewTemplate(null);
                if (id) {
                  setSelectedTemplate(id);
                  navigation.navigate('Record');
                }
              }}
              style={styles.modalButton}
            >
              यो टेम्प्लेट प्रयोग गर्नुहोस्
            </Button>
          </Modal>
        </Portal>
      </View>
    </Surface>
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
  listCard: {
    overflow: 'hidden',
  },
  footer: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.md,
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
