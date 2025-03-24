// cspell:word datafeeds

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Stub for TradingView charting library to silence `tsc` errors without having to
 * clone the private submodule in CI.
 */
declare module "@/static/charting_library" {
  export type Timezone = string;
  export type ThemeName = "Dark" | "Light";
  export type ResolutionString = string;
  export type LanguageCode = string;
  export type ChartingLibraryWidgetOptions = Record<string, any>;
  export type LibrarySymbolInfo = Record<string, any>;
  export type SearchSymbolResultItem = Record<string, any>;
  export type DatafeedConfiguration = Record<string, any>;
  export type PeriodParams = Record<string, any>;
  export type Bar = {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  };

  export interface IBasicDataFeed {}

  export interface IChartingLibraryWidget extends Record<string, any> {}

  export const widget: new (options: ChartingLibraryWidgetOptions) => IChartingLibraryWidget;

  export type SubscribeBarsCallback = (...args: any[]) => void;
}

declare module "charting_library/datafeeds/udf/dist/bundle" {
  export class UDFCompatibleDatafeed {
    constructor(url: string, options?: Record<string, any>);
  }
}
