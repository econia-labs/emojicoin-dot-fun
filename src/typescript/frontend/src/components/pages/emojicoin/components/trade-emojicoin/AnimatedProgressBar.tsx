import type { GridProps } from "components/pages/emojicoin/types";
import { useEventStore } from "context/event-store-context";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";
import { darkColors } from "theme/colors";

import { getBondingCurveProgress } from "@/sdk/utils/bonding-curve";

export const AnimatedProgressBar = (props: GridProps) => {
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
    <motion.div className="flex h-[100%] w-full rounded-sm !p-0">
      <motion.div
        style={{ filter: "brightness(1) drop-shadow(0 1px 2px #fff0)" }}
        className="w-100% relative my-auto flex p-[0.7em] px-3 opacity-[0.9] md:w-auto"
        animate={flickerControls}
      >
        <p className="uppercase text-light-gray pixel-heading-4">Bonding progress:&nbsp;</p>
        <p className="uppercase pixel-heading-4">{`${progress.toFixed(1)}%`}</p>
      </motion.div>
      <motion.div
        className="absolute bottom-0 h-[1px] bg-blue drop-shadow-voltage"
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
          className="z-1 absolute bottom-0 ml-[100%] w-0 overflow-visible opacity-100"
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
