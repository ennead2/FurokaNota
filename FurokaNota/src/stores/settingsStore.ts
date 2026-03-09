import { create } from 'zustand';

type OcrProvider = 'claude' | 'tesseract';

interface SettingsState {
  ocrProvider: OcrProvider;
  claudeApiKey: string;
  setOcrProvider: (provider: OcrProvider) => void;
  setClaudeApiKey: (key: string) => void;
}

const LS_KEY_PROVIDER = 'furoka_ocr_provider';
const LS_KEY_APIKEY = 'furoka_claude_apikey';

export const useSettingsStore = create<SettingsState>((set) => ({
  ocrProvider: (localStorage.getItem(LS_KEY_PROVIDER) as OcrProvider) || 'tesseract',
  claudeApiKey: localStorage.getItem(LS_KEY_APIKEY) || '',

  setOcrProvider: (provider) => {
    localStorage.setItem(LS_KEY_PROVIDER, provider);
    set({ ocrProvider: provider });
  },

  setClaudeApiKey: (key) => {
    localStorage.setItem(LS_KEY_APIKEY, key);
    set({ claudeApiKey: key });
  },
}));
