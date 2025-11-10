import type { Language } from '../types';

// Helper function to simulate network delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simple keyword-based language detection mock
const langKeywords: { [key: string]: string[] } = {
    'Spanish': ['hola', 'amigo', 'gracias', 'adiós', 'por favor'],
    'French': ['bonjour', 'merci', 'oui', 'au revoir', 's\'il vous plaît'],
    'German': ['hallo', 'danke', 'guten', 'auf wiedersehen', 'bitte'],
    'Japanese': ['こんにちは', 'ありがとう', 'はい', 'さようなら'],
    'Russian': ['привет', 'спасибо', 'да', 'до свидания'],
    'Chinese (Simplified)': ['你好', '谢谢', '再见'],
};

/**
 * Mock detects the language of a given text.
 * @param text The text to analyze.
 * @returns A promise that resolves to the name of the detected language.
 */
export const detectLanguage = async (text: string): Promise<string> => {
    await sleep(300); // Simulate network latency

    if (!text.trim()) {
        return "English"; // Default for empty input
    }
    
    const lowerCaseText = text.toLowerCase();

    for (const lang in langKeywords) {
        if (langKeywords[lang].some(keyword => lowerCaseText.includes(keyword))) {
            return lang;
        }
    }

    return "English"; // Default if no keywords are found
};

/**
 * Mock translates text from a source language to a target language.
 * @param text The text to translate.
 * @param sourceLang The source language.
 * @param targetLang The target language.
 * @returns A promise that resolves to the "translated" text.
 */
export const translateText = async (
    text: string,
    sourceLang: Language,
    targetLang: Language
): Promise<string> => {
    await sleep(500); // Simulate network latency for translation

    if (!text.trim()) {
        return "";
    }

    // A fun, bee-themed "translation"
    const words = text.split(' ');
    const translatedWords = words.map(word => {
        // Add a "bzz" sound to some words
        if (Math.random() > 0.7) {
            return word + ' bzz';
        }
        return word;
    });

    return `Bzzzt... ${translatedWords.join(' ')}`;
};