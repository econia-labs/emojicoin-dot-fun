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

export const findOrThrow = <T extends HomogenousCandlesticksJson>(models: T, period: Period) => {
  const res = models.find((v) => v.period === period);
  if (res) return res;
  const msg = `Couldn't find \`${period}\` in periods: [${models.map((v) => v.period).join(",")}]`;
  throw new Error(msg);
};

export type LatestCandlesticks<T> = Record<Period, T>;

export type LatestCandlesticksModel = ReturnType<typeof toLatestCandlesticksModel>;

export function toLatestCandlesticksJson<T extends HomogenousCandlesticksJson>(
  rows: T
): LatestCandlesticks<T[number]> {
  return {
    [Period.Period15S]: findOrThrow(rows, Period.Period15S),
    [Period.Period1M]: findOrThrow(rows, Period.Period1M),
    [Period.Period5M]: findOrThrow(rows, Period.Period5M),
    [Period.Period15M]: findOrThrow(rows, Period.Period15M),
    [Period.Period30M]: findOrThrow(rows, Period.Period30M),
    [Period.Period1H]: findOrThrow(rows, Period.Period1H),
    [Period.Period4H]: findOrThrow(rows, Period.Period4H),
    [Period.Period1D]: findOrThrow(rows, Period.Period1D),
  };
}

function singleConversion<
  T extends DatabaseJsonType["arena_candlesticks"] | DatabaseJsonType["candlesticks"],
>(candlestick: T) {
  return "melee_id" in candlestick
    ? toArenaCandlestickModel(candlestick)
    : toCandlestickModel(candlestick);
}

export function toLatestCandlesticksModel(data: ReturnType<typeof toLatestCandlesticksJson>) {
  return {
    [Period.Period15S]: singleConversion(data[Period.Period15S]),
    [Period.Period1M]: singleConversion(data[Period.Period1M]),
    [Period.Period5M]: singleConversion(data[Period.Period5M]),
    [Period.Period15M]: singleConversion(data[Period.Period15M]),
    [Period.Period30M]: singleConversion(data[Period.Period30M]),
    [Period.Period1H]: singleConversion(data[Period.Period1H]),
    [Period.Period4H]: singleConversion(data[Period.Period4H]),
    [Period.Period1D]: singleConversion(data[Period.Period1D]),
  };
}
