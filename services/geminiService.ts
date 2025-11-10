import type { Language } from '../types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const API_KEY = process.env.API_KEY;

/**
 * A helper function to call the OpenAI API.
 * @param model The OpenAI model to use.
 * @param messages The array of messages for the chat completion.
 * @returns A promise that resolves to the content of the response.
 */
const callOpenAI = async (model: string, messages: object[]): Promise<string> => {
    if (!API_KEY) {
        throw new Error("API key is not configured. Please set the API_KEY environment variable.");
    }

    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.3, // Favor accuracy
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API Error:", errorData);
        throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (typeof content !== 'string' || !content.trim()) {
        throw new Error("API returned an invalid or empty response.");
    }
    
    return content.trim();
}

/**
 * Detects the language of a given text using the OpenAI API.
 * @param text The text to analyze.
 * @returns A promise that resolves to the name of the detected language.
 */
export const detectLanguage = async (text: string): Promise<string> => {
    if (!text.trim()) {
        return "English"; // Default for empty input
    }

    try {
        const messages = [
            {
                role: 'system',
                content: "You are a language detection expert. Your only task is to identify the language of the user's text. Respond with only the name of the language (e.g., 'Spanish', 'Japanese'). Do not add any other words, punctuation, or explanations."
            },
            {
                role: 'user',
                content: `Identify the language of the following text:\n\n"${text}"`
            }
        ];

        // Use a fast and efficient model for this simple task
        return await callOpenAI('gpt-4o-mini', messages);
    } catch (error) {
        console.error("Error in detectLanguage:", error);
        throw new Error("Could not detect the language. Please try again.");
    }
};

/**
 * Translates text from a source language to a target language using the OpenAI API.
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
        const messages = [
            {
                role: 'system',
                content: `You are an expert translator. Your task is to translate text from ${sourceLang.name} to ${targetLang.name}. Provide a translation that is not only accurate but also captures the full nuance, tone, and style of the original text. Pay close attention to idioms, cultural references, and the level of formality. Provide ONLY the raw translated text as your response, without any additional explanations, prefixes, or markdown.`
            },
            {
                role: 'user',
                content: `Translate the following text:\n\n"${text}"`
            }
        ];

        // Use a powerful model for high-quality translation
        return await callOpenAI('gpt-4o', messages);
    } catch (error) {
        console.error("Error in translateText:", error);
        throw new Error(`Failed to translate to ${targetLang.name}. Please try again.`);
    }
};