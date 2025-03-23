import translations from "../../../public/locales/en-US.json";

/**
 * For now, since we only provide English translations, there's no reason to even have a context provider anywhere.
 * @returns a translated string.
 */
export const translationFunction = (): { t: (s: string) => string } => {
  return {
    t: (s: string) => (s in translations ? translations[s] : s),
  };
};
