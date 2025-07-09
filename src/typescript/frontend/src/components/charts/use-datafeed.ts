import { useEventStore, useUserSettings } from "context/event-store-context";
import { decodeSymbolsForChart, isArenaChartSymbol, parseSymbolWithParams } from "lib/chart-utils";
import { useRouter } from "next/navigation";
import path from "path";
import { useMemo } from "react";
import { ROUTES } from "router/routes";

import { periodEnumToRawDuration } from "@/sdk/const";
import type { IBasicDataFeed } from "@/static/charting_library";
import type { BarWithNonce } from "@/store/event/candlestick-bars";

import { ResolutionStringToPeriod } from "./const";
import { createDummyBar, fetchCandlesticksForChart } from "./get-bars";
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
  const getRegisteredMarketMap = useEventStore((s) => s.getRegisteredMarkets);
  const getMeleeMap = useEventStore((s) => s.getMeleeMap);
  const maybeUpdateMeleeLatestBar = useEventStore((s) => s.maybeUpdateMeleeLatestBar);
  const maybeUpdateMarketLatestBar = useEventStore((s) => s.maybeUpdateMarketLatestBar);

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
        const { firstDataRequest: isFetchForMostRecentBars } = periodParams;
        const period = ResolutionStringToPeriod[resolution];
        const periodDuration = periodEnumToRawDuration(period);
        const symbol = symbolInfoToSymbol(symbolInfo);

        let bars: BarWithNonce[] = [];

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

            if (isFetchForMostRecentBars) {
              maybeUpdateMeleeLatestBar(bars.at(-1), period, meleeID);
            }
          } else {
            const entry = getRegisteredMarketMap().get(symbol);
            if (!entry) {
              console.error("Market metadata not in state for:", symbol);
              return;
            }

            const { marketID } = entry.marketMetadata;

            bars = await fetchCandlesticksForChart({
              marketID: marketID.toString(),
              periodParams,
              period,
            });

            if (isFetchForMostRecentBars) {
              maybeUpdateMarketLatestBar(bars.at(-1), period, symbol);
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
      subscribeToPeriod,
      unsubscribeFromPeriod,
      getMeleeMap,
      getShowEmptyBars,
      maybeUpdateMeleeLatestBar,
      maybeUpdateMarketLatestBar,
      symbol,
      router,
    ]
  );

  return datafeed;
};
