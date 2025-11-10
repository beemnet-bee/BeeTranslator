import React, { useState, useEffect, useRef } from 'react';
import type { Language } from '../types';
import { ChevronDownIcon, SearchIcon } from './icons';

interface LanguageSelectorProps {
    languages: Language[];
    selectedLanguage: Language;
    onLanguageChange: (language: Language) => void;
    isSource: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    languages,
    selectedLanguage,
    onLanguageChange,
    isSource,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const selectorRef = useRef<HTMLDivElement>(null);

    const availableLanguages = isSource ? languages : languages.filter(lang => lang.code !== 'auto');

    const filteredLanguages = availableLanguages.filter(lang =>
        lang.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (language: Language) => {
        onLanguageChange(language);
        setIsOpen(false);
        setSearchTerm('');
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative group w-full" ref={selectorRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-full h-14 px-6 bg-black/20 rounded-2xl border border-white/10 hover:border-white/20 transition-colors duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-accent"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="text-text-primary font-medium">{selectedLanguage.name}</span>
                <div className="absolute right-5 text-text-secondary group-hover:text-accent transition-colors">
                    <ChevronDownIcon />
                </div>
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 w-full max-h-80 bg-secondary-dark/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg z-30 flex flex-col overflow-hidden">
                    <div className="relative p-2">
                         <input
                            type="text"
                            placeholder="Search language..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-10 px-10 bg-black/30 text-text-primary rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
                            autoFocus
                        />
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-text-secondary">
                            <SearchIcon />
                        </div>
                    </div>
                    <ul className="flex-1 overflow-y-auto p-2" role="listbox">
                        {filteredLanguages.map((lang) => (
                            <li
                                key={lang.code}
                                onClick={() => handleSelect(lang)}
                                className={`px-4 py-2 text-left rounded-md cursor-pointer transition-colors ${
                                    selectedLanguage.code === lang.code
                                        ? 'bg-accent/20 text-accent font-semibold'
                                        : 'text-text-secondary hover:bg-white/10 hover:text-text-primary'
                                }`}
                                role="option"
                                aria-selected={selectedLanguage.code === lang.code}
                            >
                                {lang.name}
                            </li>
                        ))}
                         {filteredLanguages.length === 0 && (
                            <li className="px-4 py-2 text-center text-text-secondary">
                                No languages found.
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};
