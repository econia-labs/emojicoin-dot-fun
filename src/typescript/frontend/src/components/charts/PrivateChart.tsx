import { useEffect, useMemo, useRef } from "react";
import { MS_IN_ONE_DAY, ResolutionStringToPeriod, WIDGET_OPTIONS } from "./const";
import {
  type IBasicDataFeed,
  type IChartingLibraryWidget,
  type Timezone,
  widget,
} from "@static/charting_library";
import { type ChartContainerProps } from "./types";
import { useRouter } from "next/navigation";
import { ROUTES } from "router/routes";
import path from "path";
import { useEventStore } from "context/event-store-context";
import { getSymbolEmojisInString, symbolToEmojis } from "@sdk/emoji_data";
import { periodEnumToRawDuration } from "@sdk/const";
import {
  CONFIGURATION_DATA,
  constructLibrarySymbolInfo,
  searchSymbolsFromRegisteredMarketMap,
} from "./trading-view-utils";
import { BrowserNotSupported } from "./BrowserNotSupported";
import {
  createDummyBar,
  fetchCandlesticksForChart,
  fetchLatestBarsFromMarketResource,
  updateLastTwoBars,
} from "./get-bars";

/**
 * The TradingView Chart component. This component is responsible for rendering the TradingView chart with the usage of
 * the `datafeed` API. It also handles resolving market symbols from user input with the market metadata passed down
 * from a server component/fetch in the form of the `EventStore["markets"]` registered market map data.
 *
 * TODO: We may want to periodically refresh the candlestick data and ensure it is valid/up to date
 * with the on-chain data by polling the `market_view` endpoint. This would ensure that in the case of a dropped
 * event or a broken websocket connection, the user would still generally have the most up-to-date data.
 *
 * Please see
 * {@link https://github.com/econia-labs/emojicoin-dot-fun/tree/main/src/typescript/frontend/src/components/charts/README.md}
 * for a more detailed explanation of the architectural data flow.
 * @param props
 * @returns
 */
export const Chart = (props: ChartContainerProps) => {
  const tvWidget = useRef<IChartingLibraryWidget>();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const symbol = props.symbol;
  const subscribeToPeriod = useEventStore((s) => s.subscribeToPeriod);
  const unsubscribeFromPeriod = useEventStore((s) => s.unsubscribeFromPeriod);
  const setLatestBars = useEventStore((s) => s.setLatestBars);
  const getRegisteredMarketMap = useEventStore((s) => s.getRegisteredMarkets);

  const datafeed: IBasicDataFeed = useMemo(
    () => ({
      onReady: (callback) => {
        setTimeout(() => callback(CONFIGURATION_DATA));
      },
      searchSymbols: async (userInput, _exchange, _symbolType, onResultReadyCallback) => {
        const registeredMarketMap = getRegisteredMarketMap();
        const symbols = searchSymbolsFromRegisteredMarketMap({ userInput, registeredMarketMap });
        onResultReadyCallback(symbols);
      },
      resolveSymbol: async (symbolName, onSymbolResolvedCallback, _onErrorCallback) => {
        const { symbol } = symbolToEmojis(symbolName);
        if (symbol !== props.symbol) {
          const newRoute = path.join(ROUTES.market, symbol);
          router.push(newRoute);
          router.refresh();
        }

        const symbolInfo = constructLibrarySymbolInfo(symbolName);
        setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
      },
      getBars: async (
        _symbolInfo,
        resolution,
        periodParams,
        onHistoryCallback,
        onErrorCallback
      ) => {
        const { to } = periodParams;
        const period = ResolutionStringToPeriod[resolution.toString()];
        const periodDuration = periodEnumToRawDuration(period);

        try {
          const bars = await fetchCandlesticksForChart({
            marketID: props.marketID,
            periodParams,
            period,
          });

          // If the end time is in the future, it means that `getBars` is being called for the most recent candlesticks,
          // and thus we should append the latest candlestick to this dataset to ensure the chart is up to date.
          const endDate = new Date(to * 1000);
          const isFetchForMostRecentBars = endDate.getTime() - new Date().getTime() > 1000;
          if (isFetchForMostRecentBars) {
            const { marketMetadata, latestBar, latestBars } =
              await fetchLatestBarsFromMarketResource({
                marketAddress: props.marketAddress,
                period,
              });

            // Set the latest bars in the state store.
            setLatestBars({ marketMetadata, latestBars });
            if (latestBar) {
              // Mutates the `bars` array.
              updateLastTwoBars(bars, latestBar);
            }
          }

          if (bars.length === 0) {
            if (isFetchForMostRecentBars) {
              // Create a single empty bar if there's no trading activity, otherwise the chart shows "No chart data".
              const dummyBar = createDummyBar(periodDuration);
              bars.push(dummyBar);
            } else {
              onHistoryCallback([], {
                noData: true,
              });
              return;
            }
          }
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
        _subscribeUID,
        _onResetCacheNeededCallback
      ) => {
        if (!symbolInfo.ticker) {
          throw new Error(`No ticker for symbol: ${symbolInfo}`);
        }
        const period = ResolutionStringToPeriod[resolution.toString()];
        const marketEmojis = getSymbolEmojisInString(symbolInfo.ticker);
        subscribeToPeriod({
          marketEmojis,
          period,
          cb: onRealtimeCallback,
        });
      },
      unsubscribeBars: async (subscriberUID) => {
        // subscriberUIDs come in the form of `${emoji}_#_$<period as string>`
        // For example: `🚀_#_5` for the `🚀` market for a resolution of period `5`.
        const [symbol, resolution] = subscriberUID.split("_#_");
        const period = ResolutionStringToPeriod[resolution];
        const marketEmojis = getSymbolEmojisInString(symbol);
        unsubscribeFromPeriod({
          marketEmojis,
          period,
        });
      },
    }),
    [symbol, props.marketID] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (ref.current) {
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
        const endDaysAgo = 0;
        const endMilliseconds = now.getTime() - endDaysAgo * MS_IN_ONE_DAY;
        const endTimestamp = Math.floor(new Date(endMilliseconds).getTime()) / 1000;

        chart
          .setVisibleRange({
            from: endTimestamp - (24 * 60 * 60) / 6,
            to: endTimestamp,
          })
          .catch((error) => {
            console.error("Error applying visible range:", error);
          });
      });
    }

    return () => {
      if (tvWidget.current != null) {
        tvWidget.current.remove();
        tvWidget.current = undefined;
      }
    };
  }, [datafeed, symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-full h-[420px]">
      <BrowserNotSupported />
      <div ref={ref} className="relative h-full w-full"></div>
    </div>
  );
};

export default Chart;
