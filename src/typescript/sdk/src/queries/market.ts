import "server-only";

import { MODULE_ADDRESS } from "../const";
import { SYMBOL_DATA, type SymbolEmojiData } from "../emoji_data";
import { INBOX_EVENTS_TABLE, ORDER_BY } from "./const";
import { type Types, type JSONTypes, toMarketRegistrationEvent } from "../types";
import { type AggregateQueryResultsArgs, aggregateQueryResults } from "./query-helper";
import { postgrest } from "./inbox-url";

export type TopMarketsDataResponse = Array<{
  data: JSONTypes.StateEvent;
  transaction_version: number;
}>;

/**
 * Gets all the unique, top markets that have been registered and traded on.
 *
 * Sorted by the instantaneous `market_cap` at the time of the last swap for that market.
 *
 * @param args
 * @returns
 */
export const getTopMarkets = async () => {
  const res = await postgrest
    .rpc("get_top_markets", {
      module_address: MODULE_ADDRESS.toString(),
    })
    .select("*");
  const { data } = res;
  return {
    data: data
      ? data.map((v) => ({
          data: v.data as JSONTypes.StateEvent,
          version: Number(v.transaction_version),
        }))
      : [],
    error: res.error,
  };
};

export const paginateMarketRegistrations = async (
  args?: Omit<AggregateQueryResultsArgs, "query">
) => {
  const res = await aggregateQueryResults<JSONTypes.MarketRegistrationEvent>({
    ...args,
    query: postgrest
      .from(INBOX_EVENTS_TABLE)
      .select("*")
      .filter("event_name", "eq", "emojicoin_dot_fun::MarketRegistration")
      .order("transaction_version", ORDER_BY.DESC),
  });

  return {
    markets: res.data.map((e) => toMarketRegistrationEvent(e, e.version)),
    errors: res.errors,
  };
};

/**
 * Gets the market data as a map of marketID to market metadata.
 * @param param0
 * @returns
 */
export const getMarketData = async (
  data: Awaited<ReturnType<typeof paginateMarketRegistrations>>
) => {
  const res: Record<string, Types.MarketMetadata & SymbolEmojiData> = {};
  const { markets } = data;
  markets
    .filter((m) => SYMBOL_DATA.hasHex(m.marketMetadata.emojiBytes))
    .forEach((m) => {
      const { marketID } = m.marketMetadata;
      res[marketID.toString()] = {
        ...m.marketMetadata,
        ...SYMBOL_DATA.byHex(m.marketMetadata.emojiBytes)!,
      };
    });
  return res;
};
