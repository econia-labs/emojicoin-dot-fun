"use server";

import { fetchMarkets } from "@/queries/home";
import { ORDER_BY, toOrderBy, type OrderBy } from "@sdk/indexer-v2/const";
import { postgrest } from "@sdk/indexer-v2/queries/client";
import { sortByWithFallback } from "@sdk/indexer-v2/queries/query-params";
import { SortMarketsBy, toPriceFeedData } from "@sdk/indexer-v2/types";
import { TableName } from "@sdk/indexer-v2/types/json-types";
import { unstable_cache } from "next/cache";
import { type toStatsPageParamsWithDefault } from "./params";
import { manuallyPaginatePriceDeltas } from "@/queries/stats";
import { fetchSpecificMarkets } from "@sdk/indexer-v2/queries/misc";
import { getSymbolEmojisInString } from "@sdk/emoji_data";
import { toJsonTableRowData } from "./types";
import { compareNumber } from "@sdk/utils";

const STATS_REVALIDATION_TIME = 60;
const PRICE_FEED_LIMIT = 500;
const ROWS_PER_STATS_PAGE = 100;

/**
 * Return the delta percentage for each symbol as an object of [key]: value, where the key is
 * the joined symbol emojis and the value is the delta percentage.
 */
const fetchPaginatedPriceFeed: (page: number) => Promise<{ [key: string]: number }> = async (
  page: number
) => {
  const query = postgrest
    .from(TableName.PriceFeed)
    .select("symbol_emojis, open_price_q64, close_price_q64")
    .limit(PRICE_FEED_LIMIT)
    .order(sortByWithFallback(SortMarketsBy.DailyVolume), ORDER_BY.DESC)
    .range((page - 1) * PRICE_FEED_LIMIT, page * PRICE_FEED_LIMIT - 1);

  return await query
    .then((res) => res.data ?? [])
    .then((res) =>
      res.map(({ symbol_emojis, ...rest }) => ({
        symbol_emojis,
        delta_percentage: Number(toPriceFeedData(rest).deltaPercentage.toFixed(2)),
      }))
    )
    .then((res) =>
      res.map(
        ({ symbol_emojis, delta_percentage }) =>
          [symbol_emojis.join(""), delta_percentage] as [string, number]
      )
    )
    .then((entries) => Object.fromEntries(entries));
};

/**
 * Fetch ten pages of price deltas at the most. At 500 per query, this is a max of 5,000 entries,
 * where the max average size of each entry is 20 bytes, aka 100 KB. This is feasible in terms of
 * edge runtime memory and cache memory allocation.
 *
 * 20 bytes is determined by the function, where the black cat emoji is the max symbol size:
 * ```typescript
 *   const encoder = new TextEncoder();
 *   const obj = Object.fromEntries([["🐈‍⬛", 12.31]]);
 *   const stringified = JSON.stringify(obj);
 *   const bytes = encoder.encode(stringified);
 *   console.log(bytes.length);
 * ```
 */
const fetchFirstTenPagesOfPriceDeltas = async () => {
  const res: [string, number][] = [];
  let i = 0;

  do {
    // Pages used above are 1-indexed.
    await fetchPaginatedPriceFeed(i + 1)
      .then(Object.entries)
      .then((entries) => res.push(...entries));
    i += 1;
  } while (res.length % PRICE_FEED_LIMIT === 0 && i <= 10);

  return Object.fromEntries(res);
};

/**
 * Fetch {@link PRICE_FEED_LIMIT} rows of market symbols and their price deltas for the last 24h.
 * The result is cached with `unstable_cache`.
 */
export const fetchCachedFirstTenPagesOfPriceDeltas = unstable_cache(
  fetchFirstTenPagesOfPriceDeltas,
  ["paginated-price-delta"],
  {
    revalidate: STATS_REVALIDATION_TIME,
  }
);

/**
 * To avoid having to create a view with an index on the final calculation of the price delta,
 * instead use the exhaustive response of all market price deltas mapped from symbol to price delta,
 * then sort and filter those values to get the exact symbols for the rows that would be returned
 * in an actual query sorted on the price deltas.
 *
 * Then select the specific markets with @see {@link fetchSpecificMarkets} to get their full market
 * states. Return that response and its as effectively the same as if the database had a view for
 * selecting market state, ordering by price delta.
 */
const fetchMarketsByPriceDelta = async ({
  page,
  pageSize,
  orderBy,
}: {
  page: number;
  pageSize: number;
  orderBy: OrderBy;
}) => {
  const desc = orderBy == toOrderBy("desc");
  const priceDeltas = await fetchCachedFirstTenPagesOfPriceDeltas();
  const selectedSymbols = manuallyPaginatePriceDeltas({
    priceDeltas,
    page,
    pageSize,
    desc,
  })
    .map(([symbol, _]) => symbol)
    .map(getSymbolEmojisInString);

  // Fetch the specific markets, then sort them by their price delta, since the postgres query
  // returns them unordered.
  const res = await fetchSpecificMarkets(selectedSymbols).then((res) =>
    res.sort((a, b) =>
      compareNumber(
        priceDeltas[a.market.symbolData.symbol],
        priceDeltas[b.market.symbolData.symbol]
      )
    )
  );
  return desc ? res.toReversed() : res;
};

const fetchMarketsBy = ({
  sortBy,
  page,
  orderBy,
}: {
  sortBy: ReturnType<typeof toStatsPageParamsWithDefault>["sortBy"];
  page: number;
  orderBy: OrderBy;
}) =>
  (sortBy === "delta"
    ? fetchMarketsByPriceDelta({
        page,
        pageSize: ROWS_PER_STATS_PAGE,
        orderBy,
      })
    : fetchMarkets({
        sortBy,
        page,
        orderBy,
        pageSize: ROWS_PER_STATS_PAGE,
      })
  ).then((res) => res.map(toJsonTableRowData));

export const fetchCachedMarketStates = unstable_cache(fetchMarketsBy, ["market-states-for-stats"], {
  revalidate: STATS_REVALIDATION_TIME,
});
