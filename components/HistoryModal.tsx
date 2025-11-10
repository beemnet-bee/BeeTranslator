import React, { useEffect, useState } from 'react';
import type { TranslationHistoryItem } from '../types';
import { CloseIcon, TrashIcon, SwapIcon } from './icons';

interface HistoryModalProps {
    isVisible: boolean;
    history: TranslationHistoryItem[];
    onClose: () => void;
    onLoad: (item: TranslationHistoryItem) => void;
    onClear: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
    isVisible,
    history,
    onClose,
    onLoad,
    onClear,
}) => {
    const [shouldRender, setShouldRender] = useState(isVisible);

    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
        } else {
            const timer = setTimeout(() => setShouldRender(false), 200); // match animation duration
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    const handleAnimationEnd = () => {
        if (!isVisible) {
            setShouldRender(false);
        }
    };

    if (!shouldRender) {
        return null;
    }

    return (
        <div 
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                className={`relative w-full max-w-2xl bg-secondary-dark/80 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl flex flex-col ${isVisible ? 'animate-modal-swoop-in' : 'animate-modal-fade-out'}`}
                onClick={(e) => e.stopPropagation()}
                onAnimationEnd={handleAnimationEnd}
            >
                {/* Header */}
                <header className="flex items-center justify-between p-5 border-b border-white/10">
                    <h2 className="text-xl font-bold text-text-primary">Translation History</h2>
                    <div className="flex items-center gap-2">
                        {history.length > 0 && (
                            <button
                                onClick={onClear}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                                aria-label="Clear all history"
                            >
                                <TrashIcon />
                                Clear
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/10 rounded-full transition-colors"
                            aria-label="Close history"
                        >
                            <CloseIcon />
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 p-2 overflow-y-auto max-h-[60vh]">
                    {history.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-text-secondary">
                            Your translation history is empty.
                        </div>
                    ) : (
                        <ul className="space-y-2 p-3">
                            {history.map((item) => (
                                <li
                                    key={item.id}
                                    onClick={() => onLoad(item)}
                                    className="p-4 bg-black/20 rounded-2xl cursor-pointer border border-transparent hover:border-accent hover:bg-accent/10 transition-all group"
                                >
                                    <div className="flex justify-between items-center text-xs text-text-secondary mb-2">
                                        <span>{item.sourceLang.name}</span>
                                        <SwapIcon />
                                        <span>{item.targetLang.name}</span>
                                    </div>
                                    <p className="text-text-primary font-medium truncate mb-1">
                                        {item.inputText}
                                    </p>
                                    <p className="text-accent truncate">
                                        {item.translatedText}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};