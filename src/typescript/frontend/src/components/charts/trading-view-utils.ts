// cspell:word intraday
// cspell:word minmov
// cspell:word pricescale

import { type EventStore } from "@/store/event/types";
import {
  type LibrarySymbolInfo,
  type Timezone,
  type SearchSymbolResultItem,
  type DatafeedConfiguration,
} from "@static/charting_library";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";
import { EXCHANGE_NAME, TV_CHARTING_LIBRARY_RESOLUTIONS } from "./const";
import { getClientTimezone } from "lib/chart-utils";

export const CONFIGURATION_DATA: DatafeedConfiguration = {
  supported_resolutions: TV_CHARTING_LIBRARY_RESOLUTIONS,
  symbols_types: [
    {
      name: "crypto",
      value: "crypto",
    },
  ],
};

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
  has_seconds: false,
  has_intraday: true,
  has_daily: true,
  has_weekly_and_monthly: false,
  timezone: getClientTimezone() as Timezone,
  type: "crypto",
  supported_resolutions: CONFIGURATION_DATA.supported_resolutions,
  format: "price",
});
