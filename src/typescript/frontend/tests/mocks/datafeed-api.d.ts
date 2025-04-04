/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Stub for TradingView charting library to silence `tsc` errors without having to
 * clone the private submodule in CI.
 */
declare module "@/static/charting_library/datafeed-api" {
  export type SubscribeBarsCallback = (...args: any[]) => void;
}
