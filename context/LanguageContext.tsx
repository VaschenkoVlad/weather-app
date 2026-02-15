import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, type Locale } from '@/constants/translations';

const STORAGE_KEY = '@weather_app_locale';

type TranslationsEn = typeof translations.en;
type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string ? (T[K] extends object ? `${K}` | `${K}.${NestedKeyOf<T[K]>}` : `${K}`) : never }[keyof T] extends infer D
    ? Extract<D, string>
    : never
  : never;
type TranslationKey = NestedKeyOf<TranslationsEn>;

function getNested(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const p of parts) {
    current = (current as Record<string, unknown>)?.[p];
  }
  return typeof current === 'string' ? current : path;
}

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  languageLabel: string;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'en' || stored === 'uk') setLocaleState(stored);
    });
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    AsyncStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => getNested(translations[locale] as Record<string, unknown>, key),
    [locale]
  );

  const languageLabel = locale === 'uk' ? translations.uk.language.ukrainian : translations.en.language.english;

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, languageLabel }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
