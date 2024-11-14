import { isPeriod, type Period, PeriodDuration, periodEnumToRawDuration } from "@sdk/index";

/**
 * Parcel size is the amount of candlestick periods that will be in a single parcel.
 * That is, a parcel for 1m candlesticks will be `PARCEL_SIZE` minutes of time.
 *
 * Note that this is *NOT* the number of candlesticks in the database- as there may be gaps in the
 * on-chain data (and thus the database).
 *
 * More specifically, each parcel will have anywhere from 0 to PARCEL_SIZE number of candlesticks
 * and will always span `PARCEL_SIZE` candlesticks/periods worth of time.
 */
export const PARCEL_SIZE = 500;

export const indexToParcelStartDate = (index: number, period: Period): Date =>
  new Date((index * periodEnumToRawDuration(period)) / 1000);
export const indexToParcelEndDate = (index: number, period: Period): Date =>
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

/**
 * The search params used in the `GET` request at `candlesticks/api`.
 *
 * @property {string} marketID      - The market ID.
 * @property {string} index         - The pagination index.
 * @property {string} period        - The {@link Period}.
 * @property {string} amount        - The number of parcels to fetch.
 */
export type CandlesticksSearchParams = {
  marketID: string | null;
  index: string | null;
  period: string | null;
  amount: string | null;
};

/**
 * Validated {@link CandlesticksSearchParams}.
 */
export type ValidCandlesticksSearchParams = {
  marketID: string;
  index: string;
  period: Period;
  amount: string;
};

const isNumber = (s: string) => !isNaN(parseInt(s));

export const isValidCandlesticksSearchParams = (
  params: CandlesticksSearchParams
): params is ValidCandlesticksSearchParams => {
  const { marketID, index, period, amount } = params;
  // prettier-ignore
  return (
    marketID !== null && isNumber(marketID) &&
    index !== null && isNumber(index) &&
    amount !== null && isNumber(amount) &&
    period !== null && isPeriod(period)
  );
};

export const HISTORICAL_CACHE_DURATION = 60 * 60 * 24 * 365; // 1 year.
export const NORMAL_CACHE_DURATION = 10; // 10 seconds.
