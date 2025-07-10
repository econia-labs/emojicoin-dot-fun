import type { ArenaCandlestickModel, CandlestickModel, DatabaseJsonType } from "../../..";
import { DatabaseRpc, Period, toArenaCandlestickModel, toCandlestickModel } from "../../..";
import type { AnyNumberString } from "../../../types/types";
import { postgrest } from "../client";

export type HomogenousCandlesticksJson =
  | DatabaseJsonType["candlesticks"][]
  | DatabaseJsonType["arena_candlesticks"][];

type HomogenousCandlestickModels = CandlestickModel[] | ArenaCandlestickModel[];

/**
 * A utility function to convert to the model while avoiding an unintended union and instead force a
 * homogenous array output type.
 */
export const convertToCandlestickModels = (data: HomogenousCandlesticksJson) =>
  "melee_id" in data[0]
    ? (data as DatabaseJsonType["arena_candlesticks"][]).map(toArenaCandlestickModel)
    : (data as DatabaseJsonType["candlesticks"][]).map(toCandlestickModel);

const findOrThrow = <T extends HomogenousCandlestickModels>(models: T, period: Period) => {
  const res = models.find((v) => v.period === period);
  if (res) return res;
  const msg = `Couldn't find \`${period}\` in periods: [${models.map((v) => v.period).join(",")}]`;
  throw new Error(msg);
};

export function toLatestCandlesticks<
  T extends HomogenousCandlesticksJson,
  U extends T extends DatabaseJsonType["candlesticks"][] ? CandlestickModel : ArenaCandlestickModel,
>(rows: T) {
  const models = convertToCandlestickModels(rows);
  return {
    [Period.Period15S]: findOrThrow(models, Period.Period15S) as U,
    [Period.Period1M]: findOrThrow(models, Period.Period1M) as U,
    [Period.Period5M]: findOrThrow(models, Period.Period5M) as U,
    [Period.Period15M]: findOrThrow(models, Period.Period15M) as U,
    [Period.Period30M]: findOrThrow(models, Period.Period30M) as U,
    [Period.Period1H]: findOrThrow(models, Period.Period1H) as U,
    [Period.Period4H]: findOrThrow(models, Period.Period4H) as U,
    [Period.Period1D]: findOrThrow(models, Period.Period1D) as U,
  };
}

/**
 * Fetches the latest (aka current) arena candlesticks for a given meleeID.
 *
 * Note that an arena's latest candlesticks only exist once the arena has started and one of the
 * markets is traded on while the arena is ongoing.
 */
export const fetchArenaLatestCandlesticks = async (meleeID: AnyNumberString) =>
  await postgrest
    .dbRpc(DatabaseRpc.ArenaLatestCandlesticks, { melee_id: meleeID.toString() }, { get: true })
    .select("*")
    .overrideTypes<DatabaseJsonType["arena_latest_candlesticks"][], { merge: false }>()
    // No rows returned means the arena hasn't been traded on yet, and it's confusing to return an
    // empty array when no candlesticks exist yet, so return `null` instead if there are no rows.
    .then((res) => (res.data?.length ? res.data : null));

/**
 * Fetches the latest (aka current) market candlesticks for a given marketID.
 *
 * Note that a market's latest candlesticks *always* exist immediately upon registration.
 */
export const fetchMarketLatestCandlesticks = async (marketID: AnyNumberString) =>
  await postgrest
    .dbRpc(DatabaseRpc.MarketLatestCandlesticks, { market_id: marketID.toString() }, { get: true })
    .select("*")
    .overrideTypes<DatabaseJsonType["market_latest_candlesticks"][], { merge: false }>()
    // No rows returned means the market doesn't exist, and it's confusing to return an empty array,
    // so return `null` instead if there are no rows.
    .then((res) => (res.data?.length ? res.data : null));
