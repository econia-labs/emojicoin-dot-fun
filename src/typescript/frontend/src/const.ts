export const DEFAULT_TOAST_CONFIG = {
  pauseOnFocusLoss: false,
  pauseOnHover: true,
  autoClose: 7777,
} as const;

export const REVALIDATE_TEST = 2;
export const DEFAULT_MAX_SLIPPAGE = 500n;

// Allow a max count back of ~7 days worth of 1m candles; aka ~420 days of 1h candles, etc.
export const MAX_CANDLESTICK_COUNT_BACK = 10000;
