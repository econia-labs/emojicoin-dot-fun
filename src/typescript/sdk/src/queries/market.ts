import { PostgrestClient } from "@supabase/postgrest-js";
import { INBOX_URL } from "../const";
import { SYMBOL_DATA, type SymbolEmojiData } from "../emoji_data";
import { type Uint64String } from "../emojicoin_dot_fun";
import { TABLE_NAME, ORDER_BY } from "./const";
import { STRUCT_STRINGS } from "../utils";
import { type ContractTypes, type JSONTypes, toMarketRegistrationEvent } from "../types";
import { type AggregateQueryResultsArgs, aggregateQueryResults } from "./query-helper";

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
    markets: res.data.map((e) => toMarketRegistrationEvent(e)),
    errors: res.errors,
  };
};

export const getMarketData = async ({
  inboxUrl = INBOX_URL,
}: {
  inboxUrl?: string;
}): Promise<Record<Uint64String, ContractTypes.MarketMetadata & (SymbolEmojiData | undefined)>> => {
  const res: Record<Uint64String, ContractTypes.MarketMetadata & (SymbolEmojiData | undefined)> =
    {};
  const { markets } = await paginateMarketRegistrations({ inboxUrl });
  markets
    .filter((m) => SYMBOL_DATA.hasHex(m.market_metadata.emoji_bytes))
    .forEach((m) => {
      const marketID = m.market_metadata.market_id.toString();
      res[marketID] = {
        ...m.market_metadata,
        ...SYMBOL_DATA.byHex(m.market_metadata.emoji_bytes)!,
      };
    });
  return res;
};
