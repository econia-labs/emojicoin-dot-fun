import React, { PropsWithChildren } from "react";
import translations from "../../../public/locales/en-US.json";

export type ContextData = {
  [key: string]: string | number;
};

export interface Language {
  code: string;
  language: string;
  locale: string;
}

export type ContextType = {
  isFetching: boolean;
  currentLanguage: Language;
};

export interface ContextApi extends ContextType {
  changeLanguage: (language: Language) => void;
  t: TranslateFunction;
}

type MaybeObject = Record<never, never>;
export type TranslationKey = keyof typeof translations | (string & MaybeObject);

export type TranslateFunction = (key: TranslationKey, data?: ContextData) => string;

export interface LanguageContextProviderProps extends PropsWithChildren<{ fallback: React.ReactElement }> {}
