export interface Language {
  code: string;
  name: string;
}

export interface TranslationHistoryItem {
  id: string;
  inputText: string;
  translatedText: string;
  sourceLang: Language;
  targetLang: Language;
}
