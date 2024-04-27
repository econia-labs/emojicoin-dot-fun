import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

import { EN, languages, LOCAL_STORAGE_KEYS } from "configs";
import { fetchLocale, getLanguageCodeFromLS, translatedTextIncludesVariable } from "./helpers";

import { ContextApi, ContextData, ContextType, Language, TranslationKey, LanguageContextProviderProps } from "./types";

const initialState: ContextType = {
  isFetching: true,
  currentLanguage: EN,
};

const langKey = LOCAL_STORAGE_KEYS.language;
// TODO add type into MAP
export const languageMap = new Map();

// function to translate text not in components
// Usage: const translate = t(language);
//        translate("Some Text")
export const t = (currentLanguage: string | null | undefined) => (key: string) => {
  const translationSet = languageMap.get(currentLanguage) ?? languageMap.get(EN.locale);
  const translatedText = translationSet && translationSet[key] ? translationSet[key] : key;

  return translatedText;
};

const LanguageContext = createContext<ContextApi | null>(null);

const LanguageContextProvider: React.FC<LanguageContextProviderProps> = ({ fallback, children }) => {
  const [state, setState] = useState(() => {
    const codeFromStorage = getLanguageCodeFromLS();

    return {
      ...initialState,
      currentLanguage: codeFromStorage in languages ? languages[codeFromStorage as keyof typeof languages] : EN,
    };
  });

  const { currentLanguage } = state;

  const fetchInitialLocales = async () => {
    // TODO - recheck to remove double logic from line 35
    let codeFromStorage = getLanguageCodeFromLS();

    if (!(codeFromStorage in languages)) {
      codeFromStorage = EN.locale;
    }

    const initialLocale = await fetchLocale(codeFromStorage);

    if (initialLocale) {
      languageMap.set(codeFromStorage, { ...initialLocale });
      localStorage.setItem(langKey, codeFromStorage);
    }

    setState(prevState => ({
      ...prevState,
      isFetching: false,
    }));
  };

  useEffect(() => {
    fetchInitialLocales();
  }, []);

  const changeLanguage = useCallback(async (language: Language) => {
    if (!languageMap.has(language.locale)) {
      setState(prevState => ({
        ...prevState,
        isFetching: true,
      }));

      const locale = await fetchLocale(language.locale);

      if (locale) {
        const enLocale = languageMap.get(EN.locale);
        languageMap.set(language.locale, { ...enLocale, ...locale });
      }

      localStorage.setItem(langKey, language.locale);

      setState(prevState => ({
        ...prevState,
        isFetching: false,
        currentLanguage: language,
      }));
    } else {
      localStorage.setItem(langKey, language.locale);
      setState(prevState => ({
        ...prevState,
        isFetching: false,
        currentLanguage: language,
      }));
    }
  }, []);

  const translate = useCallback(
    (key: TranslationKey, data?: ContextData) => {
      const translationSet = languageMap.get(currentLanguage.locale) ?? languageMap.get(EN.locale);
      const translatedText = translationSet && translationSet[key] ? translationSet[key] : key;

      // Check the existence of at least one combination of %%, separated by 1 or more non space characters
      const includesVariable = translatedTextIncludesVariable(translatedText);

      if (includesVariable && data) {
        let interpolatedText = translatedText;
        Object.keys(data).forEach(dataKey => {
          const templateKey = new RegExp(`%${dataKey}%`, "g");
          interpolatedText = interpolatedText.replace(templateKey, data[dataKey].toString());
        });

        return interpolatedText;
      }

      return translatedText;
    },
    [currentLanguage],
  );

  if (state.isFetching && fallback) {
    return fallback;
  }

  return (
    <LanguageContext.Provider value={{ ...state, changeLanguage, t: translate }}>{children}</LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const languageContext = useContext(LanguageContext);

  if (languageContext === null) {
    throw new Error("Language context is not found");
  }

  return languageContext;
};

export default LanguageContextProvider;
