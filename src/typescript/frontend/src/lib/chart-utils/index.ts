// cspell:word Kolkata
// cspell:word Fakaofo

import { isValidMarketSymbol } from "@sdk/emoji_data";
/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-ignore Expect an error when the library isn't installed. Since it's a type, it's fine.
import type { Bar } from "@static/charting_library/datafeed-api";

/**
 * Retrieves the client's timezone based on the current system time offset.
 *
 * @returns {Timezone} - The client's timezone as a string identifier (e.g., "America/New_York").
 */
export function getClientTimezone() {
  const timezones: { [key: string]: number } = {};
  timezones["America/New_York"] = -5;
  timezones["America/Los_Angeles"] = -8;
  timezones["America/Chicago"] = -6;
  timezones["America/Phoenix"] = -7;
  timezones["America/Toronto"] = -5;
  timezones["America/Vancouver"] = -8;
  timezones["America/Argentina/Buenos_Aires"] = -3;
  timezones["America/El_Salvador"] = -6;
  timezones["America/Sao_Paulo"] = -3;
  timezones["America/Bogota"] = -5;
  timezones["America/Caracas"] = -4;
  timezones["Europe/Moscow"] = 3;
  timezones["Europe/Athens"] = 2;
  timezones["Europe/Belgrade"] = 1;
  timezones["Europe/Berlin"] = 1;
  timezones["Europe/London"] = 0;
  timezones["Europe/Luxembourg"] = 1;
  timezones["Europe/Madrid"] = 1;
  timezones["Europe/Paris"] = 1;
  timezones["Europe/Rome"] = 1;
  timezones["Europe/Warsaw"] = 1;
  timezones["Europe/Istanbul"] = 3;
  timezones["Europe/Zurich"] = 1;
  timezones["Australia/Sydney"] = 10;
  timezones["Australia/Brisbane"] = 10;
  timezones["Australia/Adelaide"] = 9.5;
  timezones["Australia/ACT"] = 10;
  timezones["Asia/Almaty"] = 6;
  timezones["Asia/Ashkhabad"] = 5;
  timezones["Asia/Tokyo"] = 9;
  timezones["Asia/Taipei"] = 8;
  timezones["Asia/Singapore"] = 8;
  timezones["Asia/Shanghai"] = 8;
  timezones["Asia/Seoul"] = 9;
  timezones["Asia/Tehran"] = 3.5;
  timezones["Asia/Dubai"] = 4;
  timezones["Asia/Kolkata"] = 5.5;
  timezones["Asia/Hong_Kong"] = 8;
  timezones["Asia/Bangkok"] = 7;
  timezones["Asia/Chongqing"] = 8;
  timezones["Asia/Jerusalem"] = 2;
  timezones["Asia/Kuwait"] = 3;
  timezones["Asia/Muscat"] = 4;
  timezones["Asia/Qatar"] = 3;
  timezones["Asia/Riyadh"] = 3;
  timezones["Pacific/Auckland"] = 12;
  timezones["Pacific/Chatham"] = 12.75;
  timezones["Pacific/Fakaofo"] = 13;
  timezones["Pacific/Honolulu"] = -10;
  timezones["America/Mexico_City"] = -6;
  timezones["Africa/Cairo"] = 2;
  timezones["Africa/Johannesburg"] = 2;
  timezones["Asia/Kathmandu"] = 5.75;
  timezones["US/Mountain"] = -7;

  const timezone = (new Date().getTimezoneOffset() * -1) / 60;
  for (const key in timezones) {
    if (timezones[key] === timezone) {
      return key;
    }
  }
  return "Etc/UTC";
}

export const hasTradingActivity = (bar: Bar) =>
  [bar.open, bar.high, bar.low, bar.close].some((price) => price !== 0);

/**
 * Parses a symbol name with URL-like parameters.
 * Example: "BTC?has_empty_bars=true&another_param=value"
 *
 * #### NOTE: the symbol input can be an arena symbol.
 * @see {@link isArenaChartSymbol}
 * @see {@link encodeSymbolsForChart}
 * @see {@link decodeSymbolsForChart}
 *
 * @param chartSymbolWithParams - The TradingView chart symbol with optional URL-like parameters
 * @returns An object containing the base chart symbol and parsed parameters
 * @throws Will not throw, but returns empty object for invalid inputs
 */
export function parseSymbolWithParams(chartSymbolWithParams: string): {
  baseChartSymbol: string | ArenaChartSymbol;
  params: Record<string, string>;
} {
  if (!chartSymbolWithParams || typeof chartSymbolWithParams !== "string") {
    return { baseChartSymbol: "", params: {} };
  }
  const [baseChartSymbol = "", paramString = ""] = chartSymbolWithParams.split("?");
  if (!paramString) {
    return { baseChartSymbol, params: {} };
  }

  // Parse parameters.
  const params = paramString.split("&").reduce(
    (acc, param) => {
      if (!param) return acc;

      try {
        const [key, value] = param.split("=");
        if (!key) return acc;
        const decodedKey = decodeURIComponent(key);
        // If no value provided, default to "true". Value is always a string.
        const decodedValue = value === undefined ? "true" : decodeURIComponent(value);
        acc[decodedKey] = decodedValue;
      } catch (error) {
        // Silently ignore malformed parameters.
        // This prevents URL decoding errors from breaking the function.
      }

      return acc;
    },
    {} as Record<string, string>
  );

  return { baseChartSymbol, params };
}

/**
 * Formats a symbol name with URL-like parameters.
 * Example: formatSymbolWithParams("BTC", { has_empty_bars: true }) => "BTC?has_empty_bars=true"
 *
 * #### NOTE: the input symbol name can be an arena symbol.
 * @see {@link isArenaChartSymbol}
 * @see {@link encodeSymbolsForChart}
 * @see {@link decodeSymbolsForChart}
 *
 * @param baseChartSymbol - The TradingView chart base symbol
 * @param params - An object containing the parameters to add
 * @returns A formatted symbol string with URL-like parameters
 */
export function formatSymbolWithParams(
  baseChartSymbol: string | ArenaChartSymbol,
  params: Record<string, string | boolean | number> = {}
): string {
  if (!baseChartSymbol) {
    return "";
  }

  if (!params || Object.keys(params).length === 0) {
    return baseChartSymbol;
  }

  const paramString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    // Encode both key and value
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");

  return paramString ? `${baseChartSymbol}?${paramString}` : baseChartSymbol;
}

export const ARENA_CHART_SYMBOL_DELIMITER = "/" as const;
export type ArenaChartSymbol = `${string}${typeof ARENA_CHART_SYMBOL_DELIMITER}${string}`;

/**
 * Encode one or two symbols into one string for the chart implementation.
 * This is to support the custom arena symbol for the chart, where it displays the price ratio
 * of two symbols against each other as a single chart series.
 */
export function encodeSymbolsForChart(symbol: string, secondarySymbol: string): ArenaChartSymbol;
export function encodeSymbolsForChart(symbol: string, secondarySymbol?: string | undefined): string;
export function encodeSymbolsForChart(
  symbol: string,
  secondarySymbol?: string | undefined
): string | ArenaChartSymbol {
  return [symbol, secondarySymbol].filter((v) => !!v).join(ARENA_CHART_SYMBOL_DELIMITER) as
    | ArenaChartSymbol
    | string;
}

/**
 * Decode a symbol name into one or more symbols for the chart implementation.
 * @see encodeSymbolsForChart
 */
export function decodeSymbolsForChart(symbol: ArenaChartSymbol): {
  primarySymbol: string;
  secondarySymbol: string;
};
export function decodeSymbolsForChart(symbol: string): {
  primarySymbol: string;
  secondarySymbol?: undefined;
};
export function decodeSymbolsForChart(symbol: ArenaChartSymbol | string) {
  if (isArenaChartSymbol(symbol)) {
    const res = symbol.split("/");
    return {
      primarySymbol: res[0],
      secondarySymbol: res[1],
    };
  }
  return {
    primarySymbol: symbol,
    secondarySymbol: undefined,
  };
}

/**
 * Validates that a symbol string is a valid chart arena symbol.
 * @param symbol
 * @returns symbol is ArenaChartSymbol
 */
export function isArenaChartSymbol(symbol: string): symbol is ArenaChartSymbol {
  return symbol.includes("/") && symbol.split("/").every(isValidMarketSymbol);
}
