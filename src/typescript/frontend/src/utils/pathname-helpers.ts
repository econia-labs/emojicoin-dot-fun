import { languageList } from "configs";

export const removeLangParamFromPathname = (pathname: string, language?: string) => {
  return pathname
    .split("/")
    .filter((item) => item !== language)
    .join("/");
};

export const cutLocaleFromRoute = (pathname: string) => {
  const currentLang = getLocaleFromRoute(pathname);
  if (currentLang) {
    return removeLangParamFromPathname(pathname, currentLang);
  }
  return pathname;
};

export const getLocaleFromRoute = (pathname: string) => {
  const maybeLanguageParam = pathname.split("/").filter((item) => !!item)[0];
  if (languageList.some((item) => item.locale === maybeLanguageParam)) {
    return maybeLanguageParam;
  }
  return "";
};

export const removeTrailingSlashIfExists = (path: string) => {
  if (path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
};

export const emojiNamesToPath = (emojiNames: string[]) =>
  emojiNames.map((x) => encodeURIComponent(x.replace(/ /g, "_"))).join(";");

export const pathToEmojiNames = (path: string) =>
  decodeURIComponent(path)
    .split(";")
    .map((n) => n.replace(/_/g, " "));
