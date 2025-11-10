import React, { useState, useCallback, useRef, useEffect } from 'react';
import { LanguageSelector } from './components/LanguageSelector';
import { TextArea } from './components/TextArea';
import { HistoryModal } from './components/HistoryModal';
import { SwapIcon, CloseIcon, BeeIcon, HistoryIcon, ShareIcon, TrashIcon } from './components/icons';
import { LANGUAGES } from './constants';
import { translateText, detectLanguage } from './services/geminiService';
import type { Language, TranslationHistoryItem } from './types';

// FIX: Add types for the non-standard SpeechRecognition API which is not included in standard TypeScript DOM typings.
declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
        // FIX: Add webkitAudioContext for browser compatibility to resolve TypeScript error.
        webkitAudioContext: typeof AudioContext;
    }

    interface SpeechRecognition {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onstart: () => void;
        onresult: (event: SpeechRecognitionEvent) => void;
        onerror: (event: SpeechRecognitionErrorEvent) => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
    }

    interface SpeechRecognitionEvent {
        readonly results: SpeechRecognitionResultList;
        readonly resultIndex: number;
    }

    interface SpeechRecognitionResultList {
        [index: number]: SpeechRecognitionResult;
        readonly length: number;
    }

    interface SpeechRecognitionResult {
        [index: number]: SpeechRecognitionAlternative;
        readonly isFinal: boolean;
    }

    interface SpeechRecognitionAlternative {
        readonly transcript: string;
    }

    interface SpeechRecognitionErrorEvent {
        error: string;
    }
}

const App: React.FC = () => {
    const [inputText, setInputText] = useState<string>('');
    const [translatedText, setTranslatedText] = useState<string>('');
    const [displayedText, setDisplayedText] = useState<string>('');
    const [sourceLang, setSourceLang] = useState<Language>(LANGUAGES[0]);
    const [targetLang, setTargetLang] = useState<Language>(LANGUAGES[1]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const [translationId, setTranslationId] = useState(0);
    const [isListening, setIsListening] = useState<boolean>(false);
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
    const [isHistoryVisible, setIsHistoryVisible] = useState<boolean>(false);

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const copyTimeoutRef = useRef<number | null>(null);
    
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    const isSpeechRecognitionSupported = !!SpeechRecognition;
    const isSpeechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const isShareSupported = typeof navigator !== 'undefined' && !!navigator.share;
    
    // Load history from localStorage on initial render
    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('translationHistory');
            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            }
        } catch (e) {
            console.error("Failed to parse translation history:", e);
        }
    }, []);

    // Save history to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('translationHistory', JSON.stringify(history));
        } catch (e) {
            console.error("Failed to save translation history:", e);
        }
    }, [history]);

    const handleTranslate = useCallback(async (textToTranslate: string, fromLang: Language, toLang: Language) => {
        if (!textToTranslate.trim()) {
            return;
        }

        setIsLoading(true);
        setError(null);
        setTranslatedText('');
        setDisplayedText('');
        if (isSpeechSynthesisSupported) {
            window.speechSynthesis.cancel();
        }

        try {
            let actualSourceLang = fromLang;
            
            if (fromLang.code === 'auto') {
                const detectedLangName = await detectLanguage(textToTranslate);
                const foundLang = LANGUAGES.find(
                    (lang) => lang.name.toLowerCase() === detectedLangName.toLowerCase()
                );

                if (!foundLang || foundLang.code === 'auto') {
                    throw new Error(`Language "${detectedLangName}" is not supported or could not be identified.`);
                }
                
                actualSourceLang = foundLang;
                setSourceLang(actualSourceLang); // Update UI to show detected language
                
                if (actualSourceLang.code === toLang.code) {
                    setTranslatedText(textToTranslate);
                    setTranslationId(id => id + 1);
                    setIsLoading(false);
                    return;
                }
            }
            
            const result = await translateText(textToTranslate, actualSourceLang, toLang);
            setTranslatedText(result);
            setTranslationId(id => id + 1);

            // Add to history
            const newHistoryItem: TranslationHistoryItem = {
                id: crypto.randomUUID(),
                inputText: textToTranslate,
                translatedText: result,
                sourceLang: actualSourceLang,
                targetLang: toLang,
            };

            setHistory(prev => {
                const isDuplicate = prev[0]?.inputText === newHistoryItem.inputText && prev[0]?.translatedText === newHistoryItem.translatedText;
                if (isDuplicate) return prev;
                return [newHistoryItem, ...prev].slice(0, 10);
            });


        } catch (err: any) {
            setError(err.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [isSpeechSynthesisSupported]);


    useEffect(() => {
        // Cleanup speech recognition and timers on component unmount
        return () => {
            recognitionRef.current?.stop();
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
            if (isSpeechSynthesisSupported) {
                window.speechSynthesis.cancel();
            }
        };
    }, [isSpeechSynthesisSupported]);

    useEffect(() => {
        if (translatedText) {
            setIsTyping(true);
            setDisplayedText('');
            const words = translatedText.split(/(\s+)/); // Split by spaces and keep them
            let i = 0;
            const intervalId = setInterval(() => {
                if (i < words.length) {
                    setDisplayedText(prev => prev + words[i]);
                    i++;
                } else {
                    clearInterval(intervalId);
                    setIsTyping(false);
                }
            }, 50);

            return () => clearInterval(intervalId);
        }
    }, [translatedText, translationId]);

    // Auto-translation with debounce
    useEffect(() => {
        if (!inputText.trim()) {
            setTranslatedText('');
            setDisplayedText('');
            setIsLoading(false);
            return;
        }

        const debounceTimer = setTimeout(() => {
            handleTranslate(inputText, sourceLang, targetLang);
        }, 500); // 500ms delay after user stops typing

        return () => {
            clearTimeout(debounceTimer);
        };
    }, [inputText, sourceLang, targetLang, handleTranslate]);


    const handleSwapLanguages = () => {
        if (sourceLang.code === 'auto') return;
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        setInputText(displayedText);
        setTranslatedText(inputText);
        setTranslationId(id => id + 1);
        if (isSpeechSynthesisSupported) {
            window.speechSynthesis.cancel();
        }
    };

    const handleCopyToClipboard = () => {
        if (displayedText && !isTyping && !isCopied) {
            navigator.clipboard.writeText(displayedText);
            setIsCopied(true);
            copyTimeoutRef.current = window.setTimeout(() => setIsCopied(false), 2000);
        }
    };
    
    const handleSpeak = useCallback(() => {
        if (!isSpeechSynthesisSupported || !displayedText || isTyping) return;

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(displayedText);
        utterance.lang = targetLang.code;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => {
            setError("Sorry, an error occurred during speech synthesis.");
            setIsSpeaking(false);
        };
        
        window.speechSynthesis.speak(utterance);
    }, [isSpeechSynthesisSupported, displayedText, isTyping, isSpeaking, targetLang.code]);


    const handleToggleListening = () => {
        if (!isSpeechRecognitionSupported) return;

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            const recognition = new SpeechRecognition();
            recognition.lang = sourceLang.code === 'auto' ? navigator.language : sourceLang.code;
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onstart = () => setIsListening(true);
            recognition.onresult = (event) => {
                 let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                         setInputText(prev => prev + event.results[i][0].transcript);
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
            };
            recognition.onerror = (event) => {
                setError(`Speech recognition error: ${event.error}`);
                setIsListening(false);
            };
            recognition.onend = () => setIsListening(false);
            recognition.start();
            recognitionRef.current = recognition;
        }
    };

    const handleClearInput = () => {
        setInputText('');
    };

    const handleShare = async () => {
        if (isShareSupported && displayedText && !isTyping) {
            try {
                await navigator.share({
                    title: 'Bee Translator Text',
                    text: displayedText,
                });
            } catch (err) {
                console.error('Share failed:', err);
                setError('Could not share translation.');
            }
        }
    };
    
    const handleLoadFromHistory = (item: TranslationHistoryItem) => {
        setInputText(item.inputText);
        setTranslatedText(item.translatedText);
        setSourceLang(item.sourceLang);
        setTargetLang(item.targetLang);
        setTranslationId(id => id + 1);
        setIsHistoryVisible(false);
    };
    
    const handleClearHistory = () => {
        setHistory([]);
    };

    return (
         <div className="min-h-screen w-full flex flex-col items-center justify-start md:justify-center p-4 font-sans">
            <main className="w-full max-w-5xl mx-auto flex flex-col gap-6">
                <header className="text-center animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <h1 className="text-4xl md:text-5xl font-bold text-text-primary tracking-wider flex items-center justify-center gap-4 drop-shadow-[0_0_15px_rgba(0,245,212,0.3)]">
                       <BeeIcon /> Bee Translator
                    </h1>
                </header>

                <div className="p-1.5 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 px-6 py-6 bg-primary-dark/50 rounded-2xl">

                        {/* Source Column */}
                        <div className="w-full flex flex-col gap-4">
                             <LanguageSelector
                                languages={LANGUAGES}
                                selectedLanguage={sourceLang}
                                onLanguageChange={(lang) => { setSourceLang(lang); if (isSpeechSynthesisSupported) window.speechSynthesis.cancel(); }}
                                isSource={true}
                            />
                            <TextArea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Enter text..."
                                maxLength={5000}
                                isSpeechRecognitionSupported={isSpeechRecognitionSupported}
                                isListening={isListening}
                                onMicrophoneClick={handleToggleListening}
                            />
                        </div>

                        {/* Swap Button Column */}
                        <div className="w-full md:w-auto flex justify-center items-center py-2 md:py-0">
                           <button
                                onClick={handleSwapLanguages}
                                disabled={sourceLang.code === 'auto'}
                                className="p-3 rounded-full text-text-secondary disabled:text-gray-600 disabled:cursor-not-allowed transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                aria-label="Swap languages"
                            >
                                <SwapIcon />
                            </button>
                        </div>

                        {/* Target Column */}
                        <div className="w-full flex flex-col gap-4">
                            <LanguageSelector
                                languages={LANGUAGES}
                                selectedLanguage={targetLang}
                                onLanguageChange={(lang) => { setTargetLang(lang); if (isSpeechSynthesisSupported) window.speechSynthesis.cancel(); }}
                                isSource={false}
                            />
                            <TextArea
                                value={displayedText}
                                placeholder={isLoading ? '' : "Translation"}
                                readOnly
                                isLoading={isLoading}
                                isTyping={isTyping}
                                showCopy={!!displayedText && !isLoading && !isTyping}
                                isCopied={isCopied}
                                onCopyClick={handleCopyToClipboard}
                                showSpeaker={isSpeechSynthesisSupported && !!displayedText && !isLoading && !isTyping}
                                isSpeaking={isSpeaking}
                                onSpeakerClick={handleSpeak}
                            />
                        </div>
                    </div>
                </div>
                 
                 {/* Action Hub */}
                <div className="flex items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                    <button onClick={handleClearInput} disabled={!inputText} aria-label="Clear input text" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-text-secondary bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:text-text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                       <TrashIcon /> Clear
                    </button>
                    <button onClick={() => setIsHistoryVisible(true)} aria-label="View translation history" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-text-secondary bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:text-text-primary transition-all disabled:opacity-50">
                        <HistoryIcon /> History
                    </button>
                    {isShareSupported && (
                        <button onClick={handleShare} disabled={!displayedText || isTyping} aria-label="Share translation" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-text-secondary bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:text-text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            <ShareIcon /> Share
                        </button>
                    )}
                </div>

                {error && (
                    <div className="p-4 bg-red-900/50 text-red-200 border border-red-500/50 rounded-2xl flex items-center justify-between animate-fade-in-up">
                        <span className="font-medium">{error}</span>
                        <button onClick={() => setError(null)} className="p-1 rounded-full text-red-300 hover:bg-red-500/20">
                            <CloseIcon />
                        </button>
                    </div>
                )}
            </main>
            <HistoryModal
                isVisible={isHistoryVisible}
                history={history}
                onClose={() => setIsHistoryVisible(false)}
                onLoad={handleLoadFromHistory}
                onClear={handleClearHistory}
            />
        </div>
    );
};

export default App;