import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Lang, TKey } from "./translations";
import { setTmdbLang, TMDB_LANG_MAP } from "./tmdb-lang";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
  /** TMDB locale string (e.g. "ru-RU", "en-US", "kk-KZ") — use as useEffect dependency
   *  so pages re-fetch movie data when the language changes. */
  tmdbLang: string;
}

const LangContext = createContext<LangContextValue>({
  lang: "ru",
  setLang: () => {},
  t: (key) => translations[key].ru,
  tmdbLang: "ru-RU",
});

const STORAGE_KEY = "qaradakor_lang";

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "ru" || stored === "en" || stored === "kz") return stored;
    // Auto-detect from browser
    const browser = navigator.language.slice(0, 2).toLowerCase();
    if (browser === "en") return "en";
    if (browser === "kk") return "kz";
    return "ru";
  });

  const [tmdbLang, setTmdbLangState] = useState<string>(
    TMDB_LANG_MAP[lang] ?? "ru-RU"
  );

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
    const newTmdb = TMDB_LANG_MAP[l] ?? "ru-RU";
    setTmdbLang(l);           // sync global module used by api.ts
    setTmdbLangState(newTmdb); // trigger re-renders / useEffect deps
  };

  // Sync global on first render (in case of SSR or hot-reload edge cases)
  useEffect(() => {
    setTmdbLang(lang);
  }, []);

  const t = (key: TKey): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] ?? entry.ru ?? key;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t, tmdbLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
