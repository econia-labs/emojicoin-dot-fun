import { useEffect, useRef } from "react";
import { MS_IN_ONE_DAY, WIDGET_OPTIONS } from "./const";
import { type IChartingLibraryWidget, type Timezone, widget } from "@static/charting_library";
import { type ChartContainerProps } from "./types";
import { BrowserNotSupported } from "./BrowserNotSupported";
import { useDatafeed } from "./datafeed";

/**
 * The TradingView Chart component. This component is responsible for rendering the TradingView chart with the usage of
 * the `datafeed` API. It also handles resolving market symbols from user input with the market metadata passed down
 * from a server component/fetch in the form of the `EventStore["markets"]` registered market map data.
 *
 * Requires that the market registration map has been loaded prior to passing the symbol props to this component.
 *
 * Please see
 * {@link https://github.com/econia-labs/emojicoin-dot-fun/tree/main/src/typescript/frontend/src/components/charts/README.md}
 * for a more detailed explanation of the architectural data flow.
 * @returns
 */
export const Chart = ({
  symbol,
  secondarySymbol,
  navigateOnSearch = true,
}: Omit<ChartContainerProps, "emojis">) => {
  const tvWidget = useRef<IChartingLibraryWidget>();
  const ref = useRef<HTMLDivElement>(null);
  const datafeed = useDatafeed(symbol, navigateOnSearch);

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

        if (secondarySymbol) {
          chart.createStudy("Overlay", true, false, { symbol: secondarySymbol });
        }
      });
    }

    return () => {
      if (tvWidget.current != null) {
        tvWidget.current.remove();
        tvWidget.current = undefined;
      }
    };
  }, [datafeed, symbol, secondarySymbol]);

  return (
    <div className="relative w-full h-[420px]">
      <BrowserNotSupported />
      <div ref={ref} className="relative h-full w-full"></div>
    </div>
  );
};

export default Chart;
