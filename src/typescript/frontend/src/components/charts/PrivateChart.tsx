import { useEffect, useMemo, useRef } from "react";
import { ResolutionStringToPeriod, WIDGET_OPTIONS } from "./const";
import {
  type IBasicDataFeed,
  type IChartingLibraryWidget,
  type Timezone,
  widget,
} from "@static/charting_library";
import { formatSymbolWithParams, parseSymbolWithParams } from "lib/chart-utils";
import { type ChartContainerProps } from "./types";
import { useRouter } from "next/navigation";
import { ROUTES } from "router/routes";
import path from "path";
import { useEventStore, useUserSettings } from "context/event-store-context";
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
import { createSwitch } from "components/charts/EmptyCandlesSwitch";

/**
 * The TradingView Chart component. This component is responsible for rendering the TradingView chart with the usage of
 * the `datafeed` API. It also handles resolving market symbols from user input with the market metadata passed down
 * from a server component/fetch in the form of the `EventStore["markets"]` registered market map data.
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
  const showEmptyBars = useUserSettings((s) => s.showEmptyBars);
  const setShowEmptyBars = useUserSettings((s) => s.setShowEmptyBars);
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
      resolveSymbol: async (symbolNameWithParams, onSymbolResolvedCallback, _onErrorCallback) => {
        // symbolNameWithParams is used to pass additional parameters such as `has_empty_bars` to update the chart
        // without re-rendering it. The params part is removed, and only the actual symbol is sent to trading view as
        // part of the symbolInfo.
        const { baseSymbolName, params } = parseSymbolWithParams(symbolNameWithParams);
        const { has_empty_bars } = params;
        // If `has_empty_bars` has any value, check if it's `true`.
        // Otherwise, use `showEmptyBars`, the value from local storage.
        const isTruthy = !!has_empty_bars;
        const emptyBars = isTruthy ? has_empty_bars === "true" : showEmptyBars;

        const { symbol } = symbolToEmojis(baseSymbolName);
        if (symbol !== props.symbol) {
          const newRoute = path.join(ROUTES.market, symbol);
          router.push(newRoute);
          router.refresh();
        }

        const symbolInfo = constructLibrarySymbolInfo(symbol, emptyBars);
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

          const noData = bars.length === 0;
          if (noData && isFetchForMostRecentBars) {
            // Create a single empty bar if there's no trading activity, otherwise the chart shows "No chart data".
            const dummyBar = createDummyBar(periodDuration);
            bars.push(dummyBar);
          }

          onHistoryCallback(bars, { noData });
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
        const to = Date.now() / 1000;
        // Subtract 100h so that 100 1h candles are shown by default.
        const from = to - 100 * 60 * 60;

        chart
          .setVisibleRange({
            from,
            to,
          })
          .catch((error) => {
            console.error("Error applying visible range:", error);
          });
      });

      tvWidget.current.headerReady().then(() => {
        if (!tvWidget.current) return;
        const btn = tvWidget.current.createButton();

        const { setState } = createSwitch(btn, {
          initialState: showEmptyBars,
          label: "Empty candles",
          onTitle: "Hide empty candles",
          offTitle: "Show empty candles",
        });

        btn.addEventListener("click", () => {
          const chart = tvWidget.current?.activeChart();
          if (!chart) return;
          setShowEmptyBars((prev) => {
            const show = !prev;
            chart.setSymbol(formatSymbolWithParams(chart.symbol(), { has_empty_bars: show }));
            setState(show);
            return show;
          });
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
