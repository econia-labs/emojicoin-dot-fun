import { useEventStore, useUserSettings } from "context/event-store-context";
import { decodeSymbolsForChart, isArenaChartSymbol, parseSymbolWithParams } from "lib/chart-utils";
import { useRouter } from "next/navigation";
import path from "path";
import { useMemo } from "react";
import { ROUTES } from "router/routes";

import { isNonArenaPeriod, periodEnumToRawDuration } from "@/sdk/const";
import type { Bar, IBasicDataFeed } from "@/static/charting_library";

import { ResolutionStringToPeriod } from "./const";
import {
  createDummyBar,
  fetchCandlesticksForChart,
  fetchLatestBarsFromMarketResource,
  updateLastTwoBars,
} from "./get-bars";
import {
  CONFIGURATION_DATA,
  constructLibrarySymbolInfo,
  searchSymbolsFromRegisteredMarketMap,
  symbolInfoToSymbol,
} from "./trading-view-utils";

export const useDatafeed = (symbol: string) => {
  const router = useRouter();
  // Use a stable getter function for `showEmptyBars` lest the entire chart re-render on toggle.
  const getShowEmptyBars = useUserSettings((s) => s.getShowEmptyBars);
  const subscribeToPeriod = useEventStore((s) => s.subscribeToPeriod);
  const unsubscribeFromPeriod = useEventStore((s) => s.unsubscribeFromPeriod);
  const setLatestBars = useEventStore((s) => s.setLatestBars);
  const getRegisteredMarketMap = useEventStore((s) => s.getRegisteredMarkets);
  const getMeleeMap = useEventStore((s) => s.getMeleeMap);

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
        const { baseChartSymbol, params } = parseSymbolWithParams(symbolNameWithParams);
        const { has_empty_bars } = params;
        // If `has_empty_bars` has any value, check if it's `true`.
        // Otherwise, use `showEmptyBars`, the value from local storage.
        const isTruthy = !!has_empty_bars;
        const emptyBars = isTruthy ? has_empty_bars === "true" : getShowEmptyBars();

        const { primarySymbol, secondarySymbol } = decodeSymbolsForChart(baseChartSymbol);
        // Navigate to a different page if there's only one symbol and it doesn't match the initial
        // one passed to the hook.
        if (!secondarySymbol && primarySymbol && primarySymbol !== symbol) {
          const newRoute = path.join(ROUTES.market, primarySymbol);
          router.push(newRoute);
          router.refresh();
        }

        const symbolInfo = constructLibrarySymbolInfo(baseChartSymbol, emptyBars);
        setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
      },
      getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
        const { to } = periodParams;
        const period = ResolutionStringToPeriod[resolution];
        const periodDuration = periodEnumToRawDuration(period);
        const symbol = symbolInfoToSymbol(symbolInfo);

        // If the end time is in the future, it means that `getBars` is being called for the most recent candlesticks,
        // and thus we should append the latest candlestick to this dataset to ensure the chart is up to date.
        const endDate = new Date(to * 1000);
        const isFetchForMostRecentBars = endDate.getTime() - new Date().getTime() > 1000;

        let bars: Bar[] = [];

        try {
          if (isArenaChartSymbol(symbol)) {
            const meleeID = getMeleeMap().get(symbol);
            if (!meleeID) {
              console.error("Melee ID not in state for arena symbol: ", symbol);
              return;
            }

            bars = await fetchCandlesticksForChart({
              meleeID: meleeID.toString(),
              periodParams,
              period,
            });
          } else {
            if (!isNonArenaPeriod(period)) {
              throw new Error("Invalid period type for a non-arena symbol.");
            }
            const entry = getRegisteredMarketMap().get(symbol);
            if (!entry) {
              console.error("Market metadata not in state for:", symbol);
              return;
            }

            const { marketID, marketAddress } = entry.marketMetadata;

            bars = await fetchCandlesticksForChart({
              marketID: marketID.toString(),
              periodParams,
              period,
            });

            if (isFetchForMostRecentBars) {
              const { marketMetadata, latestBar, latestBars } =
                await fetchLatestBarsFromMarketResource({
                  marketAddress,
                  period,
                });

              // Set the latest bars in the state store.
              setLatestBars({ marketMetadata, latestBars });
              if (latestBar) {
                // Mutates the `bars` array.
                updateLastTwoBars(bars, latestBar);
              }
            }
          }

          const noData = bars.length === 0;
          if (noData && isFetchForMostRecentBars) {
            // Create a single empty bar if there's no trading activity, otherwise the chart shows "No chart data".
            const dummyBar = createDummyBar(periodDuration, symbol);
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
        const symbol = symbolInfoToSymbol(symbolInfo);
        const period = ResolutionStringToPeriod[resolution.toString()];
        subscribeToPeriod({
          symbol,
          period,
          cb: onRealtimeCallback,
        });
      },
      unsubscribeBars: async (subscriberUID) => {
        // subscriberUIDs come in the form of `${emoji}_#_$<period as string>`
        // For example: `🚀_#_5` for the `🚀` market for a resolution of period `5`.
        const [symbol, resolution] = subscriberUID.split("_#_");
        const period = ResolutionStringToPeriod[resolution];
        unsubscribeFromPeriod({
          symbol,
          period,
        });
      },
    }),
    [
      // All the functions below are stable references to zustand functions.
      getRegisteredMarketMap,
      setLatestBars,
      subscribeToPeriod,
      unsubscribeFromPeriod,
      getMeleeMap,
      getShowEmptyBars,
      symbol,
      router,
    ]
  );

  return datafeed;
};
