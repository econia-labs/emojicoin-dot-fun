import translations from "../../../public/locales/en-US.json";
import type { TranslationKey } from "./types";

/**
 * @returns a translated string, not a function.
 */
export const translationFunction = (): { t: (s: TranslationKey) => string } => {
  return {
    // If S is a key in translations, return the value of that key, otherwise return S.
    t: (s: TranslationKey) => (s in translations ? translations[s] : s),
  };
};
