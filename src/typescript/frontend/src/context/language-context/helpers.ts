import { EN, REGEX } from "configs";
import { readLocalStorageCache } from "configs/local-storage-keys";

export const getLanguageCodeFromLocalStorage = () => {
  if (typeof window === "undefined") {
    return EN.locale;
  }
  return readLocalStorageCache<string>("language") ?? EN.locale;
};

export const translatedTextIncludesVariable = (translatedText: string) => {
  return !!translatedText?.match(REGEX.includesVariableRegex);
};
