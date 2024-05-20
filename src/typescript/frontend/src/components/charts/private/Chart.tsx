// import { useRouter } from "next/router";
import { useEffect, useMemo, useRef } from "react";

import {
  DAY_TO_CANDLESTICK_RESOLUTION,
  EXCHANGE_NAME,
  MS_IN_ONE_DAY,
  TV_CHARTING_LIBRARY_RESOLUTIONS,
  WIDGET_OPTIONS,
} from "../const";
// import { type ApiMarket, type MarketData } from "@/types/api";
// import { toDecimalPrice, toDecimalSize } from "@/utils/econia";
// import { getAllDataInTimeRange, getClientTimezone } from "@/utils/helpers";
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
} from "@/static/charting_library";
import { getClientTimezone, resolveToEmojiSymbol } from "lib/chart-utils";
import { getAllCandlesticks } from "@econia-labs/emojicoin-sdk";
import { REVALIDATIONS } from "lib/queries/const";
import { type ChartDataProps } from "../types";

export const revalidate = REVALIDATIONS.CHARTS.MARKET_DATA;

export interface ChartContainerProps extends ChartDataProps {
  marketID: number;
}

const configurationData: DatafeedConfiguration = {
  supported_resolutions: TV_CHARTING_LIBRARY_RESOLUTIONS as ResolutionString[],
  symbols_types: [
    {
      name: "crypto",
      value: "crypto",
    },
  ],
};

export const Chart = async (props: ChartContainerProps) => {
  const tvWidget = useRef<IChartingLibraryWidget>();
  const ref = useRef<HTMLDivElement>(null);
  // const _router = useRouter();
  console.log(props.markets)
  console.log(props.markets[2])
  console.log(props.marketID)
  console.log(props.marketID)
  console.log(props.marketID)
  console.log(props.marketID)
  console.log(props.marketID)
  console.log(props.marketID)
  const symbol = props.markets[props.marketID].emoji;
  console.log('symbol');
  console.log(symbol);

  const datafeed: IBasicDataFeed = useMemo(
    () => ({
      onReady: callback => {
        setTimeout(() => callback(configurationData));
      },
      searchSymbols: async (userInput, _exchange, _symbolType, onResultReadyCallback) => {
        const markets = Object.keys(props.markets).map(key => props.markets[Number(key)]);
        const symbols: SearchSymbolResultItem[] = markets
          .map(market => {
            return {
              description: market.name,
              exchange: EXCHANGE_NAME,
              full_name: `${EXCHANGE_NAME}:${market.name}`,
              symbol: market.emoji,
              ticker: market.emoji,
              type: "crypto",
            };
          })
          .filter(
            symbol =>
              symbol.full_name.includes(userInput) ||
              symbol.symbol.includes(userInput) ||
              symbol.ticker.includes(userInput) ||
              symbol.ticker.includes(resolveToEmojiSymbol(userInput) ?? ""),
          );

        onResultReadyCallback(symbols);
      },
      resolveSymbol: async (symbolName, onSymbolResolvedCallback) => {
        // TODO: Fix this. We need to keep some sort of state of all currently registered
        // markets and their data, indexing specifically from their SymbolID: MarketData
        // That is, "😊": MarketData
        // So the user can select the "😊" emoji as a symbol on the chart.
        /*
        if (symbol !== symbolName) {
          const market = props.allMarketData?.find(
            (market: ApiMarket | MarketData) => market.name == symbolName,
          );
          if (market) {
            router.push(`/market/${market.market_id}`);
          }
        }
        */

        const symbol = `${symbolName}`;
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
          has_intraday: true,
          has_daily: true,
          has_weekly_and_monthly: false,
          timezone: getClientTimezone() as Timezone,
          type: "crypto",
          supported_resolutions: configurationData.supported_resolutions,
          format: "price",
        };
        onSymbolResolvedCallback(symbolInfo);

        onSymbolResolvedCallback(symbolInfo);
      },
      getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
        const { from, to } = periodParams;
        try {
          // const queryParams = new URLSearchParams({
          //   market_id: `eq.${props.selectedMarket.market_id}`,
          //   resolution: `eq.${DAY_BY_RESOLUTION[resolution.toString()]}`,
          // });
          const data = await getAllCandlesticks({
            marketID: props.marketID,
            resolution: DAY_TO_CANDLESTICK_RESOLUTION[resolution.toString()],
          });

          if (data.length < 1) {
            onHistoryCallback([], {
              noData: true,
            });
            return;
          }

          const bars: Bar[] = data
            .map(p => ({
              time: new Date(Number(p.data.periodicStateMetadata.emitTime)).getTime(),
              open: Number(p.data.openPriceQ64),
              high: Number(p.data.highPriceQ64),
              low: Number(p.data.lowPriceQ64),
              close: Number(p.data.closePriceQ64),
            }))
            .filter((bar: Bar) => bar.time >= from * 1000 && bar.time <= to * 1000);
          // .map(
          //   (bar: {
          //     start_time: string;
          //     open: number;
          //     close: number;
          //     low: number;
          //     high: number;
          //     volume: number;
          //   }): Bar => ({
          //     time: new Date(bar.start_time).getTime(),
          //     open: bar.open,
          //     high: bar.high,
          //     low: bar.low,
          //     close: bar.close,
          //     volume: bar.volume,
          //   }),
          // )
          // .filter(
          //   (bar: Bar) => bar.time >= from * 1000 && bar.time <= to * 1000,
          // );
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
        _symbolInfo,
        _resolution,
        _onRealtimeCallback,
        _subscribeUID,
        _onResetCacheNeededCallback,
      ) => {},
      unsubscribeBars: async _subscriberUID => {},
    }),
    [symbol, props.marketID, props.markets], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    console.log('symbol:', symbol);

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
            `- ${to.toLocaleDateString("en-US", options)}\n`,
          );
        })
        .catch(error => {
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
        <div>The mobile wallet you are using does not support candlesticks. Please use a different mobile wallet</div>
      </div>
      <div ref={ref} className="relative h-full w-full"></div>
    </div>
  );
};

export default Chart;
