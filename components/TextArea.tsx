import React from 'react';
import { MicrophoneIcon, CopyIcon, CheckIcon, SpeakerIcon, SmallLoadingSpinner } from './icons';

interface TextAreaProps {
    value: string;
    onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder: string;
    readOnly?: boolean;
    maxLength?: number;
    isTyping?: boolean;
    isLoading?: boolean;
    // Microphone props
    isSpeechRecognitionSupported?: boolean;
    isListening?: boolean;
    onMicrophoneClick?: () => void;
    // Output area buttons props
    showCopy?: boolean;
    isCopied?: boolean;
    onCopyClick?: () => void;
    showSpeaker?: boolean;
    isSpeaking?: boolean;
    onSpeakerClick?: () => void;
}

export const TextArea: React.FC<TextAreaProps> = ({
    value,
    onChange,
    placeholder,
    readOnly = false,
    maxLength,
    isTyping,
    isLoading,
    isSpeechRecognitionSupported,
    isListening,
    onMicrophoneClick,
    showCopy,
    isCopied,
    onCopyClick,
    showSpeaker,
    isSpeaking,
    onSpeakerClick,
}) => {
    const charCount = value.length;

    return (
        <div className="relative w-full h-64 md:h-72 group bg-black/20 rounded-2xl border border-white/10 focus-within:border-accent transition-colors duration-300">
             {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                    <SmallLoadingSpinner />
                </div>
            )}
            <textarea
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                readOnly={readOnly}
                maxLength={maxLength}
                className={`relative w-full h-full p-6 resize-none bg-transparent focus:outline-none placeholder-text-secondary text-text-primary z-10 ${readOnly ? 'cursor-default' : ''}`}
                aria-label={readOnly ? "Translation output" : "Text input"}
            />
            {isTyping && <span className="blinking-cursor absolute left-6 top-6 z-20"></span>}
            
            {(showSpeaker || showCopy) && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                    {showSpeaker && (
                         <button
                            onClick={onSpeakerClick}
                            className={`p-2 rounded-full text-text-secondary transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                                isSpeaking 
                                ? 'text-accent bg-accent/20 animate-pulse-glow' 
                                : 'hover:bg-white/10 hover:text-text-primary'
                            }`}
                            aria-label={isSpeaking ? 'Stop speech' : 'Listen to translation'}
                        >
                           <SpeakerIcon />
                        </button>
                    )}
                    {showCopy && (
                         <button
                            onClick={onCopyClick}
                            className="p-2 rounded-full text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            aria-label="Copy to clipboard"
                        >
                            <div className="relative w-6 h-6 flex items-center justify-center">
                                {isCopied && <div className="absolute inset-0 rounded-full bg-accent animate-ripple"></div>}
                                {isCopied ? <CheckIcon /> : <CopyIcon />}
                            </div>
                        </button>
                    )}
                </div>
            )}

            {!readOnly && isSpeechRecognitionSupported && (
                 <button
                    onClick={onMicrophoneClick}
                    className={`absolute bottom-4 left-4 p-3 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent z-20 ${
                        isListening
                            ? 'text-accent bg-accent/20 animate-pulse-glow'
                            : 'text-text-secondary hover:bg-white/10'
                    }`}
                    aria-label={isListening ? 'Stop dictation' : 'Start dictation'}
                >
                    <MicrophoneIcon />
                </button>
            )}
            {!readOnly && maxLength && (
                <div className="absolute bottom-6 right-6 text-xs text-text-secondary z-20">
                    {charCount} / {maxLength}
                </div>
            )}
        </div>
    );
};