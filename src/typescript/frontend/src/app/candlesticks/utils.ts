import { isPeriod, type Period, PeriodDuration, periodEnumToRawDuration } from "@sdk/index";

export const getPeriodDurationSeconds = (period: Period) =>
  (periodEnumToRawDuration(period) / PeriodDuration.PERIOD_1M) * 60;

/**
 * The search params used in the `GET` request at `candlesticks/api`.
 *
 * @property {string} marketID      - The market ID.
 * @property {string} to            - The end time boundary.
 * @property {string} period        - The {@link Period}.
 * @property {string} countBack     - The `countBack` value requested by the datafeed API.
 */
export type CandlesticksSearchParams = {
  marketID: string | null;
  to: string | null;
  period: string | null;
  countBack: string | null;
};

/**
 * Validated {@link CandlesticksSearchParams}.
 */
export type ValidCandlesticksSearchParams = {
  marketID: string;
  to: string;
  period: Period;
  amount: string;
  countBack: string;
};

const isNumber = (s: string) => !isNaN(parseInt(s));

export const isValidCandlesticksSearchParams = (
  params: CandlesticksSearchParams
): params is ValidCandlesticksSearchParams => {
  const { marketID, to, period, countBack } = params;
  // prettier-ignore
  return (
    marketID !== null && isNumber(marketID) &&
    to !== null && isNumber(to) &&
    countBack !== null && isNumber(countBack) &&
    period !== null && isPeriod(period)
  );
};

export const HISTORICAL_CACHE_DURATION = 60 * 60 * 24 * 365; // 1 year.
export const NORMAL_CACHE_DURATION = 10; // 10 seconds.
