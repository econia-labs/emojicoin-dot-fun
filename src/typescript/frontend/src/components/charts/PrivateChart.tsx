// cspell:word intraday
// cspell:word minmov
// cspell:word pricescale
import { useEffect, useMemo, useRef } from "react";

import {
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
import { type Types, symbolBytesToEmojis } from "@econia-labs/emojicoin-sdk";
import { type ChartContainerProps } from "./types";
import { resolveToEmojiSymbol } from "@store/event-utils";
import { useEventStore } from "context/websockets-context";
import { useRouter } from "next/navigation";
import { ROUTES } from "router/routes";
import path from "path";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";

const configurationData: DatafeedConfiguration = {
  supported_resolutions: TV_CHARTING_LIBRARY_RESOLUTIONS as ResolutionString[],
  symbols_types: [
    {
      name: "crypto",
      value: "crypto",
    },
  ],
};

// The general approach here will be to use data fetched from the endpoint within the datafeed to populate the chart
// candlestick data. It will handle all of the data fetching possible until the very last candlestick, which is not
// provided by the endpoint.
// After that, we do not use the datafeed to fetch anymore, because mqtt will handle streaming the data through the
// websocket protocol to the datafeed websocket stream.
// If the user refreshes the page, we will fetch the data from the endpoint again, and then repeat the process.
// TODO: Figure out if this is inefficient and if there's a way to reconcile data retrieved from mqtt with the datafeed.

export const Chart = async (props: ChartContainerProps) => {
  const getSymbolFromMarketID = useEventStore((s) => s.getSymbolFromMarketID);
  const getMarketIDFromSymbol = useEventStore((s) => s.getMarketIDFromSymbol);
  const marketMap = useEventStore((s) => s.getMarketIDs()); // TODO: See if these trigger state updates / re-renders?
  // const lastSwap = useEventStore((s) => s.getMarket(props.marketID)?.swapEvents.events.at(0));
  const tvWidget = useRef<IChartingLibraryWidget>();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const symbol = props.symbol;

  const datafeed: IBasicDataFeed = useMemo(
    () => ({
      onReady: (callback) => {
        setTimeout(() => callback(configurationData));
      },
      searchSymbols: async (userInput, _exchange, _symbolType, onResultReadyCallback) => {
        // const marketIDs = Array.from(marketMap.keys());
        const data = Array.from(marketMap.entries()).map(([marketID, emojis]) => {
          return {
            marketID,
            emojis: symbolBytesToEmojis(emojis),
          };
        });
        // TODO: Consider storing this in state..? It depends if we need to reconstruct it elsewhere,
        // and if it generally carries a high cost/complexity to compute.
        // Could also combine the map and filter into a single reduce.
        const symbols = data.reduce<SearchSymbolResultItem[]>((acc, { marketID, emojis: item }) => {
          const symbol = {
            description: `Market #${marketID}: ${item.symbol}`,
            exchange: EXCHANGE_NAME,
            full_name: `${EXCHANGE_NAME}:${emojisToName(item.emojis)}`,
            symbol: item.symbol,
            ticker: item.symbol,
            type: "crypto",
          };
          if (
            symbol.full_name.includes(userInput) ||
            symbol.symbol.includes(userInput) ||
            symbol.ticker.includes(userInput) ||
            symbol.ticker.includes(resolveToEmojiSymbol({ userInput, getSymbolFromMarketID }) ?? "")
          ) {
            acc.push(symbol);
          }
          return acc;
        }, []);

        onResultReadyCallback(symbols);
      },
      resolveSymbol: async (symbolName, onSymbolResolvedCallback) => {
        const symbol =
          resolveToEmojiSymbol({ userInput: symbolName, getSymbolFromMarketID }) ?? symbolName;
        const resolvedMarketID = getMarketIDFromSymbol(symbol) ?? props.marketID;
        if (props.marketID !== resolvedMarketID) {
          const newRoute = path.join(ROUTES.market, resolvedMarketID.toString());
          console.debug(`[resolveSymbol]: Redirecting to ${newRoute}`);
          router.push(newRoute);
        }

        const symbolInfo: LibrarySymbolInfo = {
          ticker: symbol,
          name: symbol,
          description: symbol,
          pricescale: 100,
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
          // const resolutionEnum = DAY_TO_CANDLESTICK_RESOLUTION[resolution.toString()];

          // const data = candlesticks[resolutionEnum];
          const data = new Array<Types.PeriodicStateEvent>();

          if (data.length < 1) {
            onHistoryCallback([], {
              noData: true,
            });
            return;
          }

          const bars: Bar[] = data.reduce((acc: Bar[], event) => {
            const time = Number(event.periodicStateMetadata.emitTime / 1000n);
            if (time >= from * 1000 && time <= to * 1000) {
              acc.push({
                time: time,
                open: Number(event.open) * 1000,
                high: Number(event.high) * 1000,
                low: Number(event.low) * 1000,
                close: Number(event.close) * 1000,
                volume: Number(event.volumeQuote),
              });
            }
            return acc;
          }, []);

          bars.sort((a, b) => a.time - b.time);

          // Need to figure out a way to add this last bar if it's not in the data.
          // Right now the whole chart rerenders...it actually does this even with
          // the candlesticks.
          // if (lastSwap) {
          //   bars.push({
          //     time: Number(lastSwap.time / 1000n),
          //     open: Number(lastSwap.avgExecutionPrice) * 1000,
          //     high: Number(lastSwap.avgExecutionPrice) * 1000,
          //     low: Number(lastSwap.avgExecutionPrice) * 1000,
          //     close: Number(lastSwap.avgExecutionPrice) * 1000,
          //     volume: 0,
          //   })
          // }

          console.warn(bars);

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
      // This is the function we should be using. Get bars is for the initial data
      // but subscribe bars will be for the live data.
      subscribeBars: async (
        _symbolInfo,
        _resolution,
        _onRealtimeCallback,
        _subscribeUID,
        _onResetCacheNeededCallback
      ) => {},
      unsubscribeBars: async (_subscriberUID) => {},
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
