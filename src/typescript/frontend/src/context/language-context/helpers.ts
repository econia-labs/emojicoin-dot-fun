import { EN, LOCAL_STORAGE_KEYS, REGEX } from "configs";

export const getLanguageCodeFromLocalStorage = () => {
  if (typeof window === "undefined") {
    return EN.locale;
  }
  return localStorage.getItem(LOCAL_STORAGE_KEYS.language) ?? EN.locale;
};

export const translatedTextIncludesVariable = (translatedText: string) => {
  return !!translatedText?.match(REGEX.includesVariableRegex);
};
