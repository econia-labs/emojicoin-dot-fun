"use server";
import { postgrest } from "@sdk/queries/inbox-url";
import { LIMIT, ORDER_BY, toOrderBy } from "@sdk/queries/const";
import { type JSONTypes, toMarketDataView } from "@sdk/types";
import { toPostgrestQueryParam, type GetSortedMarketDataQueryArgs } from "./types";
import cached from "../cached";
import { MARKETS_PER_PAGE } from "./const";
import { SYMBOL_DATA } from "@sdk/emoji_data";
import { REVALIDATION_TIME } from "lib/server-env";

const getSortedMarketData = async ({
  limit = LIMIT,
  offset,
  orderBy,
  sortBy,
  inBondingCurve = null,
  count,
}: GetSortedMarketDataQueryArgs) => {
  let query = postgrest
    .from("market_data")
    .select("*", count ? { count: "exact" } : undefined)
    .range(offset, offset + limit - 1)
    .limit(limit)
    .order(toPostgrestQueryParam(sortBy), toOrderBy(orderBy));

  switch (inBondingCurve) {
    case true:
      query = query.eq("lp_coin_supply", 0);
      break;
    case false:
      query = query.gt("lp_coin_supply", 0);
      break;
    default:
      break;
  }

  return await query.then((r) => ({
    data: (r.data ?? []) as JSONTypes.MarketDataView[],
    error: r.error,
    count: r.count,
  }));
};

const cachedFetchSortedMarketData = cached(
  async ({ limit, offset, sortBy, orderBy, inBondingCurve }: GetSortedMarketDataQueryArgs) =>
    getSortedMarketData({
      limit,
      offset,
      sortBy,
      orderBy: toOrderBy(orderBy),
      inBondingCurve,
      count: true,
    }),
  ["sorted-markets"],
  {
    // TODO: Revalidate this tag when the # of markets changes.
    tags: ["sorted-markets"],
    revalidate: REVALIDATION_TIME,
  }
);

export const cachedFeaturedMarket = cached(
  async ({
    sortBy,
    orderBy,
    inBondingCurve,
  }: Omit<GetSortedMarketDataQueryArgs, "limit" | "offset">) =>
    getSortedMarketData({
      limit: 1,
      offset: 0,
      sortBy,
      orderBy: toOrderBy(orderBy),
      inBondingCurve,
      count: false,
    }),
  ["featured-market"],
  {
    tags: ["featured-market"],
    // We can force a revalidate every 30 seconds.
    revalidate: REVALIDATION_TIME,
  }
);

export const fetchFeaturedMarket = async (
  args: Omit<GetSortedMarketDataQueryArgs, "limit" | "offset">
) =>
  cachedFeaturedMarket(args).then(({ data }) =>
    typeof data?.at(0) !== "undefined" && data.length > 0
      ? {
          ...toMarketDataView(data[0]),
          ...SYMBOL_DATA.byHex(data[0].emoji_bytes)!,
        }
      : undefined
  );

// If you get 500 rows per response, you need to place each request to paginate into
// a bucket that fits into some 500 rows.
// AKA: page 1, 2, 3 ..., 9 are all in the same bucket, aka the page.
// page 10, 11, 12, ... 19 are in the same bucket, aka the page.
// To cache this correctly, we can use the page number as the key.
const calculateOffset = (page: number) =>
  Math.floor(((page - 1) * MARKETS_PER_PAGE) / LIMIT) * LIMIT;

// Calculate the index of an individual element based on the page number.
// If the query is sorted in descending order, the index will be reversed,
// and thus we subtract the index from the total number of markets.
const calculateIndex = ({
  givenIndex,
  orderBy,
  totalNumMarkets,
}: {
  givenIndex: number;
  orderBy: GetSortedMarketDataQueryArgs["orderBy"];
  totalNumMarkets: number;
}) => (toOrderBy(orderBy) === ORDER_BY.DESC ? givenIndex : totalNumMarkets - givenIndex);

type CachedArgs = {
  page: number;
} & Omit<GetSortedMarketDataQueryArgs, "limit" | "offset">;

const fetchSortedMarketData = async (args: CachedArgs) => {
  const { page, sortBy, orderBy, inBondingCurve } = args;

  const offset = calculateOffset(page);

  const {
    data: jsonData,
    error: _,
    count,
  } = await cachedFetchSortedMarketData({
    limit: LIMIT,
    offset,
    sortBy,
    orderBy,
    inBondingCurve,
  });

  const start = ((page - 1) * MARKETS_PER_PAGE) % LIMIT;
  const end = start + MARKETS_PER_PAGE;
  const indexOffset = calculateIndex({
    givenIndex: (page - 1) * MARKETS_PER_PAGE,
    orderBy,
    totalNumMarkets: count ?? 0,
  });

  return {
    markets: jsonData.slice(start, end).map((v: JSONTypes.MarketDataView, i) => ({
      ...toMarketDataView(v),
      ...SYMBOL_DATA.byHex(v.emoji_bytes)!,
      index: indexOffset + i + 1,
    })),
    count: count ?? 0,
  };
};

export default fetchSortedMarketData;
