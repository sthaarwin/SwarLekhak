export type DocumentType = 'NIVEDAN' | 'MEDICAL' | 'POLICE_REPORT';

export type SttModel = 'tiny' | 'base' | 'small';

export type RecordingStatus = 'idle' | 'recording' | 'preview' | 'editing' | 'translating' | 'transcribing' | 'processing' | 'complete' | 'error';

export interface ExtractedFields {
  applicantName?: string;
  address?: string;
  wardNo?: string;
  subject?: string;
  date?: string;
  incidentDetails?: string;
  [key: string]: string | undefined;
}

export interface GemmaAnalysisResult {
  documentType: DocumentType;
  confidenceScore: number;
  extractedFields: ExtractedFields;
  missingRequiredFields: string[];
  followUpQuestionNepali: string | null;
}

export interface TranscriptionResult {
  rawTranscript: string;
  confidence: number;
}

export interface ConversationEntry {
  role: 'user' | 'assistant';
  content: string;
}

export interface HistoryItem {
  id: string;
  transcript: string;
  result: GemmaAnalysisResult;
  timestamp: number;
}

export interface DocumentState {
  recordingStatus: RecordingStatus;
  audioUri: string | null;
  rawTranscript: string | null;
  gemmaResult: GemmaAnalysisResult | null;
  error: string | null;
  selectedTemplate: DocumentType | 'AUTO';
  sttModel: SttModel;
  history: HistoryItem[];
  conversationHistory: ConversationEntry[];
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  updated_at?: string;
}
