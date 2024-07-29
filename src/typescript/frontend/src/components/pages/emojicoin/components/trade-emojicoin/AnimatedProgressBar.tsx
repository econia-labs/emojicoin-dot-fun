import { Text } from "components";
import { type GridProps } from "components/pages/emojicoin/types";
import { useEventStore, useWebSocketClient } from "context/state-store-context";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";
import { getBondingCurveProgress } from "utils/bonding-curve";
import { type Types } from "@sdk/types/types";
import { compareBigInt } from "@sdk/utils/compare-bigint";
import { darkColors } from "theme/colors";
import { useMatchBreakpoints } from "@hooks/index";

const getLatestReserves = (args: {
  propsData: Types.MarketDataView;
  storeMarketData?: Types.MarketDataView;
  storeStateEvents: readonly Types.StateEvent[];
}) => {
  const { propsData, storeMarketData, storeStateEvents } = args;
  const latestStoreState = storeStateEvents[0];
  const reserves: Array<[[number, number], bigint]> = [
    [
      [propsData.clammVirtualReservesBase, propsData.clammVirtualReservesQuote],
      BigInt(propsData.numSwaps),
    ],
  ];
  if (storeMarketData) {
    reserves.push([
      [storeMarketData.clammVirtualReservesBase, storeMarketData.clammVirtualReservesQuote],
      BigInt(storeMarketData.numSwaps),
    ]);
  }
  if (latestStoreState) {
    reserves.push([
      [
        Number(latestStoreState.clammVirtualReserves.base),
        Number(latestStoreState.clammVirtualReserves.quote),
      ],
      BigInt(latestStoreState.cumulativeStats.numSwaps),
    ]);
  }
  reserves.sort((a, b) => compareBigInt(a[1], b[1])).reverse();
  return reserves[0][0];
};

export const AnimatedProgressBar = (props: GridProps) => {
  const { isDesktop } = useMatchBreakpoints();
  const data = props.data;
  const marketID = data.marketID.toString();
  const { marketData, stateEvents } = useEventStore((s) => ({
    marketData: s.getMarket(marketID)?.marketData,
    stateEvents: s.getMarket(marketID)?.stateEvents ?? [],
  }));

  // Set the initial progress with data passed in from props, aka server component data.
  const [progress, setProgress] = useState(getBondingCurveProgress(data.clammVirtualReservesQuote));

  // Then track the latest progress from the store.
  useEffect(() => {
    if (marketData && stateEvents) {
      const clammVirtualReserves = getLatestReserves({
        propsData: data,
        storeMarketData: marketData,
        storeStateEvents: stateEvents ?? [],
      });
      const percentage = getBondingCurveProgress(clammVirtualReserves[1]);
      setProgress(percentage);
    }
    /* eslint-disable-next-line */
  }, [data, marketData, stateEvents]);

  const { subscribe, unsubscribe } = useWebSocketClient((s) => s);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    subscribe.state(marketID);
    return () => unsubscribe.state(marketID);
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const progressBarControls = useAnimation();
  const flickerControls = useAnimation();

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

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

  return (
    <motion.div className="relative flex w-full rounded-sm h-[100%] !p-0">
      <motion.div
        style={
          isDesktop
            ? {
                filter: "brightness(1) drop-shadow(0 1px 2px #fff0)",
              }
            : {
                filter: "brightness(1) drop-shadow(0 1px 2px #fff0)",
                width: "100%",
                padding: ".7em",
              }
        }
        className="relative flex my-auto mx-[2ch] opacity-[0.9]"
        animate={flickerControls}
      >
        <Text
          textScale={isDesktop ? "pixelHeading3" : "pixelHeading4"}
          color="lightGray"
          textTransform="uppercase"
        >
          Bonding progress:&nbsp;
        </Text>
        <Text
          textScale={isDesktop ? "pixelHeading3" : "pixelHeading4"}
          color="white"
          textTransform="uppercase"
        >
          {`${progress.toFixed(1)}%`}
        </Text>
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
