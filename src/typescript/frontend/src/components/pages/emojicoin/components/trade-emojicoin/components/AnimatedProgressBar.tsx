import { type GridProps } from "components/pages/emojicoin/types";
import { useEventStore } from "context/store-context";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";
import { getBondingCurveProgress } from "utils/bonding-curve";
import { type Types } from "@sdk/types/types";
import { compareBigInt } from "@sdk/utils/compare-bigint";
import { darkColors } from "theme/colors";

const getLatestReserves = (args: {
  propsData: Types.MarketDataView;
  storeMarketData?: Types.MarketDataView;
  storeStateEvents: Array<Types.StateEvent>;
}) => {
  const { propsData, storeMarketData, storeStateEvents } = args;
  const latestStoreState = storeStateEvents[0];
  const reserves: Array<[Types.Reserves, bigint]> = [
    [propsData.clammVirtualReserves, BigInt(propsData.numSwaps)],
  ];
  if (storeMarketData) {
    reserves.push([storeMarketData.clammVirtualReserves, BigInt(storeMarketData.numSwaps)]);
  }
  if (latestStoreState) {
    reserves.push([
      latestStoreState.clammVirtualReserves,
      BigInt(latestStoreState.cumulativeStats.numSwaps),
    ]);
  }
  reserves.sort((a, b) => compareBigInt(a[1], b[1])).reverse();
  return reserves[0][0];
};

export const AnimatedProgressBar: React.FC<GridProps> = ({ data }) => {
  const marketData = useEventStore((s) => s.getMarket(data.marketID).marketData);
  const stateEvents = useEventStore((s) => s.getMarket(data.marketID).stateEvents.events);

  const [progress, setProgress] = useState(getBondingCurveProgress(data.clammVirtualReserves));
  const progressBarControls = useAnimation();
  const flickerControls = useAnimation();

  useEffect(() => {
    progressBarControls.start({
      width: `${progress}%`,
      filter: `brightness(${1 + 3 * (progress / 100)}) hue-rotate(${progress * 3}deg)`,
      transition: {
        width: { type: "spring", stiffness: 100, damping: 20 },
        filter: { duration: 1.2, repeat: Infinity, repeatType: "mirror" },
      },
    });

    flickerControls.start({
      opacity: [0.9, 1, 0.95, 1],
      filter: [0, 0.4, 0.2, 0].map(
        (v) =>
          `brightness(${1.1 + v}) drop-shadow(0 0 ${v * 16}px ${darkColors.blue}77) hue-rotate(${v * 180}deg`
      ),
      transition: { duration: 1, repeat: 4, ease: "linear", repeatType: "mirror" },
    });
  }, [progress, progressBarControls, flickerControls]);

  useEffect(() => {
    const clammVirtualReserves = getLatestReserves({
      propsData: data,
      storeMarketData: marketData,
      storeStateEvents: stateEvents ?? [],
    });
    const percentage = getBondingCurveProgress(clammVirtualReserves);
    setProgress(percentage);
    /* eslint-disable-next-line */
  }, [data.clammVirtualReserves, data.numSwaps, marketData, stateEvents]);

  return (
    <motion.div className="relative flex w-full rounded-sm h-[100%] !p-0">
      <motion.div
        style={{
          filter: "brightness(1) drop-shadow(0 1px 2px #fff0)",
        }}
        className="relative flex my-auto mx-[2ch] opacity-[0.9]"
        animate={flickerControls}
      >
        <span className="uppercase text-2xl text-nowrap text-ellipsis text-light-gray">
          Bonding progress:&nbsp;
        </span>
        <span className="uppercase text-2xl text-nowrap text-ellipsis text-white">{`${progress.toFixed(1)}%`}</span>
      </motion.div>
      <motion.div
        className="absolute drop-shadow-voltage bottom-0 bg-blue h-[1px]"
        style={{ width: "0%", filter: "brightness(1) hue-rotate(0deg)" }}
        animate={progressBarControls}
      ></motion.div>
      <motion.div
        className="absolute bottom-0 left-0 h-full w-[0%]"
        style={{ width: `${progress}%` }}
        animate={progressBarControls}
      >
        <motion.svg
          width="20"
          height="20"
          className="absolute bottom-0 overflow-visible z-1 ml-[100%] opacity-100 w-0"
          style={{ filter: "brightness(1) hue-rotate(0deg)" }}
          animate={progressBarControls}
        >
          <motion.circle
            cx={0}
            cy={20}
            initial={{ r: 0 }}
            animate={{ r: 3.5 }}
            transition={{
              type: "spring",
              stiffness: 50,
              damping: 10,
            }}
            fill="black"
            stroke={darkColors.blue}
            className="drop-shadow-voltage"
            strokeWidth={1}
          />
        </motion.svg>
      </motion.div>
    </motion.div>
  );
};
