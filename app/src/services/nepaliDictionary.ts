const DICTIONARY: Record<string, string> = {
  ujuri: 'उजुरी',
  ujjuri: 'उजुरी',
  nibedan: 'निवेदन',
  nivedan: 'निवेदन',
  nibedana: 'निवेदन',
  police: 'प्रहरी',
  polis: 'प्रहरी',
  daktar: 'डाक्टर',
  daktaar: 'डाक्टर',
  doctor: 'डाक्टर',
  hospital: 'अस्पताल',
  aspatal: 'अस्पताल',
  aspataal: 'अस्पताल',
  naam: 'नाम',
  thau: 'ठाउँ',
  gau: 'गाउँ',
  gaun: 'गाउँ',
  jilla: 'जिल्ला',
  zilla: 'जिल्ला',
  nagar: 'नगर',
  ward: 'वडा',
  wada: 'वडा',
  bibad: 'विवाद',
  adhikrit: 'अधिकृत',
  karyalaya: 'कार्यालय',
  sahayog: 'सहयोग',
  sampark: 'सम्पर्क',
  swastha: 'स्वास्थ्य',
  swasthya: 'स्वास्थ्य',
  siksha: 'शिक्षा',
  shiksha: 'शिक्षा',
  nagarik: 'नागरिक',
  nagaarik: 'नागरिक',
  samaj: 'समाज',
  mantralaya: 'मन्त्रालय',
  jillaadhikari: 'जिल्ला प्रशासन कार्यालय',
  jailla: 'जेल',
  thahili: 'स्थानीय',
  praman: 'प्रमाण',
  pramanpatra: 'प्रमाणपत्र',
  avakash: 'अवकाश',
  bida: 'बिदा',
  chhutti: 'छुट्टी',
};

export function normalizeNepaliWords(text: string): string {
  let result = text;
  for (const [roman, devanagari] of Object.entries(DICTIONARY)) {
    result = result.replace(
      new RegExp(`\\b${roman}\\b`, 'gi'),
      devanagari
    );
  }
  return result;
}
