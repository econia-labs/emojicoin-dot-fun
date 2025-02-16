import { useMemo } from "react";
import { ResolutionStringToPeriod } from "./const";
import { type IBasicDataFeed } from "@static/charting_library";
import { useRouter } from "next/navigation";
import { useEventStore } from "context/event-store-context";
import { getSymbolEmojisInString, symbolToEmojis } from "@sdk/emoji_data";
import { periodEnumToRawDuration } from "@sdk/const";
import {
  CONFIGURATION_DATA,
  constructLibrarySymbolInfo,
  searchSymbolsFromRegisteredMarketMap,
  symbolInfoToSymbol,
} from "./trading-view-utils";
import {
  createDummyBar,
  fetchCandlesticksForChart,
  fetchLatestBarsFromMarketResource,
  updateLastTwoBars,
} from "./get-bars";
import path from "path";
import { ROUTES } from "router/routes";

export const useDatafeed = (mainSeriesSymbol: string, navigateOnSearch?: boolean) => {
  const router = useRouter();
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
        if (navigateOnSearch && mainSeriesSymbol !== symbol) {
          const newRoute = path.join(ROUTES.market, symbol);
          router.push(newRoute);
          router.refresh();
        }

        const symbolInfo = constructLibrarySymbolInfo(symbolName);
        setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
      },
      getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
        const { to } = periodParams;
        const period = ResolutionStringToPeriod[resolution.toString()];
        const periodDuration = periodEnumToRawDuration(period);
        const symbol = symbolInfoToSymbol(symbolInfo);
        const entry = getRegisteredMarketMap().get(symbol);
        if (!entry) {
          console.error("Market metadata not in state for:", symbol);
          return;
        }
        const { marketID, marketAddress } = entry.marketMetadata;

        try {
          const bars = await fetchCandlesticksForChart({
            marketID,
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
        const symbol = symbolInfoToSymbol(symbolInfo);
        const period = ResolutionStringToPeriod[resolution.toString()];
        const marketEmojis = getSymbolEmojisInString(symbol);
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
    // prettier-ignore
    [
      getRegisteredMarketMap, // Stable reference to a zustand function.
      setLatestBars,          // Stable reference to a zustand function.
      subscribeToPeriod,      // Stable reference to a zustand function.
      unsubscribeFromPeriod,  // Stable reference to a zustand function.
      mainSeriesSymbol,
      navigateOnSearch,
      router,
    ]
  );

  return datafeed;
};
