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

export const stringifyJSON = (data: object) =>
  JSON.stringify(data, (_, value) => (typeof value === "bigint" ? value.toString() + "n" : value));

export const parseJSON = (json: string) =>
  JSON.parse(json, (_, value) => {
    if (typeof value === "string" && /^\d+n$/.test(value)) {
      return BigInt(value.substring(0, value.length - 1));
    }
    return value;
  });
