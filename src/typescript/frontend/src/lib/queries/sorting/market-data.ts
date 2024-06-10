"use server";
import { postgrest } from "@sdk/queries/inbox-url";
import { LIMIT, toOrderBy } from "@sdk/queries/const";
import { type JSONTypes, toMarketDataView } from "@sdk/types";
import { toPostgrestQueryParam, type GetSortedMarketDataQueryArgs } from "./types";
import cached from "../cached";
import { MARKETS_PER_PAGE } from "./const";
import { SYMBOL_DATA } from "@sdk/emoji_data";

const getSortedMarketData = async ({
  limit = LIMIT,
  offset,
  orderBy,
  sortBy,
  inBondingCurve = null,
  count = true,
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

  return query.then((r) => ({
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
    }),
  ["sorted-markets"],
  {
    tags: ["sorted-markets"],
    revalidate: false, // We'll revalidate when the # of markets changes.
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
    revalidate: 30,
  }
);

export const fetchFeaturedMarket = async (
  args: Omit<GetSortedMarketDataQueryArgs, "limit" | "offset">
) =>
  cachedFeaturedMarket(args).then(({ data }) =>
    data?.at(0)
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

type CachedArgs = {
  page: number;
} & Omit<GetSortedMarketDataQueryArgs, "limit" | "offset">;

const fetchSortedMarketData = async (args: CachedArgs) => {
  const { page, sortBy, orderBy, inBondingCurve } = args;

  const {
    data: jsonData,
    error: _,
    count,
  } = await cachedFetchSortedMarketData({
    limit: LIMIT,
    offset: calculateOffset(page),
    sortBy,
    orderBy,
    inBondingCurve,
  });

  const start = ((page - 1) * MARKETS_PER_PAGE) % LIMIT;
  const end = start + MARKETS_PER_PAGE;

  return {
    markets: jsonData.slice(start, end).map((v: JSONTypes.MarketDataView) => ({
      ...toMarketDataView(v),
      ...SYMBOL_DATA.byHex(v.emoji_bytes)!,
    })),
    count: count ?? 0,
  };
};

export default fetchSortedMarketData;
