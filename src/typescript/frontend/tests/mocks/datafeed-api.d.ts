/**
 * CI-only stub for TradingView charting library.
 * This allows `tsc` to run without errors in CI without cloning the private submodule.
 */
declare module "@static/charting_library/datafeed-api" {
  export type SubscribeBarsCallback = (...args: any[]) => void;
}