import { type ChartData } from "chart.js";
import "chart.js/auto";
import { Box, type Props } from "./utils";
import darkTheme from "theme/dark";
import { Line } from "react-chartjs-2";
import { FormattedNumber } from "components/FormattedNumber";
import { useRef } from "react";
import useNodeDimensions from "@hooks/use-node-dimensions";
import { q64ToBig } from "@sdk/utils";
import { PeriodicStateEventModel } from "@sdk/indexer-v2/types";

const PriceChart: React.FC<Props & { height: number; width: number }> = ({
  market0,
  market1,
  height,
  width,
  candlesticksMarket0,
  candlesticksMarket1,
}) => {
  const now = Math.floor(new Date().getTime() / 1000 / 60);
  const size = 15;
  const points = Array.from({ length: size }).map((_, i) => {
    return new Date((now - size + i) * 60 * 1000);
  });
  const labels = points.map((date) => {
    const hour = date.getHours().toString().padStart(2, "0");
    const minute = date.getMinutes().toString().padStart(2, "0");
    return `${hour}:${minute}`;
  });
  const color0 = darkTheme.colors.econiaBlue;
  const color1 = darkTheme.colors.pink;
  const toLatestCandlestick = (p: Date, candlesticks: PeriodicStateEventModel[]) => {
    let c = candlesticks.findLast(
      (c) => Number(c.periodicMetadata.startTime / 1000n) <= p.getTime()
    );
    return c ? q64ToBig(c.periodicState.openPriceQ64).toNumber() : 0;
  };
  const dataset0 = points.map((p) => toLatestCandlestick(p, candlesticksMarket0));
  const dataset1 = points.map((p) => toLatestCandlestick(p, candlesticksMarket1));
  const data: ChartData<"line", (number | null)[], string> = {
    labels,
    datasets: [
      {
        label: market0.market.symbolEmojis.join(""),
        data: dataset0,
        borderColor: color0,
        spanGaps: true,
        yAxisID: "0",
        pointStyle: false,
      },
      {
        label: market1.market.symbolEmojis.join(""),
        data: dataset1,
        borderColor: color1,
        spanGaps: true,
        yAxisID: "1",
        pointStyle: false,
      },
    ],
    yLabels: ["0", "1"],
    xLabels: ["xAxis"],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index",
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          label: (context: any) => {
            const format = {
              maximumFractionDigits: 8,
            };
            const formatter = new Intl.NumberFormat("en-US", format);
            console.log(context)
            return `${formatter.format(context.raw)} ${context.dataset.label}`;
          },
        },
      },
    },
    scales: {
      "0": {
        position: "right",
        grid: {
          color: "#00000000",
        },
        ticks: {
          color: color0,
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          callback: (value: any) => {
            const format = {
              maximumFractionDigits: 8,
            };
            const formatter = new Intl.NumberFormat("en-US", format);
            return formatter.format(value);
          },
        },
      },
      "1": {
        position: "right",
        ticks: {
          color: color1,
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          callback: (value: any) => {
            const format = {
              maximumFractionDigits: 8,
            };
            const formatter = new Intl.NumberFormat("en-US", format);
            return formatter.format(value);
          },
        },
      },
      x: {
        grid: {
          color: "#00000000",
        },
      },
    },
  };

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return <Line data={data} options={options as any} />;
};

export const PriceChartDesktopBox: React.FC<Props> = (props) => {
  const ref = useRef<HTMLDivElement>(null);
  const { height, width } = useNodeDimensions(ref);
  return (
    <Box className="relative w-[100%] h-[100%] col-start-1 col-end-3">
      <div className="absolute top-[1em] left-[2em]">
        <div className="text-light-gray tracking-wider uppercase text-xl">Total volume</div>
        <FormattedNumber
          className="font-forma text-white text-4xl"
          value={props.arenaInfo.volume}
          nominalize
          suffix=" APT"
        />
      </div>
      <div className="relative h-[100%]" ref={ref}>
        <PriceChart {...{ height, width }} {...props} />
      </div>
    </Box>
  );
};
