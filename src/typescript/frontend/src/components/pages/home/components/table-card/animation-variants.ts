import { getEmojicoinEventTime, type AnyEmojicoinEvent } from "@sdk/types/types";
import { type AnimationControls } from "framer-motion";
import { type AnyNonGridTableCardVariant } from "../animation-config";

const DURATION = 0.3;
const INSERTION_DELAY = 0.2;
const PER_ELEMENT_DELAY = 0.02;

// This isn't the longest animation ("initial" is), but for the purpose of updating the grid
// with a debounced animation effect, it is. Revisit this if we change the animation times.
export const TOTAL_ANIMATION_TIME = DURATION;

export const tableCardVariants = {
  unshift: (_idx: number) => ({
    opacity: [0, 1],
    scale: [0, 1],
    transition: {
      duration: DURATION,
      type: "spring",
      scale: {
        duration: DURATION - INSERTION_DELAY,
        delay: INSERTION_DELAY,
      },
    },
  }),
  backwards: (_idx: number) => ({
    opacity: [1, 0.5, 0.5, 0.5, 0.5, 1],
    scale: [1, 0, 0, 0, 0, 0, 1],
    transition: {
      duration: DURATION,
      ease: "easeInOut",
    },
  }),
  toNewLine: (_idx: number) => ({
    opacity: [1, 0.5, 0.3, 0.5, 1],
    scale: [1, 0, 0, 0, 1],
    transition: {
      duration: DURATION,
      ease: "easeInOut",
    },
  }),
  default: (_idx: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: DURATION,
      type: "just",
    },
  }),
  initial: (idx: number) => ({
    opacity: [0, 1],
    scale: [1, 1],
    transition: {
      duration: 0,
      opacity: {
        duration: DURATION * 2,
        type: "just",
        delay: idx * PER_ELEMENT_DELAY,
      },
    },
  }),
};

export type TableCardVariants = keyof typeof tableCardVariants;

const ONE_SECOND_MS = 1000n;
const FIVE_SECONDS_MS = 5n * ONE_SECOND_MS;

/**
 * To avoid animations being started when the component is unmounted or the event that triggers
 * the animation was already consumed, we check if the component is mounted and if the event
 * happened less than the animation grace period.
 *
 * This is to avoid the animation being triggered when the sorting filter is changed and the
 * component is unmounted and mounted again.
 */
export const shouldAnimateGlow = (
  isMounted: React.MutableRefObject<boolean>,
  latestEvent: AnyEmojicoinEvent
) => {
  // Note this is in microseconds.
  const now = BigInt(Date.now()) * 1000n;
  return isMounted.current && now - getEmojicoinEventTime(latestEvent) <= FIVE_SECONDS_MS * 1000n;
};

export const safeQueueAnimations = async ({
  controls,
  variants,
  isMounted,
  latestEvent,
}: {
  controls: AnimationControls;
  variants: [AnyNonGridTableCardVariant, AnyNonGridTableCardVariant];
  isMounted: React.MutableRefObject<boolean>;
  latestEvent: AnyEmojicoinEvent;
}) => {
  if (shouldAnimateGlow(isMounted, latestEvent)) {
    await controls.start(variants[0]);
    if (shouldAnimateGlow(isMounted, latestEvent)) {
      await controls.start(variants[1]);
    }
  }
};

export default tableCardVariants;
