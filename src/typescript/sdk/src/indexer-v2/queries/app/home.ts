if (process.env.NODE_ENV !== "test") {
  require("server-only");
}

import { LIMIT, ORDER_BY } from "../../../queries/const";
import { DEFAULT_SORT_BY, SortMarketsBy, type MarketStateQueryArgs } from "../../types/common";
import { DatabaseRpc, TableName } from "../../types/json-types";
import { postgrest, toQueryArray } from "../client";
import { getLatestProcessedEmojicoinVersion, queryHelper, queryHelperWithCount } from "../utils";
import { DatabaseTypeConverter } from "../../types";
import { RegistryView } from "../../../emojicoin_dot_fun/emojicoin-dot-fun";
import { getAptosClient } from "../../../utils/aptos-client";
import { AnyNumberString, toRegistryView } from "../../../types";
import { sortByWithFallback } from "../query-params";
import { type PostgrestFilterBuilder } from "@supabase/postgrest-js";

// prettier-ignore
const selectSpecificMarkets = ({ marketIDs }: { marketIDs: AnyNumberString[] }) =>
  postgrest
    .from(TableName.MarketState)
    .select("*")
    .in("market_id", marketIDs.map(String));

const selectMarketStates = ({
  page = 1,
  pageSize = LIMIT,
  orderBy = ORDER_BY.DESC,
  searchEmojis,
  sortBy = DEFAULT_SORT_BY,
  inBondingCurve,
  count,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
}: MarketStateQueryArgs): PostgrestFilterBuilder<any, any, any[], TableName, unknown> => {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  let query: any = postgrest.from(TableName.MarketState);

  if (count === true) {
    query = query.select("*", { count: "exact" });
  } else {
    query = query.select("*");
  }

  query = query
    .order(sortByWithFallback(sortBy), orderBy)
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (searchEmojis && searchEmojis.length) {
    query = query.contains("symbol_emojis", toQueryArray(searchEmojis));
  }

  if (typeof inBondingCurve === "boolean") {
    query = query.eq("in_bonding_curve", inBondingCurve);
  }

  return query;
};

export const fetchMarkets = queryHelper(
  selectMarketStates,
  DatabaseTypeConverter[TableName.MarketState]
);

export const fetchMarketsWithCount = queryHelperWithCount(
  selectMarketStates,
  DatabaseTypeConverter[TableName.MarketState]
);

export const DEFAULT_TOP_MARKET_SORT = SortMarketsBy.BumpOrder;
export const DEFAULT_TOP_MARKET_ORDER = ORDER_BY.DESC;

export const fetchTopMarketForSortBy = async (sortBy: SortMarketsBy = DEFAULT_TOP_MARKET_SORT) =>
  fetchMarkets({
    page: 1,
    pageSize: 1,
    sortBy,
    orderBy: DEFAULT_TOP_MARKET_ORDER,
  }).then((markets) => (markets ?? []).at(0));

/**
 * Retrieves the number of markets by querying the view function in the registry contract on-chain.
 * The ledger (transaction) version is specified in order to reflect the exact total number of
 * unique markets the `emojicoin-dot-fun` processor will have processed up to that version.
 *
 * @returns The number of registered markets at the latest processed transaction version
 */
export const fetchNumRegisteredMarkets = async () => {
  const aptos = getAptosClient();
  let latestVersion: bigint;
  try {
    latestVersion = await getLatestProcessedEmojicoinVersion();
  } catch (e) {
    console.error("Couldn't get the latest processed version.", e);
    throw e;
  }
  try {
    const numRegisteredMarkets = await RegistryView.view({
      aptos,
      options: {
        ledgerVersion: latestVersion,
      },
    }).then((r) => toRegistryView(r).numMarkets);
    return Number(numRegisteredMarkets);
  } catch (e: unknown) {
    // If the view function fails, our NextJS backend is probably rate-limited by the Aptos rest API
    // and we should just find the count ourselves. Since this is a costly operation, this should
    // primarily be a fallback to avoid defaulting to "0" in the UI. In practice, we should never
    // get rate-limited, since we'll cache the query results and add a proper revalidation time.
    return postgrest
      .from(TableName.MarketState)
      .select("", { count: "exact", head: true })
      .then((r) => r.count ?? 0);
  }
};

const selectPriceFeed = () => postgrest.rpc(DatabaseRpc.PriceFeed, undefined, { get: true });

export const fetchPriceFeed = queryHelper(
  selectPriceFeed,
  DatabaseTypeConverter[DatabaseRpc.PriceFeed]
);

export const fetchSpecificMarkets = queryHelper(
  selectSpecificMarkets,
  DatabaseTypeConverter[TableName.MarketState]
);

// Fetch the top N markets from the price feed, then fetch their corresponding market data.
export const fetchPriceFeedAndMarketData = async () =>
  fetchPriceFeed({}).then((priceFeed) =>
    fetchSpecificMarkets({ marketIDs: priceFeed.map(({ marketID }) => marketID) }).then(
      (allMarketData) =>
        priceFeed
          .map((marketPriceFeed) => {
            // Find the price feed marketID's matching market data entry.
            const marketData = allMarketData.find(
              (mkt) => mkt.market.marketID === marketPriceFeed.marketID
            );
            if (!marketData) {
              console.error(
                `Found market ID ${marketPriceFeed}, ${marketPriceFeed.symbolEmojis} in price feed ` +
                  `but not when querying its market state.`
              );
              return undefined;
            }
            return {
              marketPriceFeed,
              marketData,
            };
          })
          .filter((v) => typeof v !== "undefined")
    )
  );

export type PriceFeedAndMarketData = Awaited<
  ReturnType<typeof fetchPriceFeedAndMarketData>
>[number];
