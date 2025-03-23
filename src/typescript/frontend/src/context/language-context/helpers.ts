import { EN } from "configs";
import { readLocalStorageCache } from "configs/local-storage-keys";

export const getLanguageCodeFromLocalStorage = () => {
  if (typeof window === "undefined") {
    return EN.locale;
  }
  return readLocalStorageCache<string>("language") ?? EN.locale;
};
