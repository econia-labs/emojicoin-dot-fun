import { PostgrestClient } from "@supabase/postgrest-js";
import { INBOX_URL, MODULE_ADDRESS } from "../const";
import { SYMBOL_DATA, type SymbolEmojiData } from "../emoji_data";
import { TABLE_NAME, ORDER_BY } from "./const";
import { STRUCT_STRINGS } from "../utils";
import { type ContractTypes, type JSONTypes, toMarketRegistrationEvent } from "../types";
import { type AggregateQueryResultsArgs, aggregateQueryResults } from "./query-helper";

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
export const getTopMarkets = async (inboxUrl: string = INBOX_URL) => {
  const postgrest = new PostgrestClient(inboxUrl);
  const res = await postgrest
    .rpc("get_top_markets", {
      module_address: MODULE_ADDRESS.toString(),
    })
    .select("*");
  const { data } = res;
  return {
    data: data ? data.map((v) => ({ data: v.data, version: v.transaction_version })) : [],
    error: res.error,
  };
};

export const paginateMarketRegistrations = async (
  args?: Omit<AggregateQueryResultsArgs, "query">
) => {
  const inboxUrl = args?.inboxUrl ?? INBOX_URL;
  const postgrest = new PostgrestClient(inboxUrl);
  const res = await aggregateQueryResults<JSONTypes.MarketRegistrationEvent>({
    ...args,
    query: postgrest
      .from(TABLE_NAME)
      .select("*")
      .filter("type", "eq", STRUCT_STRINGS.MarketRegistrationEvent)
      .order("transaction_version", ORDER_BY.DESC),
  });

  return {
    markets: res.data.map((e) => ({ ...toMarketRegistrationEvent(e), version: e.version })),
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
  const res: Record<string, ContractTypes.MarketMetadata & SymbolEmojiData> = {};
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
