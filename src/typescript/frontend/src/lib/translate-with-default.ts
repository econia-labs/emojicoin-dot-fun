import { EN } from "configs";
import { getLanguageCodeFromLocalStorage } from "context/language-context/helpers";
import { type TranslationKey } from "context/language-context/types";
import fetchLocale from "./fetch-locale";

// For server-side translation. It doesn't have all of the functionality
// of the language context provider, but it will translate using the fetched
// locale dictionary + English dictionary.
export const translateWithDefault = async (text: string): Promise<string> => {
  const languageCode = getLanguageCodeFromLocalStorage();

  const localeDictionary = await fetchLocale(languageCode);
  let dictionary: Record<TranslationKey, string> = localeDictionary;

  if (languageCode !== EN.language) {
    const enLocaleDictionary = await fetchLocale(EN.language);
    dictionary = { ...enLocaleDictionary, ...dictionary };
  }

  if (text in dictionary) {
    return dictionary[text];
  }
  return text;
};

export default translateWithDefault;
