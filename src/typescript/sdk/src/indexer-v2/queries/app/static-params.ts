import { type DatabaseJsonType, TableName } from "../../..";
import { MAX_ROW_LIMIT, ORDER_BY } from "../../const";
import { postgrest } from "../client";
import { exhaustiveFetch } from "../utils";

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
  return await exhaustiveFetch(fetchMarketsByID, pageSize);
}
