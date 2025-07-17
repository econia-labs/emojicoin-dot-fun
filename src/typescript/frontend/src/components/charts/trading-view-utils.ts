// cspell:word intraday
// cspell:word minmov
// cspell:word pricescale

import type { ArenaChartSymbol } from "lib/chart-utils";
import { getClientTimezone } from "lib/chart-utils";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";

import type {
  DatafeedConfiguration,
  LibrarySymbolInfo,
  SearchSymbolResultItem,
  Timezone,
} from "@/static/charting_library";
import type { EventStore } from "@/store/event/types";

import { EXCHANGE_NAME, getTradingViewLibraryResolutions } from "./const";

export const getConfigurationData: (symbol: ArenaChartSymbol | string) => DatafeedConfiguration = (
  symbol
) => ({
  supported_resolutions: getTradingViewLibraryResolutions(symbol),
  symbols_types: [
    {
      name: "crypto",
      value: "crypto",
    },
  ],
});

export const searchSymbolsFromRegisteredMarketMap = ({
  userInput,
  registeredMarketMap,
}: {
  userInput: string;
  registeredMarketMap: ReturnType<EventStore["getRegisteredMarkets"]>;
}) =>
  Array.from(registeredMarketMap.values()).reduce<SearchSymbolResultItem[]>(
    (acc, { marketMetadata }) => {
      const marketID = marketMetadata.marketID.toString();
      const symbol = marketMetadata.symbolData.symbol;
      const { emojis } = marketMetadata;
      const symbolForSearch = {
        description: `Market #${marketID}: ${symbol}`,
        exchange: EXCHANGE_NAME,
        full_name: `${EXCHANGE_NAME}:${emojisToName(emojis)}`,
        symbol,
        ticker: symbol,
        type: "crypto",
      };
      if (
        symbolForSearch.full_name.includes(userInput) ||
        symbolForSearch.symbol.includes(userInput) ||
        symbolForSearch.ticker.includes(userInput) ||
        marketID.includes(userInput) ||
        userInput.includes(marketID)
      ) {
        acc.push(symbolForSearch);
      }
      return acc;
    },
    []
  );

export const constructLibrarySymbolInfo = (
  symbol: string,
  emptyBars: boolean
): LibrarySymbolInfo => ({
  ticker: symbol,
  name: symbol,
  description: symbol,
  pricescale: 10 ** 9,
  volume_precision: -Math.ceil(Math.log10(Number("0.00000100") * Number("100.00000000"))),
  minmov: 1,
  exchange: EXCHANGE_NAME,
  listed_exchange: "",
  session: "24x7",
  has_empty_bars: emptyBars,
  // If the symbol has a `/` in it, it's an arena candlestick, because it's a ratio.
  has_seconds: symbol.includes("/"),
  // Ensure the library is aware of the `15S` candles if its' an arena candlestick.
  seconds_multipliers: symbol.includes("/") ? ["15"] : undefined,
  has_intraday: true,
  has_daily: true,
  has_weekly_and_monthly: false,
  timezone: getClientTimezone() as Timezone,
  type: "crypto",
  supported_resolutions: getConfigurationData(symbol).supported_resolutions,
  format: "price",
});

export const symbolInfoToSymbol = (symbolInfo: LibrarySymbolInfo) => {
  const ticker = symbolInfo.ticker;
  if (!ticker) {
    // This should never occur, because we always set the ticker when we construct the symbol info
    // when the `resolveSymbol` datafeed API function is called.
    throw new Error(`No ticker for symbol: ${symbolInfo}`);
  }
  return ticker;
};
