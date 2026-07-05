'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Lichtgewicht i18n voor de (client-rendered) pagina's. Elke pagina levert zijn
// eigen vertaaltabel { nl, en, es } aan via useT(dict) — zo blijven vertalingen
// naast de tekst staan i.p.v. in één gigantisch centraal bestand.

export type Lang = 'nl' | 'en' | 'es';

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'en', label: 'English', flag: '🇬🇾' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export const DEFAULT_LANG: Lang = 'nl';
const STORAGE_KEY = 'jobparsing_lang';

function isLang(v: unknown): v is Lang {
  return v === 'nl' || v === 'en' || v === 'es';
}

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextValue>({ lang: DEFAULT_LANG, setLang: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  // Voorkeur uit localStorage laden na mount (SSR kent geen localStorage).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isLang(stored) && stored !== lang) setLangState(stored);
    } catch {
      /* localStorage niet beschikbaar — blijf bij standaard */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next;
    } catch {
      /* negeer */
    }
  }, []);

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  return useContext(LangContext);
}

/**
 * Kies de juiste variant uit een per-pagina vertaaltabel. Valt terug op NL als
 * een taal (nog) ontbreekt, zodat een gedeeltelijke vertaling nooit crasht.
 */
export function useT<T extends Partial<Record<Lang, unknown>>>(dict: T): NonNullable<T['nl']> {
  const { lang } = useLang();
  return (dict[lang] ?? dict.nl) as NonNullable<T['nl']>;
}
