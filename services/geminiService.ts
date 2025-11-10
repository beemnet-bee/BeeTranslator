import { GoogleGenAI } from '@google/genai';
import type { Language } from '../types';

// The API key is expected to be available in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Detects the language of a given text using the Gemini API.
 * @param text The text to analyze.
 * @returns A promise that resolves to the name of the detected language.
 */
export const detectLanguage = async (text: string): Promise<string> => {
    if (!text.trim()) {
        return "English"; // Default for empty input
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Identify the language of the following text. Respond with only the name of the language (e.g., 'Spanish', 'Japanese'). Do not add any other words, punctuation, or explanations.\n\nText: "${text}"\n\nLanguage:`,
            config: {
                temperature: 0,
            }
        });
        
        const detectedLanguage = response.text;
        if (typeof detectedLanguage !== 'string' || !detectedLanguage.trim()) {
            throw new Error("Language detection failed: API returned an invalid or empty response.");
        }
        
        return detectedLanguage.trim();
    } catch (error) {
        console.error("Error in detectLanguage:", error);
        throw new Error("Could not detect the language. Please try again.");
    }
};

/**
 * Translates text from a source language to a target language using the Gemini API.
 * @param text The text to translate.
 * @param sourceLang The source language.
 * @param targetLang The target language.
 * @returns A promise that resolves to the translated text.
 */
export const translateText = async (
    text: string,
    sourceLang: Language,
    targetLang: Language
): Promise<string> => {
    if (!text.trim()) {
        return "";
    }
    
    try {
        const response = await ai.models.generateContent({
            // Use the more powerful model for higher quality translations
            model: 'gemini-2.5-pro',
            contents: `Translate the following text from ${sourceLang.name} to ${targetLang.name}. Provide a translation that is not only accurate but also captures the full nuance, tone, and style of the original text. Pay close attention to idioms, cultural references, and the level of formality. Provide only the raw translated text as your response, without any additional explanations, prefixes, or markdown.\n\nText to translate: "${text}"\n\nTranslation:`,
            config: {
                 // Lower temperature for more focused and deterministic output, favoring accuracy.
                 temperature: 0.3,
            }
        });
        
        const translatedText = response.text;
        if (typeof translatedText !== 'string' || !translatedText.trim()) {
            throw new Error("Translation failed: API returned an invalid or empty response.");
        }
        
        return translatedText.trim();
    } catch (error) {
        console.error("Error in translateText:", error);
        throw new Error(`Failed to translate to ${targetLang.name}. Please try again.`);
    }
};