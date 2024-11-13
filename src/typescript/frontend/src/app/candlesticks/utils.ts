import { type Period, PeriodDuration, periodEnumToRawDuration } from "@sdk/index";

export const PARCEL_SIZE = 500;

export const indexToStartDate = (index: number, period: Period): Date =>
  new Date((index * periodEnumToRawDuration(period)) / 1000);
export const indexToEndDate = (index: number, period: Period): Date =>
  new Date(((index + 1) * periodEnumToRawDuration(period)) / 1000);

export const getPeriodDurationSeconds = (period: Period) =>
  (periodEnumToRawDuration(period) / PeriodDuration.PERIOD_1M) * 60;

export const toIndexAndAmount = (
  start: number,
  end: number,
  period: Period
): { amount: number; index: number } => {
  const periodDuration = getPeriodDurationSeconds(period);
  const parcelDuration = periodDuration * PARCEL_SIZE;

  const index = Math.floor(start / parcelDuration);
  const amount = Math.ceil((end - start) / parcelDuration);

  return { index, amount };
};

export const jsonStrAppend = (a: string, b: string): string => {
  if (a === "[]") return b;
  if (b === "[]") return a;
  return `${a.substring(0, a.length - 1)},${b.substring(1)}`;
};

export type GetCandlesticksParams = {
  marketID: number;
  index: number;
  period: Period;
};

export const HISTORICAL_CACHE_DURATION = 60 * 60 * 24 * 365; // 1 year
export const NORMAL_CACHE_DURATION = 10; // 10 seconds
