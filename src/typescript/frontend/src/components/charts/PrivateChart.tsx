import { useEffect, useRef } from "react";
import { WIDGET_OPTIONS } from "./const";
import { type IChartingLibraryWidget, type Timezone, widget } from "@static/charting_library";
import { encodeSymbolsForChart, formatSymbolWithParams } from "lib/chart-utils";
import { type ChartContainerProps } from "./types";
import { useUserSettings } from "context/event-store-context";
import { BrowserNotSupported } from "./BrowserNotSupported";
import { createSwitch } from "components/charts/EmptyCandlesSwitch";
import { useDatafeed } from "./use-datafeed";
import { cn } from "lib/utils/class-name";

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
 */
export const Chart = ({
  symbol,
  secondarySymbol = undefined,
  className = "",
}: Omit<ChartContainerProps, "emojis">) => {
  const tvWidget = useRef<IChartingLibraryWidget>();
  const ref = useRef<HTMLDivElement>(null);
  const showEmptyBars = useUserSettings((s) => s.showEmptyBars);
  const setShowEmptyBars = useUserSettings((s) => s.setShowEmptyBars);
  const datafeed = useDatafeed(symbol);

  useEffect(() => {
    if (ref.current) {
      tvWidget.current = new widget({
        ...WIDGET_OPTIONS,
        symbol: encodeSymbolsForChart(symbol, secondarySymbol),
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

        // Remove the odd, floating price label on the volume study- it conflicts with the price label too much.
        const volumeStudy = chart.getAllStudies().find((v) => v.name === "Volume");
        if (volumeStudy) {
          chart.getStudyById(volumeStudy.id).applyOverrides({ showLabelsOnPriceScale: false });
        }
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
    // Parent must be relative for the visual fallback with `BrowserNotSupported` to work.
    <div className={cn("relative", className)}>
      <BrowserNotSupported />
      <div ref={ref} className="relative h-full w-full"></div>
    </div>
  );
};

export default Chart;
