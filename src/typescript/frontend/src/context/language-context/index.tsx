import translations from "../../../public/locales/en-US.json";
import { type TranslationKey } from "./types";

export const simpleTranslation = (s: TranslationKey) => translations[s];

/**
 * There is no reason to pollute the entire codebase with useContext(LanguageContext) when we only have
 * a single language context. To avoid heavily refactoring the entire app, we'll just have `useTranslation` return
 * the context value.
 *
 * If we want to provide the translation later, we can re-add this hook and make it so that it returns a component
 * <p> that wraps the children with the context provider. This way we can isolate server components from client
 * components without polluting the entire app.
 *
 * For now, since we only provide English translations, there's no reason to even have a context provider anywhere.
 *
 * @returns a translated string, not a function.
 */
export const translationFunction = (): { t: (s: TranslationKey) => string } => {
  /*
  const languageContext = useContext(LanguageContext);

  if (languageContext === null) {
    throw new Error("Language context is not found");
  }

  return languageContext;
  */

  return {
    //If S is a key in translations, return the value of that key, otherwise return S
    t: (s: TranslationKey) => (s in translations ? translations[s] : s),
  };
};
