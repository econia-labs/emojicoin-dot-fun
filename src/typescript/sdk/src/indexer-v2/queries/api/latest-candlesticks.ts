import type { DatabaseJsonType } from "../../..";
import { DatabaseRpc } from "../../..";
import type { AnyNumberString } from "../../../types/types";
import { postgrest } from "../client";

/**
 * Fetches the latest (aka current) arena candlesticks for a given meleeID.
 *
 * Note that the postgres function will return 0 rows if the melee doesn't exist, but this is
 * confusing, since it's more desirable to simply return exactly N candlesticks, where N is the
 * number of periods or `0`, that way the caller knows for sure that all candlesticks exist or none
 * of them do.
 *
 * Note that an arena's latest candlesticks only exist once the arena has started and one of the
 * markets is traded on while the arena is ongoing.
 */
export const fetchArenaLatestCandlesticks = async (meleeID: AnyNumberString) =>
  await postgrest
    .rpc(DatabaseRpc.ArenaLatestCandlesticks, { melee_id: meleeID.toString() }, { get: true })
    .select("*")
    .overrideTypes<DatabaseJsonType["arena_latest_candlesticks"][], { merge: false }>()
    // No rows returned means the arena hasn't been traded on yet, and it's confusing to return an
    // empty array when no candlesticks exist yet, so return `null` instead if there are no rows.
    .then((res) => ((res.data?.length ?? 0) > 0 ? res.data : null));

/**
 * Fetches the latest (aka current) market candlesticks for a given marketID.
 *
 * Note that the postgres function will return 0 rows if the market doesn't exist, but this is
 * confusing, since it's more desirable to simply return exactly N candlesticks, where N is the
 * number of periods or `0`, that way the caller knows for sure that all candlesticks exist or none
 * of them do.
 *
 * Note that a market's latest candlesticks *always* exist immediately upon registration.
 */
export const fetchMarketLatestCandlesticks = async (marketID: AnyNumberString) =>
  await postgrest
    .rpc(DatabaseRpc.MarketLatestCandlesticks, { market_id: marketID.toString() }, { get: true })
    .select("*")
    .overrideTypes<DatabaseJsonType["market_latest_candlesticks"][], { merge: false }>()
    // No rows returned means the market doesn't exist, and it's confusing to return an empty array,
    // so return `null` instead if there are no rows.
    .then((res) => ((res.data?.length ?? 0) > 0 ? res.data : null));
