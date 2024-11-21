import { type AnyEmojiName, CHAT_EMOJI_DATA, SYMBOL_EMOJI_DATA } from "@sdk/emoji_data";

export { checkIsEllipsis } from "./check-is-ellipsis";
export { getFileNameFromSrc } from "./get-file-name-from-src";
export {
  removeLangParamFromPathname,
  removeTrailingSlashIfExists,
  cutLocaleFromRoute,
  getLocaleFromRoute,
} from "./pathname-helpers";
export { getStylesFromResponsiveValue } from "./styled-components-helpers";
export { isDisallowedEventKey } from "./check-is-disallowed-event-key";
export { getEmptyListTr } from "./get-empty-list-tr";

export function stringifyJSON<T>(data: T) {
  return JSON.stringify(data, (_, value) => {
    if (typeof value === "bigint") return value.toString() + "n";
    return value;
  });
}

export const parseJSON = <T>(json: string): T =>
  JSON.parse(json, (_, value) => {
    if (typeof value === "string" && /^\d+n$/.test(value)) {
      return BigInt(value.substring(0, value.length - 1));
    }
    // This matches the below pattern: 1234-12-31T23:59:59.666Z
    const dateRegex = /^\d{4}-\d{2}-\d2T\d{2}:\d{2}:\d{2}.\d*Z$/;
    if (typeof value === "string" && dateRegex.test(value)) {
      return new Date(value);
    }
    return value as T;
  });

export const emoji = (name: AnyEmojiName) =>
  SYMBOL_EMOJI_DATA.hasName(name)
    ? SYMBOL_EMOJI_DATA.byStrictName(name).emoji
    : CHAT_EMOJI_DATA.byStrictName(name).emoji;
