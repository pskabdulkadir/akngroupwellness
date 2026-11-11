import React, { createContext, useContext, useState, useEffect } from 'react';
import { tr } from '../locales/tr';
import { en } from '../locales/en';

export type Language = 'tr' | 'en';

export const DICTIONARIES: Record<Language, Record<string, string>> = {
  tr,
  en
};

const STORAGE_LANG_KEY = 'aurabio_app_language_v2';

let currentLanguage: Language = 'tr';
const langListeners = new Set<(lang: Language) => void>();

/**
 * Initializes language from LocalStorage or browser language
 */
export function initLanguage(): Language {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_LANG_KEY) as Language;
    if (saved === 'tr' || saved === 'en') {
      currentLanguage = saved;
    } else {
      const browserLang = navigator.language || (navigator.languages && navigator.languages[0]) || 'tr';
      currentLanguage = browserLang.toLowerCase().startsWith('tr') ? 'tr' : 'en';
    }
    document.documentElement.lang = currentLanguage;
  }
  return currentLanguage;
}

/**
 * Gets the current active language
 */
export function getLanguage(): Language {
  return currentLanguage;
}

/**
 * Sets the active language and triggers reactive re-renders across the entire React DOM tree
 */
export function setLanguage(lang: Language): void {
  currentLanguage = lang;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_LANG_KEY, lang);
    document.documentElement.lang = lang;
    window.dispatchEvent(new CustomEvent('aurabio_language_changed', { detail: { language: lang } }));
  }
  langListeners.forEach(listener => {
    try {
      listener(lang);
    } catch (e) {
      console.error('Language listener error:', e);
    }
  });
}

/**
 * Subscribes to language changes
 */
export function subscribeLanguage(callback: (lang: Language) => void): () => void {
  langListeners.add(callback);
  callback(currentLanguage);
  return () => {
    langListeners.delete(callback);
  };
}

/**
 * Global synchronous translation helper function
 */
export function t(key: string, fallback?: string): string {
  const dict = DICTIONARIES[currentLanguage] || DICTIONARIES.tr;
  if (dict[key]) {
    return dict[key];
  }
  // Fallback to Turkish if key exists
  if (DICTIONARIES.tr[key]) {
    return DICTIONARIES.tr[key];
  }
  return fallback || key;
}

// React Context for reactive tree-wide localization
interface LanguageContextType {
  language: Language;
  lang: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  isTurkish: boolean;
  isEnglish: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<Language>(() => initLanguage());

  useEffect(() => {
    const unsub = subscribeLanguage(newLang => {
      setLangState(newLang);
    });
    return () => unsub();
  }, []);

  const handleSetLanguage = (newLang: Language) => {
    setLanguage(newLang);
  };

  const toggleLanguage = () => {
    const next = language === 'tr' ? 'en' : 'tr';
    setLanguage(next);
  };

  const translate = (key: string, fallback?: string): string => {
    const dict = DICTIONARIES[language] || DICTIONARIES.tr;
    if (dict[key]) {
      return dict[key];
    }
    if (DICTIONARIES.tr[key]) {
      return DICTIONARIES.tr[key];
    }
    return fallback || key;
  };

  const value: LanguageContextType = {
    language,
    lang: language,
    setLanguage: handleSetLanguage,
    toggleLanguage,
    t: translate,
    isTurkish: language === 'tr',
    isEnglish: language === 'en'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Primary React Hook for consuming translation strings and reactive language state
 */
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context) {
    return context;
  }
  
  // Fallback hook if outside Provider
  const [lang, setLang] = useState<Language>(() => getLanguage());

  useEffect(() => {
    const unsub = subscribeLanguage(newLang => {
      setLang(newLang);
    });
    return () => unsub();
  }, []);

  return {
    language: lang,
    lang,
    setLanguage,
    toggleLanguage: () => setLanguage(lang === 'tr' ? 'en' : 'tr'),
    t: (key: string, fallback?: string) => {
      const dict = DICTIONARIES[lang] || DICTIONARIES.tr;
      return dict[key] || DICTIONARIES.tr[key] || fallback || key;
    },
    isTurkish: lang === 'tr',
    isEnglish: lang === 'en'
  };
}
