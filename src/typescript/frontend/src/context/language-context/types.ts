import type translations from "../../../public/locales/en-US.json";

type MaybeObject = Record<never, never>;
export type TranslationKey = keyof typeof translations | (string & MaybeObject);
