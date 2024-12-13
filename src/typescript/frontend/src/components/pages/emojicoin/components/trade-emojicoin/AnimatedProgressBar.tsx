import { Text } from "components";
import { type GridProps } from "components/pages/emojicoin/types";
import { useEventStore } from "context/event-store-context";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";
import { getBondingCurveProgress } from "@sdk/utils/bonding-curve";
import { darkColors } from "theme/colors";
import { useMatchBreakpoints } from "@hooks/index";

export const AnimatedProgressBar = (props: GridProps) => {
  const { isDesktop } = useMatchBreakpoints();
  const data = props.data;
  const { state, transaction } = data.state;
  const stateEvents = useEventStore((s) => s.markets.get(props.data.symbol)?.stateEvents ?? []);

  // Set the initial progress with data passed in from props, aka server component data.
  const [progress, setProgress] = useState(
    getBondingCurveProgress(state.clammVirtualReserves.quote)
  );

  // Then track the latest progress from the store.
  useEffect(() => {
    const quoteReserves = (() => {
      const propsReserves = state.clammVirtualReserves.quote;
      const stateEvent = stateEvents.at(0);
      if (!stateEvent) {
        return propsReserves;
      }
      const propsTime = transaction.time;
      if (propsTime > stateEvent.transaction.time) {
        return propsReserves;
      }
      return stateEvent.state.clammVirtualReserves.quote;
    })();
    const percentage = getBondingCurveProgress(quoteReserves);
    setProgress(percentage);
  }, [state.clammVirtualReserves.quote, transaction.time, stateEvents]);

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
    <motion.div className="flex w-full rounded-sm h-[100%] !p-0">
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
        className="relative flex my-auto px-[21px] opacity-[0.9]"
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
