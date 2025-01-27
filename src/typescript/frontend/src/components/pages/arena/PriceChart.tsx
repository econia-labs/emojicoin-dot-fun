import { type ChartData } from "chart.js";
import "chart.js/auto";
import { Box, type Props } from "./utils";
import darkTheme from "theme/dark";
import { Line } from "react-chartjs-2";
import { FormattedNumber } from "components/FormattedNumber";
import { useRef } from "react";
import useNodeDimensions from "@hooks/use-node-dimensions";

const PriceChart: React.FC<Props & { height: number; width: number }> = ({
  market0,
  market1,
  height,
  width,
}) => {
  const now = Math.floor(new Date().getTime() / 1000 / 60);
  const size = 15;
  const labels = Array.from({ length: size }).map((_, i) => {
    const date = new Date((now - size + i) * 60 * 1000);
    const hour = date.getHours().toString().padStart(2, "0");
    const minute = date.getMinutes().toString().padStart(2, "0");
    return `${hour}:${minute}`;
  });
  const color0 = darkTheme.colors.econiaBlue;
  const color1 = darkTheme.colors.pink;
  const data: ChartData<"line", (number | null)[], string> = {
    labels,
    datasets: [
      {
        label: market0.market.symbolEmojis.join(""),
        data: [1.1, 1.2, 1.3, 1.4, 1, 0.5, 0.69, 0.75, 1.3, 1.5, 2, 2.1, null, null, 2.3],
        borderColor: color0,
        spanGaps: true,
        yAxisID: "0",
        pointStyle: false,
      },
      {
        label: market1.market.symbolEmojis.join(""),
        data: [2.9, 2.8, 2.7, 2.6, 3, 4, 3.5, 3.2, 2.6, 2.1, 2, 1.9, null, null, 1.5].map((e) =>
          e !== null ? e * 0.01 : null
        ),
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
    interaction: {
      intersect: false,
      mode: "index",
    },
    plugins: {
      legend: {
        display: false,
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
        },
      },
      "1": {
        position: "right",
        ticks: {
          color: color1,
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
  return <Line data={data} options={options as any} height={height} width={width} />;
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
          value={props.arenaInfo.arenaInfo.volume}
          nominalize
          suffix=" APT"
        />
      </div>
      <div className="h-[100%]" ref={ref}>
        <PriceChart {...{ height, width }} {...props} />
      </div>
    </Box>
  );
};
