import { SYMBOL_EMOJI_DATA } from "@sdk/emoji_data/emoji-data";
import { languageList } from "configs";
import { ROUTES } from "router/routes";

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

/**
 * The delimiter for multiple emoji names; i.e.,
 * for splitting "emoji_name_1;emoji_name_2"
 */
export const EMOJI_PATH_DELIMITER = ";";

/**
 * The delimiter for intra-segment emoji names; i.e.,
 * for changing "Happy face emoji" to "Happy_face_emoji".
 */
export const EMOJI_PATH_INTRA_SEGMENT_DELIMITER = "_";

export const ONE_SPACE = " ";

export const emojisToPath = (emojis: string[]) => {
  const names = emojis
    .map((x) => SYMBOL_EMOJI_DATA.byEmoji(x)?.name)
    .filter((x) => typeof x !== "undefined") as string[];
  return emojiNamesToPath(names);
};

export const emojiNamesToPath = (emojiNames: string[]) =>
  emojiNames
    .map((x) => encodeURIComponent(x.replaceAll(ONE_SPACE, EMOJI_PATH_INTRA_SEGMENT_DELIMITER)))
    .join(EMOJI_PATH_DELIMITER);

export const pathToEmojiNames = (path: string) =>
  decodeURIComponent(path)
    .split(EMOJI_PATH_DELIMITER)
    .map((n) => n.replaceAll(EMOJI_PATH_INTRA_SEGMENT_DELIMITER, ONE_SPACE));

/**
 * Used to normalize a potential emojicoin market path by replacing emojis with their properly
 * normalized paths based on our routing conventions.
 * @param pathname
 * @param requestUrlString
 * @returns a normalized path we can redirect to.
 */
export const normalizePossibleMarketPath = (pathname: string, requestUrlString: string) => {
  if (pathname.startsWith(`${ROUTES.market}/`)) {
    const slug = decodeURIComponent(pathname.slice(8));
    const emojis = [...new Intl.Segmenter().segment(slug)].map((x) => x.segment);
    const normalizedPath = emojisToPath(emojis);
    return normalizedPath.length === 0 ? undefined : new URL(`${normalizedPath}`, requestUrlString);
  }
  return undefined;
};
