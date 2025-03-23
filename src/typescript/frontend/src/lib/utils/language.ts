import type translations from "../../../public/locales/en-US.json";
export type TranslationKey = keyof typeof translations | (string & Record<never, never>);
