import { type GridProps } from "components/pages/emojicoin/types";
import { useEventStore } from "context/store-context";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";
import { getBondingCurveProgress } from "utils/bonding-curve";
import { type Types } from "@sdk/types/types";
import { compareBigInt } from "@sdk/utils/compare-bigint";

const getLatestReserves = (args: {
  propsData: Types.MarketDataView;
  storeMarketData?: Types.MarketDataView;
  storeStateEvents: Array<Types.StateEvent>;
}) => {
  const { propsData, storeMarketData, storeStateEvents } = args;
  const latestStoreState = storeStateEvents.at(-1);
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
  const stateEvents = useEventStore((s) => s.getMarket(data.marketID).stateEvents);

  const [progress, setProgress] = useState(getBondingCurveProgress(data.clammVirtualReserves));
  const sparklerControls = useAnimation();
  const progressBarControls = useAnimation();
  const shimmerControls = useAnimation();

  useEffect(() => {
    progressBarControls.start({
      width: `${progress}%`,
      filter: `brightness(${1 + 3 * (progress / 100)}) hue-rotate(${progress * 3}deg)`,
      transition: {
        width: { type: "spring", stiffness: 100, damping: 20 },
        filter: { duration: 1.2, repeat: Infinity, repeatType: "mirror" },
      },
    });

    sparklerControls.start({
      opacity: [0.6, 1, 0.6],
      transition: { duration: 0.5, repeat: Infinity, repeatType: "mirror" },
    });
  }, [progress, progressBarControls, sparklerControls]);

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
    <motion.div className="relative w-full drop-shadow-voltage rounded-sm overflow-hidden h-[100%] !p-0">
      <motion.div
        className="absolute top-0 left-0 h-full bg-ec-blue"
        style={{ opacity: 1, width: `${progress}%`, filter: "brightness(1) hue-rotate(0deg)" }}
        animate={progressBarControls}
      >
        <motion.div
          className="absolute top-0 right-0 h-full w-4 bg-ec-blue "
          animate={shimmerControls}
        />
      </motion.div>
    </motion.div>
  );
};
