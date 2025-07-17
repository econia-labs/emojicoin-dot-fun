import type { DatabaseJsonType } from "../../..";
import {
  DatabaseRpc,
  toLatestArenaCandlesticksJson,
  toLatestMarketCandlesticksJson,
} from "../../..";
import type { AnyNumberString } from "../../../types/types";
import { postgrest } from "../client";

export type FetchArenaLatestCandlesticksResponse = Awaited<
  ReturnType<typeof fetchArenaLatestCandlesticks>
>;
export type FetchMarketLatestCandlesticksResponse = Awaited<
  ReturnType<typeof fetchMarketLatestCandlesticks>
>;

/**
 * Fetches the latest (aka current) arena candlesticks for a given meleeID.
 *
 * Note that an arena's latest candlesticks only exist once the arena has started and one of the
 * markets is traded on while the arena is ongoing.
 */
export const fetchArenaLatestCandlesticks = async (meleeID: AnyNumberString) => {
  try {
    return await postgrest
      .dbRpc(DatabaseRpc.ArenaLatestCandlesticks, { melee_id: meleeID.toString() }, { get: true })
      .select("*")
      .overrideTypes<DatabaseJsonType["arena_latest_candlesticks"][], { merge: false }>()
      // No rows returned means the arena hasn't been traded on yet, and it's confusing to return an
      // empty array when no candlesticks exist yet, so return `null` instead if there are no rows.
      .then((res) => (res.data ? toLatestArenaCandlesticksJson(res.data) : null));
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * Fetches the latest (aka current) market candlesticks for a given marketID.
 *
 * Note that a market's latest candlesticks *always* exist immediately upon registration.
 */
export const fetchMarketLatestCandlesticks = async (marketID: AnyNumberString) => {
  try {
    return await postgrest
      .dbRpc(
        DatabaseRpc.MarketLatestCandlesticks,
        { market_id: marketID.toString() },
        { get: true }
      )
      .select("*")
      .overrideTypes<DatabaseJsonType["market_latest_candlesticks"][], { merge: false }>()
      .then((res) => (res.data ? toLatestMarketCandlesticksJson(res.data) : null));
  } catch (e) {
    console.error(e);
    return null;
  }
};
