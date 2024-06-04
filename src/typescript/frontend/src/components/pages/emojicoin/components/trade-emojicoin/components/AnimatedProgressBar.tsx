import { type GridProps } from "components/pages/emojicoin/types";
import { useEventStore } from "context/store-context";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";
import { getBondingCurveProgress } from "utils/bonding-curve";
import { type Types } from "@sdk/types/types";
import { type EventState } from "@store/event-store";
import { compareBigInt } from "@sdk/utils/compare-bigint";

const getLatestReserves = (args: {
  propsData: Types.MarketDataView;
  storeMarketData?: EventState["events"][keyof EventState["events"]]["marketData"];
  storeStateEvents: EventState["events"][keyof EventState["events"]]["stateEvents"];
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
  reserves.sort((a, b) => compareBigInt(a[1], b[1]));
  return reserves[0][0];
};

export const AnimatedProgressBar: React.FC<GridProps> = ({ data }) => {
  const market = useEventStore((s) => s.getMarket(data.marketID));

  const [progress, setProgress] = useState(getBondingCurveProgress(data.clammVirtualReserves));
  const sparklerControls = useAnimation();
  const progressControls = useAnimation();

  useEffect(() => {
    progressControls.start({
      width: `${progress}%`,
      transition: { type: "spring", stiffness: 100, damping: 20 },
    });

    sparklerControls.start({
      opacity: [0.6, 1, 0.6],
      transition: { duration: 0.5, repeat: Infinity, repeatType: "mirror" },
    });
  }, [progress, progressControls, sparklerControls]);

  useEffect(() => {
    console.log("data", data);
    console.log("events", market);
    const clammVirtualReserves = getLatestReserves({
      propsData: data,
      storeMarketData: market?.marketData,
      storeStateEvents: market?.stateEvents ?? [],
    });
    const percentage = getBondingCurveProgress(clammVirtualReserves);
    setProgress(percentage);
    /* eslint-disable-next-line */
  }, [data.clammVirtualReserves, data.numSwaps, market]);

  return (
    <div className="relative w-full h-6 bg-gray-300 rounded-full overflow-hidden">
      <motion.div
        className="absolute top-0 left-0 h-full bg-blue-500"
        style={{ width: `${progress}%` }}
        animate={progressControls}
      >
        <motion.div
          className="absolute top-0 right-0 h-full w-4 bg-yellow-400 rounded-full"
          animate={sparklerControls}
        />
      </motion.div>
    </div>
  );
};
