import { type DatabaseJsonType, TableName } from "../../..";
import { MAX_ROW_LIMIT, ORDER_BY } from "../../const";
import { postgrest } from "../client";

const pageSize = MAX_ROW_LIMIT;

const fetchMarketsByID = async (page: number) =>
  postgrest
    .from(TableName.MarketState)
    .select("*")
    .order("market_id", ORDER_BY.DESC)
    .limit(pageSize)
    .range((page - 1) * pageSize, page * pageSize - 1)
    .overrideTypes<DatabaseJsonType["market_state"][], { merge: false }>()
    .then((res) => {
      if (res.error) {
        console.error(res.error);
        return [];
      }
      return res.data;
    });

export async function fetchAllMarkets() {
  const symbols: DatabaseJsonType["market_state"][] = [];
  let page = 1;
  let lastRes: DatabaseJsonType["market_state"][] = [];

  do {
    lastRes = await fetchMarketsByID(page);
    symbols.push(...lastRes);
    page += 1;
  } while (lastRes.length && lastRes.length % pageSize === 0);

  return symbols;
}
