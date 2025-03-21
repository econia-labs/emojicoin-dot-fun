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

export const BigIntTrailingNRegex = /^-?(([1-9]\d*)|0)n$/;

// This matches the below pattern: 1234-12-31T23:59:59.666Z
export const DateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export const stringifyJSON = <T>(data: T) =>
  JSON.stringify(data, (_, value) => (typeof value === "bigint" ? `${value}n` : value));

export const parseJSON = <T>(json: string): T =>
  JSON.parse(json, (_, value) => {
    if (typeof value === "string" && BigIntTrailingNRegex.test(value)) {
      return BigInt(value.slice(0, -1));
    }
    if (typeof value === "string" && DateRegex.test(value)) {
      return new Date(value);
    }
    return value;
  }) as T;

export const emoji = (name: AnyEmojiName) =>
  SYMBOL_EMOJI_DATA.hasName(name)
    ? SYMBOL_EMOJI_DATA.byStrictName(name).emoji
    : CHAT_EMOJI_DATA.byStrictName(name).emoji;
