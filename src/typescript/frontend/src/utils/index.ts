import { type AnyEmojiName, CHAT_EMOJI_DATA, SYMBOL_EMOJI_DATA } from "@sdk/emoji_data";
import { sleep } from "@sdk/utils";

export { isDisallowedEventKey } from "./check-is-disallowed-event-key";
export { checkIsEllipsis } from "./check-is-ellipsis";
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

/**
 * Fetch the specified {@link endpoint}, and handle the case where the fetch gets rate limited.
 *
 * Will throw an error if the fetch gets rate limited more than {@link retries} times.
 */
export async function fetchRateLimited<T>(endpoint: string, retries = 3): Promise<T> {
  let data: T;
  let retriesLeft = retries;
  while (retriesLeft > 0) {
    try {
      data = await fetch(endpoint)
        .then(async (res) => {
          if (res.status === 429 && res.headers.get("X-RateLimit-Reset")) {
            throw new Error(res.headers.get("X-RateLimit-Reset")!);
          }
          return res.text();
        })
        .then((res) => parseJSON<T>(res));
      return data;
    } catch (e) {
      const reset = Number((e as Error).message);
      const now = new Date().getTime();
      const waitTime = reset - now;
      await sleep(waitTime + 1000);
      retriesLeft--;
    }
  }
  throw new Error(`Could not get data after retrying ${retries} times.`);
}
