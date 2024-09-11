import { type AnimationControls, type HTMLMotionProps, motion } from "framer-motion";
import { useWindowSize } from "react-use";
import Confetti from "react-confetti";
import { type Dispatch, type MutableRefObject, type SetStateAction, useRef, useState } from "react";
import { sleep } from "@sdk/utils";
import { createPortal } from "react-dom";

/**
 * The tween duration for the confetti animation is very inaccurate- a few stray confetti fall after 1/3 of the way
 * through, but the animation is mostly done at that point. To account for this, we end the animation manually after
 * roughly half of the way through.
 */
const TWEEN_DURATION = 15000;
const INTERRUPT_AT = 0.4;

const renderHelper = (setter: Dispatch<SetStateAction<boolean>>) => {
  setter(true);
  sleep(TWEEN_DURATION * INTERRUPT_AT).then(() => {
    setter(false);
  });
};

/**
 * In case we reach the end of the total number of confetti components, we cycle back, keeping track of the most recent
 * confetti index in order to stop and then re-render the next. The delay to restart on cycle is how long we wait in
 * between un-rendering and then rendering the confetti component.
 */
const DELAY_TO_RESTART_ON_CYCLE = 100;
const stopAndStartHelper = (nextSetter: Dispatch<SetStateAction<boolean>>) => {
  nextSetter(false);
  sleep(DELAY_TO_RESTART_ON_CYCLE).then(() => {
    nextSetter(true);
  });
};

/**
 * The Confetti component we use. We specify the next confetti to start and the onConfettiComplete function.
 */
const CustomConfetti = ({
  lastIdx, // The most recently used index for starting a confetti animation.
  secondaryIndex, // The secondary index for this confetti.
  setter,
}: {
  lastIdx: MutableRefObject<number>;
  secondaryIndex: number;
  setter: Dispatch<SetStateAction<boolean>>;
}) => {
  const { width, height } = useWindowSize();

  return (
    <Confetti
      width={width}
      height={height}
      numberOfPieces={3000}
      gravity={0.15}
      tweenDuration={TWEEN_DURATION}
      recycle={false}
      onConfettiComplete={() => {
        if (lastIdx.current !== secondaryIndex) {
          // Note that we're basically just ensuring that we don't accidentally cancel a "restarted" animation due to
          // an "regularly started" animation finishing.
          setter(false);
        }
      }}
    />
  );
};

/**
 * To explain this sort of convoluted mess:
 *  - This animation cycles through confetti components, in order of 1, 2, 3, 4, 5, 6, where 4, 5, 6 represent
 *    the three components but having been restarted mid animation.
 *  - We keep track of the most recent confetti used, differentiating between regularly started and restarted
 *    confetti components with `lastIdx.current`, where 1 is regularly started and 4 is restarted, but they are
 *    the same component.
 *  - This facilitates seamlessly restarting confetti without having to create some arbitrary, infinite number
 *    of components.
 */
export const RewardsAnimation = ({
  controls,
  ...props
}: {
  controls: AnimationControls;
} & HTMLMotionProps<"div">) => {
  const [renderFirst, setRenderFirst] = useState(false);
  const [renderSecond, setRenderSecond] = useState(false);
  const [renderThird, setRenderThird] = useState(false);
  const lastIdx = useRef(0);

  return createPortal(
    <motion.div
      initial={{
        display: "none",
      }}
      animate={controls}
      variants={{
        celebration: {
          display: "initial",
        },
      }}
      onAnimationStart={() => {
        if (!renderFirst) {
          lastIdx.current = 1;
          renderHelper(setRenderFirst);
        } else if (!renderSecond) {
          lastIdx.current = 2;
          renderHelper(setRenderSecond);
        } else if (!renderThird) {
          lastIdx.current = 3;
          renderHelper(setRenderThird);
        } else {
          if (lastIdx.current === 1) {
            lastIdx.current = 5; // normal index + 3, to circumvent an in progress onConfettiComplete.
            stopAndStartHelper(setRenderSecond);
          } else if (lastIdx.current === 2) {
            lastIdx.current = 6; // normal index + 3, to circumvent an in progress onConfettiComplete.
            stopAndStartHelper(setRenderThird);
          } else if (lastIdx.current === 3) {
            lastIdx.current = 4; // normal index + 3, to circumvent an in progress onConfettiComplete.
            stopAndStartHelper(setRenderFirst);
          } else {
            // All out of confetti...it should never reach here. Nevertheless, we do nothing.
          }
        }
      }}
      className="absolute top-0 left-0 z-[101]"
      {...props}
    >
      {renderFirst && (
        <CustomConfetti lastIdx={lastIdx} secondaryIndex={4} setter={setRenderFirst} />
      )}
      {renderSecond && (
        <CustomConfetti lastIdx={lastIdx} secondaryIndex={5} setter={setRenderSecond} />
      )}
      {renderThird && (
        <CustomConfetti lastIdx={lastIdx} secondaryIndex={6} setter={setRenderThird} />
      )}
    </motion.div>,
    document.body
  );
};
