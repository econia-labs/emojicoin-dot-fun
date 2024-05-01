import { Language } from "context/language-context/types";

export const EN: Language = { locale: "en-US", language: "English", code: "en" };

export const languages = {
  "en-US": EN,
};

export const languageList = Object.values(languages);
