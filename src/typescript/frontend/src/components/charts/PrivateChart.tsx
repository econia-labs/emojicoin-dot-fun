// cspell:word intraday
// cspell:word minmov
// cspell:word pricescale
import { useEffect, useMemo, useRef } from "react";

import {
  PERIOD_TO_CANDLESTICK_RESOLUTION,
  EXCHANGE_NAME,
  MS_IN_ONE_DAY,
  TV_CHARTING_LIBRARY_RESOLUTIONS,
  WIDGET_OPTIONS,
} from "./const";
import {
  type Bar,
  type DatafeedConfiguration,
  type IBasicDataFeed,
  type IChartingLibraryWidget,
  type LibrarySymbolInfo,
  type ResolutionString,
  type SearchSymbolResultItem,
  type Timezone,
  widget,
} from "@static/charting_library";
import { getClientTimezone } from "lib/chart-utils";
import { type ChartContainerProps } from "./types";
import { useRouter } from "next/navigation";
import { ROUTES } from "router/routes";
import path from "path";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";
import { type EventStore } from "@store/event-store";
import { fetchAllCandlesticksInTimeRange } from "lib/queries/charting/candlesticks-in-time-range";
import { useEventStore } from "context/websockets-context";
import { toBar } from "@sdk/utils/candlestick-bars";

const configurationData: DatafeedConfiguration = {
  supported_resolutions: TV_CHARTING_LIBRARY_RESOLUTIONS as ResolutionString[],
  symbols_types: [
    {
      name: "crypto",
      value: "crypto",
    },
  ],
};

const Debugger = (props: any) => {
  return (
    <>
    </>
  );
}

// The general approach here will be to use data fetched from the endpoint within the datafeed to populate the chart
// candlestick data. It will handle all of the data fetching possible until the very last candlestick, which is not
// provided by the endpoint.
// After that, we do not use the datafeed to fetch anymore, because mqtt will handle streaming the data through the
// websocket protocol to the datafeed websocket stream.
// If the user refreshes the page, we will fetch the data from the endpoint again, and then repeat the process.
// TODO: Figure out if this is inefficient and if there's a way to reconcile data retrieved from mqtt with the datafeed.

export const Chart = async (
  props: ChartContainerProps & {
    markets: EventStore["marketMetadataMap"];
    symbols: Map<string, string>;
  }
) => {
  const tvWidget = useRef<IChartingLibraryWidget>();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const symbol = props.symbol;
  const subscribeToResolution = useEventStore((s) => s.subscribeToResolution);
  const unsubscribeFromResolution = useEventStore((s) => s.unsubscribeFromResolution);

  const datafeed: IBasicDataFeed = useMemo(
    () => ({
      onReady: (callback) => {
        setTimeout(() => callback(configurationData));
      },
      searchSymbols: async (userInput, _exchange, _symbolType, onResultReadyCallback) => {
        console.log("userInput in searchSymbols:", userInput);
        const data = Array.from(props.markets.values());
        // TODO: Use the new emoji picker search with this..?
        const symbols = data.reduce<SearchSymbolResultItem[]>(
          (acc, { marketID, emojis, symbol }) => {
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

        console.log(symbols);
        onResultReadyCallback(symbols);
      },
      resolveSymbol: async (symbolName, onSymbolResolvedCallback, onErrorCallback) => {
        console.debug("resolveSymbol:", symbolName);
        // Try to look up the symbol as if it were a market ID and then as if it were the actual market symbol,
        // aka, the emoji(s) symbol string.
        const possibleMarketID = props.symbols.get(symbolName);
        const metadata =
          props.markets.get(symbolName) ??
          (possibleMarketID ? props.markets.get(possibleMarketID) : null);
        if (!metadata) {
          return onErrorCallback("Symbol not found");
        }
        const { marketID, symbol } = metadata;
        if (props.marketID !== marketID) {
          const newRoute = path.join(ROUTES.market, marketID);
          console.debug(`[resolveSymbol]: Redirecting to ${newRoute}`);
          router.push(newRoute);
          router.refresh();
        }

        const symbolInfo: LibrarySymbolInfo = {
          ticker: symbol,
          name: symbol,
          description: symbol,
          pricescale: 10 ** 9,
          volume_precision: -Math.ceil(Math.log10(Number("0.00000100") * Number("100.00000000"))),
          minmov: 1,
          exchange: EXCHANGE_NAME,
          listed_exchange: "",
          session: "24x7",
          has_empty_bars: true,
          has_seconds: false,
          has_intraday: true,
          has_daily: true,
          has_weekly_and_monthly: false,
          timezone: getClientTimezone() as Timezone,
          type: "crypto",
          supported_resolutions: configurationData.supported_resolutions,
          format: "price",
        };

        setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
      },
      getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
        const { from, to } = periodParams;
        try {
          const resolutionEnum = PERIOD_TO_CANDLESTICK_RESOLUTION[resolution.toString()];

          // TOOD: Consider that if our data is internally consistent and we run into issues with this, we can
          // use the values in state to skip lots of the fetches by using the data we already have.
          const data = await fetchAllCandlesticksInTimeRange({
            marketID: props.marketID,
            start: new Date(from * 1000),
            end: new Date(to * 1000),
            resolution: resolutionEnum,
          });

          if (data.length < 1) {
            onHistoryCallback([], {
              noData: true,
            });
            return;
          }

          const bars: Bar[] = data.reduce((acc: Bar[], event) => {
            const bar = toBar(event);
            if (bar.time >= from * 1000 && bar.time <= to * 1000) {
              acc.push(bar);
            }
            return acc;
          }, []);

          console.warn(`[getBars]: returned ${bars.length} bar(s)`);
          onHistoryCallback(bars, {
            noData: bars.length === 0,
          });
        } catch (e) {
          if (e instanceof Error) {
            console.warn("[getBars]: Get error", e);
            onErrorCallback(e.message);
          }
        }
      },
      subscribeBars: async (
        symbolInfo,
        resolution,
        onRealtimeCallback,
        subscribeUID,
        onResetCacheNeededCallback
      ) => {
        if (!symbolInfo.ticker) {
          throw new Error(`No ticker for symbol: ${symbolInfo}`);
        }
        const resolutionEnum = PERIOD_TO_CANDLESTICK_RESOLUTION[resolution.toString()];
        console.debug("subscribeBars:", symbolInfo, resolution);
        console.debug("onRealtimeCallback:", onRealtimeCallback);
        subscribeToResolution({
          symbol: symbolInfo.ticker,
          resolution: resolutionEnum,
          cb: onRealtimeCallback,
        });
        console.debug("subscribeUID:", subscribeUID);
        console.debug("subscribeUonResetCacheNeededCallbackID:", onResetCacheNeededCallback);
      },
      unsubscribeBars: async (subscriberUID) => {
        // subscriberUIDs come in the form of `${emoji}_#_$<period as string>`
        // For exmaple: `🚀_#_5`
        const [symbol, resolution] = subscriberUID.split("_#_");
        const resolutionEnum = PERIOD_TO_CANDLESTICK_RESOLUTION[resolution];
        console.debug("unsubscribeBars:", symbol, resolution);
        unsubscribeFromResolution({
          symbol,
          resolution: resolutionEnum,
        });
      },
    }),
    [symbol, props.marketID] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    console.debug("data feed rerendered, this should generally not happen..?", datafeed);
  }, [datafeed]);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    tvWidget.current = new widget({
      ...WIDGET_OPTIONS,
      symbol: symbol as string,
      datafeed,
      container: ref.current,
      timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone ?? "Etc/UTC") as Timezone,
    });

    tvWidget.current.onChartReady(() => {
      const chart = tvWidget.current!.activeChart();
      const now = new Date();
      const startDaysAgo = 1;
      const endDaysAgo = 0;
      const startMilliseconds = now.getTime() - startDaysAgo * MS_IN_ONE_DAY;
      const endMilliseconds = now.getTime() - endDaysAgo * MS_IN_ONE_DAY;
      const startTimestamp = Math.floor(new Date(startMilliseconds).getTime()) / 1000;
      const endTimestamp = Math.floor(new Date(endMilliseconds).getTime()) / 1000;

      chart
        .setVisibleRange({
          from: startTimestamp,
          to: endTimestamp,
        })
        .then(() => {
          const options: Intl.DateTimeFormatOptions = {
            year: "numeric",
            month: "numeric",
            day: "numeric",
          };
          const from = new Date(startTimestamp * 1000);
          const to = new Date(endTimestamp * 1000);
          /* eslint-disable-next-line no-console */
          console.debug(
            "Visible range applied:",
            `${from.toLocaleDateString("en-US", options)}`,
            `- ${to.toLocaleDateString("en-US", options)}\n`
          );
        })
        .catch((error) => {
          console.error("Error applying visible range:", error);
        });
    });

    return () => {
      if (tvWidget.current != null) {
        tvWidget.current.remove();
        tvWidget.current = undefined;
      }
    };
  }, [datafeed, symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-full">
      <div className="absolute left-0 top-0 flex h-full w-full animate-fadeIn items-center justify-center text-center font-roboto-mono text-sm font-light leading-6 text-neutral-500 opacity-0 delay-[2000]">
        <div>
          {"The device you're using isn't supported. 😔 Please try viewing on another device."}
        </div>
      </div>
      <div ref={ref} className="relative h-full w-full"></div>
    </div>
  );
};

export default Chart;
