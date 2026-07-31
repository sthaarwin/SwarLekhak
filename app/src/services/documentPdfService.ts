import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { ExtractedFields } from '../types';

const getField = (
  fields: Record<string, string | undefined>,
  key: string,
  fallback: string = '...........................'
) => fields[key] || fallback;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const buildDocumentHtml = (fields: ExtractedFields): string => {
  const name = escapeHtml(getField(fields, 'applicantName', '...........................'));
  const address = escapeHtml(getField(fields, 'address', '...........................'));
  const wardNo = escapeHtml(getField(fields, 'wardNo', '---'));
  const subject = escapeHtml(getField(fields, 'subject', '...........................'));
  const date = escapeHtml(getField(fields, 'date', '२०८०/१०/२५'));
  const incidentDetails = escapeHtml(getField(fields, 'incidentDetails', ''));

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Noto Sans Devanagari', 'Arial', sans-serif;
      padding: 40px;
      color: #191c1d;
      line-height: 1.8;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #DEE2E6;
      padding-bottom: 20px;
      margin-bottom: 28px;
    }
    .gov-title {
      font-size: 18px;
      font-weight: 700;
      color: #003366;
      text-transform: uppercase;
    }
    .gov-subtitle {
      font-size: 14px;
      color: #5b5f62;
    }
    .date-text {
      font-size: 14px;
      color: #5b5f62;
    }
    .doc-subject {
      font-size: 22px;
      font-weight: 600;
      text-align: center;
      margin-bottom: 28px;
    }
    .salutation {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .paragraph {
      font-size: 18px;
      line-height: 36px;
      margin-bottom: 20px;
      text-align: justify;
    }
    .field-value {
      font-weight: 700;
    }
    .signature-area {
      margin-top: 60px;
      text-align: right;
    }
    .signature-line {
      display: inline-block;
      border-top: 1px solid #424752;
      padding-top: 6px;
      text-align: center;
    }
    .signature-label {
      font-size: 16px;
      font-weight: 700;
    }
    .signature-name {
      font-size: 14px;
      color: #5b5f62;
    }
    .footer {
      text-align: center;
      font-size: 14px;
      font-style: italic;
      color: #6C757D;
      margin-top: 20px;
      opacity: 0.4;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="gov-title">नेपाल सरकार</div>
      <div class="gov-subtitle">प्रशासनिक सेवा विभाग</div>
    </div>
    <div class="date-text">मिति: ${date}</div>
  </div>

  <div class="doc-subject">विषय: ${subject}</div>

  <div class="salutation">महोदय,</div>

  <p class="paragraph">
    उपरोक्त विषयमा यस कार्यालयको निर्णय अनुसार श्री <span class="field-value">${name}</span>
    लाई आवश्यक प्रक्रिया अगाडि बढाउनका लागि यो सिफारिस पत्र
    प्रदान गरिएको छ। निजले पेश गरेका कागजातहरू र स्थानीय तहको
    प्रतिवेदनका आधारमा यो निर्णय लिइएको हो।
  </p>

  <p class="paragraph">
    ठेगाना: <span class="field-value">${address}</span>
    ${wardNo ? `<br>वडा नं: <span class="field-value">${wardNo}</span>` : ''}
    ${incidentDetails ? `<br>घटना विवरण: <span class="field-value">${incidentDetails}</span>` : ''}
  </p>

  <p class="paragraph">
    यस सम्बन्धमा थप केही जानकारी आवश्यक परेमा कार्यालयको प्रशासन
    शाखामा सम्पर्क राख्न सकिनेछ। यो सिफारिस जारी भएको मितिले ३०
    दिनसम्म मान्य रहने व्यहोरा समेत अनुरोध छ।
  </p>

  <div class="signature-area">
    <div class="signature-line">
      <div class="signature-label">अधिकृत हस्ताक्षर</div>
      <div class="signature-name">नाम: ...........................</div>
      <div class="signature-name">दर्जा: शाखा अधिकृत</div>
    </div>
  </div>

  <div class="footer">यो एक स्वचालित रूपमा उत्पन्न दस्तावेज हो</div>
</body>
</html>`;
};

export const exportDocumentPdf = async (fields: ExtractedFields) => {
  const { uri } = await Print.printToFileAsync({ html: buildDocumentHtml(fields) });
  const isAvailable = await Sharing.isAvailableAsync();

  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'दस्तावेज PDF को रूपमा सेभ गर्नुहोस्',
    });
    return;
  }

  Alert.alert('PDF तयार', `PDF यहाँ सेभ भयो:\n${uri}`);
};
