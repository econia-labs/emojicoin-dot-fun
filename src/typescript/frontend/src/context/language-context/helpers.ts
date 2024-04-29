import { EN, LOCAL_STORAGE_KEYS, REGEX } from "configs";

export const fetchLocale = async (locale: string) => {
  try {
    const response = await fetch(`/locales/${locale}.json`);

    const data = await response.json();
    return data;
  } catch (e) {
    console.error(`Failed to fetch locale ${locale}`, e);

    return null;
  }
};

export const getLanguageCodeFromLS = () => {
  return localStorage.getItem(LOCAL_STORAGE_KEYS.language) ?? EN.locale;
};

export const translatedTextIncludesVariable = (translatedText: string) => {
  return !!translatedText?.match(REGEX.includesVariableRegex);
};
