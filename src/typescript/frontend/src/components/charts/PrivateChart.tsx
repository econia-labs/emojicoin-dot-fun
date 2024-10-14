// cspell:word intraday
// cspell:word minmov
// cspell:word pricescale
import { useEffect, useMemo, useRef } from "react";

import {
  EXCHANGE_NAME,
  MS_IN_ONE_DAY,
  ResolutionStringToPeriod,
  TV_CHARTING_LIBRARY_RESOLUTIONS,
  WIDGET_OPTIONS,
} from "./const";
import {
  type Bar,
  type DatafeedConfiguration,
  type IBasicDataFeed,
  type IChartingLibraryWidget,
  type LibrarySymbolInfo,
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
import { useEventStore } from "context/event-store-context";
import { getPeriodStartTimeFromTime } from "@sdk/utils";
import { getAptosConfig } from "lib/utils/aptos-client";
import { getSymbolEmojisInString, symbolToEmojis, toMarketEmojiData } from "@sdk/emoji_data";
import { type MarketMetadataModel } from "@sdk/indexer-v2/types";
import { getMarketResource } from "@sdk/markets";
import { Aptos } from "@aptos-labs/ts-sdk";
import { periodEnumToRawDuration, Trigger } from "@sdk/const";
import { fetchAllCandlesticksInTimeRange } from "@/queries/candlesticks";
import {
  type LatestBar,
  marketToLatestBars,
  periodicStateTrackerToLatestBar,
  toBar,
} from "@/store/event/candlestick-bars";

const configurationData: DatafeedConfiguration = {
  supported_resolutions: TV_CHARTING_LIBRARY_RESOLUTIONS,
  symbols_types: [
    {
      name: "crypto",
      value: "crypto",
    },
  ],
};

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
export const Chart = async (props: ChartContainerProps) => {
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
        setTimeout(() => callback(configurationData));
      },
      searchSymbols: async (userInput, _exchange, _symbolType, onResultReadyCallback) => {
        const data = Array.from(getRegisteredMarketMap().values());
        // TODO: Use the new emoji picker search with this..?
        const symbols = data.reduce<SearchSymbolResultItem[]>((acc, { marketMetadata }) => {
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
        }, []);
        onResultReadyCallback(symbols);
      },
      resolveSymbol: async (symbolName, onSymbolResolvedCallback, _onErrorCallback) => {
        // Try to look up the symbol as if it were a market ID and then as if it were the actual market symbol,
        // aka, the emoji(s) symbol string.
        const { symbol } = symbolToEmojis(symbolName);
        if (symbol !== props.symbol) {
          const newRoute = path.join(ROUTES.market, symbol);
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
          // Note that `has_empty_bars` causes invalid `time order violation` errors if it's set to `true`.
          // has_empty_bars: true,
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
          const period = ResolutionStringToPeriod[resolution.toString()];
          const periodDuration = periodEnumToRawDuration(period);
          const start = new Date(from * 1000);
          const end = new Date(to * 1000);
          // TODO: Consider that if our data is internally consistent and we run into performance/scalability issues
          // with this implementation below (fetching without regard for anything in state), we can store the values in
          // state and coalesce that with the data we fetch from the server.
          const data = await fetchAllCandlesticksInTimeRange({
            marketID: props.marketID,
            start,
            end,
            period,
          });

          const isFetchForMostRecentBars = end.getTime() - new Date().getTime() > 1000;

          // If the end time is in the future, it means that `getBars` is being called for the most recent candlesticks,
          // and thus we should append the latest candlestick to this dataset to ensure the chart is up to date.
          let latestBar: LatestBar | undefined;
          if (isFetchForMostRecentBars) {
            // Fetch the current candlestick data from the Aptos fullnode. This fetch call should *never* be cached.
            // Also, we specifically call this client-side because the server will get rate-limited if we call the
            // fullnode from the server for each client.
            const marketResource = await getMarketResource({
              aptos: new Aptos(getAptosConfig()),
              marketAddress: props.marketAddress,
            });

            // Convert the market view data to `latestBar[]` and set the latest bars in our EventStore to those values.
            const latestBars = marketToLatestBars(marketResource);
            const marketEmojiData = toMarketEmojiData(marketResource.metadata.emojiBytes);
            const marketMetadata: MarketMetadataModel = {
              marketID: marketResource.metadata.marketID,
              time: 0n,
              marketNonce: marketResource.sequenceInfo.nonce,
              trigger: Trigger.PackagePublication, // Make up some bunk trigger, since it should be clear it's made up.
              symbolEmojis: marketEmojiData.emojis.map((e) => e.emoji),
              marketAddress: marketResource.metadata.marketAddress,
              ...marketEmojiData,
            };
            setLatestBars({ marketMetadata, latestBars });

            // Get the period-specific state tracker for the current resolution/period type and set the latest bar on
            // the chart- *not* just in state- to the latest bar from that tracker.
            const tracker = marketResource.periodicStateTrackers.find(
              // These are most likely indexed in order, but in case they aren't, we use `find` here.
              (p) => Number(p.period) === periodDuration
            );
            if (!tracker) {
              throw new Error("This should never happen.");
            }
            const nonce = marketResource.sequenceInfo.nonce;
            latestBar = periodicStateTrackerToLatestBar(tracker, nonce);
          }
          // Filter the data so that all resulting bars are within the specified time range.
          // Also, update the `open` price to the previous bar's `close` price if it exists.
          // NOTE: Since `getBars` is called multiple times, this will result in several
          // bars having incorrect `open` values. This isn't a big deal but may result in
          // some visual inconsistencies in the chart.
          const bars: Bar[] = data.reduce((acc: Bar[], event) => {
            const bar = toBar(event);
            if (bar.time >= from * 1000 && bar.time <= to * 1000) {
              if (acc.at(-1)) {
                bar.open = acc.at(-1)!.close;
              }
              acc.push(bar);
            }
            return acc;
          }, []);

          // Push the latest bar to the bars array if it exists and update its `open` value to be the previous bar's
          // `close` if it's not the first/only bar.
          if (latestBar) {
            if (bars.at(-1)) {
              latestBar.open = bars.at(-1)!.close;
            }
            bars.push(latestBar);
          }

          if (bars.length === 0) {
            if (isFetchForMostRecentBars) {
              // If this is the most recent bar fetch and there is literally zero trading activity thus far,
              // we should create a single empty bar to get rid of the `No chart data` ghost error from showing.
              const time = BigInt(new Date().getTime()) * 1000n;
              const timeAsPeriod = getPeriodStartTimeFromTime(time, periodDuration) / 1000n;
              bars.push({
                time: Number(timeAsPeriod),
                open: 0,
                high: 0,
                low: 0,
                close: 0,
                volume: 0,
              });
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
