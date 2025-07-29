import { type DatabaseJsonType, type SymbolEmoji, TableName } from "../../..";
import { MAX_ROW_LIMIT, ORDER_BY } from "../../const";
import { postgrest } from "../client";

const pageSize = MAX_ROW_LIMIT;

/**
 *
 * NOTE: `market_latest_state_event` is faster than `market_state` because daily volume isn't
 * calculated in the former query. Since this only returns market symbols, volume is irrelevant.
 *
 */
const fetchMarketSymbols = async (page: number) =>
  postgrest
    .from(TableName.MarketLatestStateEvent)
    .select("symbol_emojis")
    .order("market_id", ORDER_BY.DESC)
    .limit(pageSize)
    .range((page - 1) * pageSize, page * pageSize - 1)
    .overrideTypes<
      Pick<DatabaseJsonType["market_latest_state_event"], "symbol_emojis">[],
      { merge: false }
    >()
    .then((res) => {
      if (res.error) {
        console.error(res.error);
        return [];
      }
      return res.data.map((v) => v.symbol_emojis);
    });

export async function fetchAllMarketSymbols() {
  console.log(`Fetching all market symbols at ${new Date().toISOString()}`);
  const symbols: SymbolEmoji[][] = [];
  let page = 1;
  let lastRes: SymbolEmoji[][] = [];

  do {
    lastRes = await fetchMarketSymbols(page);
    symbols.push(...lastRes);
    page += 1;
  } while (lastRes.length && lastRes.length % pageSize === 0);

  return symbols;
}
