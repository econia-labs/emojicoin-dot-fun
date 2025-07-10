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

type HomogenousCandlestickModels = CandlestickModel[] | ArenaCandlestickModel[];

/**
 * A utility function to convert to the model while avoiding an unintended union and instead force a
 * homogenous array output type.
 */
export const convertToCandlestickModels = (data: HomogenousCandlesticksJson) =>
  data.length === 0
    ? []
    : "melee_id" in data[0]
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
