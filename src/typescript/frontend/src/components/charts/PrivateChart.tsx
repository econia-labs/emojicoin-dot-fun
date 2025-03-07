// cspell:word intraday
// cspell:word minmov
// cspell:word pricescale
import { useEffect, useMemo, useRef, useState } from "react";

import {
  EXCHANGE_NAME,
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
import {
  formatSymbolWithParams,
  getClientTimezone,
  hasTradingActivity,
  parseSymbolWithParams,
} from "lib/chart-utils";
import { type ChartContainerProps } from "./types";
import { useRouter } from "next/navigation";
import { ROUTES } from "router/routes";
import path from "path";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";
import { useEventStore, useUserSettings } from "context/event-store-context";
import { getPeriodStartTimeFromTime } from "@sdk/utils";
import { getSymbolEmojisInString, symbolToEmojis, toMarketEmojiData } from "@sdk/emoji_data";
import { type PeriodicStateEventModel, type MarketMetadataModel } from "@sdk/indexer-v2/types";
import { getMarketResource } from "@sdk/markets";
import { periodEnumToRawDuration, Trigger } from "@sdk/const";
import {
  type LatestBar,
  marketToLatestBars,
  periodicStateTrackerToLatestBar,
  toBar,
} from "@/store/event/candlestick-bars";
import { emoji, parseJSON } from "utils";
import { Emoji } from "utils/emoji";
import { getAptosClient } from "@sdk/utils/aptos-client";
import { createSwitch } from "components/charts/EmptyCandlesSwitch";

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
      resolveSymbol: async (symbolNameWithParams, onSymbolResolvedCallback, _onErrorCallback) => {
        // symbolNameWithParams is used to pass additional parameters such as `has_empty_bars` to update the chart without re-rendering it.
        // The params part is removed, and only the actual symbol is sent to trading view as part of the symbolInfo.
        const { baseSymbolName, params } = parseSymbolWithParams(symbolNameWithParams);
        const { has_empty_bars } = params;

        // Try to look up the symbol as if it were a market ID and then as if it were the actual market symbol,
        // aka, the emoji(s) symbol string.
        const { symbol } = symbolToEmojis(baseSymbolName);
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
          // If has_empty_bars is undefined, we use showEmptyBars value, which contains the value from local storage.
          has_empty_bars: has_empty_bars ? has_empty_bars === "true" || false : showEmptyBars,
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
      getBars: async (
        _symbolInfo,
        resolution,
        periodParams,
        onHistoryCallback,
        onErrorCallback
      ) => {
        const { to, countBack } = periodParams;

        try {
          const period = ResolutionStringToPeriod[resolution.toString()];
          const periodDuration = periodEnumToRawDuration(period);

          // The start timestamp is rounded so that all the people who load the webpage at a similar time get served
          // the same cached response.
          const params = new URLSearchParams({
            marketID: props.marketID,
            period: period.toString(),
            countBack: countBack.toString(),
            to: to.toString(),
          });
          const data: PeriodicStateEventModel[] = await fetch(
            `${ROUTES.api.candlesticks}?${params.toString()}`
          )
            .then((res) => res.text())
            .then((res) => parseJSON(res));

          data.sort((a, b) => Number(a.periodicMetadata.startTime - b.periodicMetadata.startTime));

          const endDate = new Date(to * 1000);
          const isFetchForMostRecentBars = endDate.getTime() - new Date().getTime() > 1000;

          // If the end time is in the future, it means that `getBars` is being called for the most recent candlesticks,
          // and thus we should append the latest candlestick to this dataset to ensure the chart is up to date.
          let latestBar: LatestBar | undefined;
          if (isFetchForMostRecentBars) {
            // Fetch the current candlestick data from the Aptos fullnode. This fetch call should *never* be cached.
            // Also, we specifically call this client-side because the server will get rate-limited if we call the
            // fullnode from the server for each client.
            const marketResource = await getMarketResource({
              aptos: getAptosClient(),
              marketAddress: props.marketAddress,
            });

            // Convert the market view data to `latestBar[]` and set the latest bars in our EventStore to those values.
            const latestBars = marketToLatestBars(marketResource);
            const marketEmojiData = toMarketEmojiData(marketResource.metadata.emojiBytes);
            const symbolEmojis = marketEmojiData.emojis.map((e) => e.emoji);
            const marketMetadata: MarketMetadataModel = {
              marketID: marketResource.metadata.marketID,
              time: 0n,
              marketNonce: marketResource.sequenceInfo.nonce,
              trigger: Trigger.PackagePublication, // Make up some bunk trigger, since it should be clear it's made up.
              symbolEmojis,
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
            // Only exclude bars that are after `to`.
            // see: https://www.tradingview.com/charting-library-docs/latest/connecting_data/datafeed-api/required-methods#getbars
            const inTimeRange = bar.time <= to * 1000;
            if (inTimeRange && hasTradingActivity(bar)) {
              const prev = acc.at(-1);
              if (prev) {
                bar.open = prev.close;
              }
              acc.push(bar);
            }
            return acc;
          }, []);

          // Push the latest bar to the bars array if it exists and update its `open` value to be the previous bar's
          // `close` if it's not the first/only bar.
          // This logic mirrors what we use in `createBarFrom[Swap|PeriodicState]` but we need it here because we
          // update the latest bar based on the market view every time we fetch with `getBars`, not just when a new
          // event comes in.
          if (latestBar) {
            const secondLatestBar = bars.at(-1);
            if (secondLatestBar) {
              // If the latest bar has no trading activity, set all of its fields to the previous bar's close.
              if (!hasTradingActivity(latestBar)) {
                latestBar.high = secondLatestBar.close;
                latestBar.low = secondLatestBar.close;
                latestBar.close = secondLatestBar.close;
              }
              if (secondLatestBar.close !== 0) {
                latestBar.open = secondLatestBar.close;
              } else {
                latestBar.open = latestBar.close;
              }
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
                time: Number(timeAsPeriod.toString()),
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
            noData: bars.length === 0, // && notAllEmptyBars,
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

  const [showErrorMessage, setShowErrorMessage] = useState<boolean>(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowErrorMessage(true);
    }, 3500);
    return () => clearTimeout(timeout);
  });

  return (
    <div className="relative w-full h-[420px]">
      <div className="absolute left-0 top-0 flex h-full w-full animate-fadeIn items-center justify-center text-center font-roboto-mono text-lg font-light leading-6 text-neutral-500 opacity-0 delay-[2000]">
        <div>
          {showErrorMessage ? (
            <>
              <div>
                <span>{"The browser you're using isn't supported. "}</span>
                <Emoji emojis={emoji("pensive face")} />
              </div>
              <div>
                <span>{" Please try viewing in another browser."}</span>
              </div>
            </>
          ) : (
            "Loading..."
          )}
        </div>
      </div>
      <div ref={ref} className="relative h-full w-full"></div>
    </div>
  );
};

export default Chart;
