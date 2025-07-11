import { Period } from "../const";
import {
  type ArenaCandlestickModel,
  type CandlestickModel,
  type DatabaseJsonType,
  toArenaCandlestickModel,
  toCandlestickModel,
} from "../indexer-v2/types";

export type HomogenousCandlesticksJson =
  | DatabaseJsonType["candlesticks"][]
  | DatabaseJsonType["arena_candlesticks"][];

export type HomogenousCandlestickModels = CandlestickModel[] | ArenaCandlestickModel[];

export type LatestMarketCandlesticks<T> = Record<Period, T>;

export type LatestArenaCandlesticks<T> = Record<
  Exclude<Period, Period.Period4H | Period.Period1D>,
  T
>;

/**
 * A utility function to convert to the model while avoiding an unintended union and instead force a
 * homogenous array output type.
 */
export const convertToCandlestickModels = (
  data: HomogenousCandlesticksJson
): HomogenousCandlestickModels =>
  data.length === 0
    ? []
    : "melee_id" in data[0]
      ? (data as DatabaseJsonType["arena_candlesticks"][]).map(toArenaCandlestickModel)
      : (data as DatabaseJsonType["candlesticks"][]).map(toCandlestickModel);

export function toLatestArenaCandlesticksJson(rows: DatabaseJsonType["arena_candlesticks"][]) {
  return {
    [Period.Period15S]: rows.find((v) => v.period === Period.Period15S),
    [Period.Period1M]: rows.find((v) => v.period === Period.Period1M),
    [Period.Period5M]: rows.find((v) => v.period === Period.Period5M),
    [Period.Period15M]: rows.find((v) => v.period === Period.Period15M),
    [Period.Period30M]: rows.find((v) => v.period === Period.Period30M),
    [Period.Period1H]: rows.find((v) => v.period === Period.Period1H),
  };
}

export function toLatestMarketCandlesticksJson(rows: DatabaseJsonType["candlesticks"][]) {
  return {
    [Period.Period15S]: rows.find((v) => v.period === Period.Period15S),
    [Period.Period1M]: rows.find((v) => v.period === Period.Period1M),
    [Period.Period5M]: rows.find((v) => v.period === Period.Period5M),
    [Period.Period15M]: rows.find((v) => v.period === Period.Period15M),
    [Period.Period30M]: rows.find((v) => v.period === Period.Period30M),
    [Period.Period1H]: rows.find((v) => v.period === Period.Period1H),
    [Period.Period4H]: rows.find((v) => v.period === Period.Period4H),
    [Period.Period1D]: rows.find((v) => v.period === Period.Period1D),
  };
}

function maybeSingleConversion<
  T extends DatabaseJsonType["arena_candlesticks"] | DatabaseJsonType["candlesticks"],
>(candlestick: T | undefined | null) {
  return !candlestick
    ? candlestick
    : "melee_id" in candlestick
      ? toArenaCandlestickModel(candlestick)
      : toCandlestickModel(candlestick);
}

export function toLatestArenaCandlesticksModel(
  data: ReturnType<typeof toLatestArenaCandlesticksJson>
) {
  return {
    [Period.Period15S]: maybeSingleConversion(data[Period.Period15S]),
    [Period.Period1M]: maybeSingleConversion(data[Period.Period1M]),
    [Period.Period5M]: maybeSingleConversion(data[Period.Period5M]),
    [Period.Period15M]: maybeSingleConversion(data[Period.Period15M]),
    [Period.Period30M]: maybeSingleConversion(data[Period.Period30M]),
    [Period.Period1H]: maybeSingleConversion(data[Period.Period1H]),
  };
}
export function toLatestMarketCandlesticksModel(
  data: ReturnType<typeof toLatestMarketCandlesticksJson>
) {
  return {
    [Period.Period15S]: maybeSingleConversion(data[Period.Period15S]),
    [Period.Period1M]: maybeSingleConversion(data[Period.Period1M]),
    [Period.Period5M]: maybeSingleConversion(data[Period.Period5M]),
    [Period.Period15M]: maybeSingleConversion(data[Period.Period15M]),
    [Period.Period30M]: maybeSingleConversion(data[Period.Period30M]),
    [Period.Period1H]: maybeSingleConversion(data[Period.Period1H]),
    [Period.Period4H]: maybeSingleConversion(data[Period.Period4H]),
    [Period.Period1D]: maybeSingleConversion(data[Period.Period1D]),
  };
}
