import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DocumentState, GemmaAnalysisResult, RecordingStatus, DocumentType, ConversationEntry, SttModel } from '../types';
import { getStorage } from './storage';

interface DocumentStore extends DocumentState {
  setRecordingStatus: (status: RecordingStatus) => void;
  setAudioUri: (uri: string | null) => void;
  setRawTranscript: (transcript: string | null) => void;
  setGemmaResult: (result: GemmaAnalysisResult | null) => void;
  setError: (error: string | null) => void;
  setSelectedTemplate: (template: DocumentType | 'AUTO') => void;
  setSttModel: (model: SttModel) => void;
  addToHistory: (transcript: string, result: GemmaAnalysisResult) => void;
  removeHistoryItem: (id: string) => void;
  addToConversationHistory: (entry: ConversationEntry) => void;
  clearConversationHistory: () => void;
  clearRecordingState: () => void;
  reset: () => void;
}

const initialState: DocumentState = {
  recordingStatus: 'idle',
  audioUri: null,
  rawTranscript: null,
  gemmaResult: null,
  error: null,
  selectedTemplate: 'AUTO',
  sttModel: 'base',
  history: [],
  conversationHistory: [],
};

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set) => ({
      ...initialState,

      setRecordingStatus: (status) => set({ recordingStatus: status }),
      setAudioUri: (uri) => set({ audioUri: uri }),
      setRawTranscript: (transcript) => set({ rawTranscript: transcript }),
      setGemmaResult: (result) => set({ gemmaResult: result }),
      setError: (error) => set({ error }),
      setSelectedTemplate: (template) => set({ selectedTemplate: template }),
      setSttModel: (model) => set({ sttModel: model }),

      addToHistory: (transcript, result) =>
        set((state) => ({
          history: [
            ...state.history,
            {
              id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
              transcript,
              result,
              timestamp: Date.now(),
            },
          ],
        })),

      removeHistoryItem: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),

      addToConversationHistory: (entry) =>
        set((state) => ({
          conversationHistory: [...state.conversationHistory, entry],
        })),

      clearConversationHistory: () => set({ conversationHistory: [] }),

      clearRecordingState: () =>
        set({
          recordingStatus: 'idle',
          audioUri: null,
          rawTranscript: null,
          gemmaResult: null,
          error: null,
        }),

      reset: () => set(initialState),
    }),
    {
      name: 'swar-lekhak-store',
      storage: createJSONStorage(() => getStorage()),
      partialize: (state) => ({
        history: state.history,
        selectedTemplate: state.selectedTemplate,
        sttModel: state.sttModel,
      }),
    }
  )
);
