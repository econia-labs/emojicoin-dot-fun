"use server";

import { LIMIT } from "@sdk/queries/const";
import cached from "../cached";
import { postgrest } from "@sdk/queries/inbox-url";
import { REVALIDATION_TIME } from "lib/server-env";
import { revalidateTag } from "next/cache";
import { symbolBytesToEmojis } from "@sdk/emoji_data/utils";
import { type PostgrestError } from "@sdk/types/postgrest-types";

export const fetchNumMarkets = async () => {
  return await cached(
    async () => {
      const { count, error } = await postgrest
        .from("market_data")
        .select("*", { count: "exact", head: true });
      if (error || count === null) {
        throw new Error("Failed to fetch the number of markets.");
      }
      return count;
    },
    ["num-markets"],
    {
      tags: ["num-markets"],
      revalidate: REVALIDATION_TIME,
    }
  )();
};

/**
 * The query for getting the static data for all registered markets. Since we cache the inner calls,
 * we can make this call repeatedly and expect it to miss the cache at most a single time, sometimes
 * not at all.
 */
export const fetchAggregateMarkets = async () => {
  let shouldContinue = true;
  const aggregated: Array<
    {
      symbolBytes: `0x${string}`;
      marketID: string;
    } & ReturnType<typeof symbolBytesToEmojis>
  > = [];
  const errors: (PostgrestError | null)[] = [];

  while (shouldContinue) {
    const offset = aggregated.length;
    const keytag = `aggregate-markets_${offset}_${LIMIT}`;
    /* eslint-disable-next-line no-await-in-loop */
    const { markets, error } = await cached(
      async () => {
        return await postgrest
          .from("market_data")
          .select(
            `
                market_id,
                emoji_bytes
            `
          )
          .range(offset, offset + LIMIT - 1)
          .then((r) => ({
            markets: (r.data ?? []).map((m) => ({
              marketID: m.market_id.toString(),
              symbolBytes: m.emoji_bytes as `0x${string}`,
            })),
            error: r.error,
          }));
      },
      [keytag],
      {
        tags: [keytag],
      }
    )();
    shouldContinue = markets.length === LIMIT;
    // If the length of the markets is not equal to the limit, this data will change as
    // more markets are created. Thus we call revalidateTag to invalidate the cache
    // so that the next time this function is called, the last result is a cache miss.
    if (!shouldContinue) {
      // TODO: Check if this works as expected.
      revalidateTag(keytag);
    }
    aggregated.push(
      ...markets.map((m) => ({
        ...m,
        ...symbolBytesToEmojis(m.symbolBytes),
      }))
    );
    errors.push(error);
  }

  return { markets: aggregated, error: errors };
};

export default fetchAggregateMarkets;
