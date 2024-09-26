// "use server";
// import { LIMIT, toOrderByString } from "@sdk/queries/const";
// import { type JSONTypes, toMarketDataView } from "@sdk/types";
// import {
//   toPostgrestQueryParam,
//   type GetSortedMarketDataQueryArgs,
//   type GetMySortedMarketDataQueryArgs,
// } from "./types";
// import cached from "../cache-utils/cached";
// import { MARKETS_PER_PAGE } from "./const";
// import { symbolBytesToEmojis } from "@sdk/emoji_data";
// import { REVALIDATION_TIME } from "lib/server-env";
// import { TAGS } from "../cache-utils/tags";

// const getMyPools = async ({
//   limit = LIMIT,
//   page,
//   orderBy,
//   sortBy,
//   account,
//   searchBytes,
// }: GetMySortedMarketDataQueryArgs) => {
//   let query = postgrest
//     .rpc("mypools", { address: account })
//     .range((page - 1) * limit, page * limit)
//     .limit(limit)
//     .order(toPostgrestQueryParam(sortBy), orderBy);

//   if (searchBytes) {
//     query = query.like("emoji_bytes", `%${searchBytes}%`);
//   }

//   return await query.then((r) => ({
//     data: (r.data ?? []) as JSONTypes.MarketDataView[],
//     error: r.error,
//     count: r.count,
//   }));
// };


// type GetMyPoolsArgs = {
//   page: number;
//   account: string;
// } & Omit<GetSortedMarketDataQueryArgs, "limit" | "offset" | "inBondingCurve" | "exactCount">;

// export const fetchMyPools = async (args: GetMyPoolsArgs) => {
//   const { page, sortBy, orderBy, account, searchBytes } = args;

//   const limit = MARKETS_PER_PAGE;
//   const keys = [
//     "sorted-markets",
//     limit,
//     page,
//     sortBy,
//     toOrderByString(orderBy),
//     account,
//     searchBytes,
//   ].map(String);

//   const { data, count } = await cached(
//     () =>
//       getMyPools({
//         limit,
//         page,
//         sortBy,
//         orderBy,
//         account,
//         searchBytes,
//       }),
//     keys,
//     {
//       tags: [TAGS.SortedMarkets],
//       revalidate: Math.max(REVALIDATION_TIME, 1),
//     }
//   )();

//   const indexOffset = calculateIndex({
//     givenIndex: (page - 1) * MARKETS_PER_PAGE,
//     orderBy,
//     totalNumMarkets: count ?? 0,
//   });

//   return {
//     markets: data.map((v: JSONTypes.MarketDataView, i) => ({
//       ...toMarketDataView(v),
//       ...symbolBytesToEmojis(v.emoji_bytes)!,
//       index: indexOffset + i + 1,
//     })),
//     count: count ?? 0,
//   };
// };

// export type FetchSortedMarketDataReturn = Awaited<ReturnType<typeof fetchSortedMarketData>>;

// export default fetchSortedMarketData;
