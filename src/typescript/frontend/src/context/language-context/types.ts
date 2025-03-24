import type { PropsWithChildren, ReactElement } from "react";

import type translations from "../../../public/locales/en-US.json";

type ContextData = {
  [key: string]: string | number;
};

export interface Language {
  code: string;
  language: string;
  locale: string;
}

type ContextType = {
  isFetching: boolean;
  currentLanguage: Language;
};

interface ContextApi extends ContextType {
  changeLanguage: (language: Language) => void;
  t: TranslateFunction;
}

type MaybeObject = Record<never, never>;
export type TranslationKey = keyof typeof translations | (string & MaybeObject);

type TranslateFunction = (key: TranslationKey, data?: ContextData) => string;

interface LanguageContextProviderProps extends PropsWithChildren<{ fallback: ReactElement }> {}
