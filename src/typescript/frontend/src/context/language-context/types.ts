import type translations from "../../../public/locales/en-US.json";

interface Language {
  code: string;
  language: string;
  locale: string;
}

type MaybeObject = Record<never, never>;
export type TranslationKey = keyof typeof translations | (string & MaybeObject);
