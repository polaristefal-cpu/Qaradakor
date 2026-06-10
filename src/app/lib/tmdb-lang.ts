import { Lang } from "./translations";

// TMDB language codes per app language
export const TMDB_LANG_MAP: Record<Lang, string> = {
  ru: "ru-RU",
  en: "en-US",
  kz: "kk-KZ",   // TMDB supports kk-KZ; falls back to English when no Kazakh translation
};

// Module-level singleton — readable by api.ts without React dependency
let _current = "ru-RU";

export function getTmdbLang(): string {
  return _current;
}

export function setTmdbLang(lang: Lang): void {
  _current = TMDB_LANG_MAP[lang] ?? "ru-RU";
}

// Initialise from localStorage on load
const stored = localStorage.getItem("qaradakor_lang") as Lang | null;
if (stored && TMDB_LANG_MAP[stored]) {
  _current = TMDB_LANG_MAP[stored];
}
