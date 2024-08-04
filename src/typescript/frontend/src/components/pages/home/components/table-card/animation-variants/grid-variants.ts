import { getEmojicoinEventTime, type AnyEmojicoinEvent } from "@sdk/types/types";
import { type AnimationControls } from "framer-motion";
import { type AnyNonGridTableCardVariant } from "./event-variants";
import { EMOJI_GRID_ITEM_HEIGHT, EMOJI_GRID_ITEM_WIDTH } from "../../const";

export const ANIMATION_DURATION = 0.3;
const INSERTION_DELAY = 0.2;
export const PER_ELEMENT_ANIMATION_DELAY = 0.02;

// This isn't the longest animation ("initial" is), but for the purpose of updating the grid
// with a debounced animation effect, it is. Revisit this if we change the animation times.
export const TOTAL_ANIMATION_TIME = ANIMATION_DURATION;

export const tableCardVariants = {
  unshift: (_idx: number) => ({
    opacity: [0, 1],
    scale: [0, 1],
    transition: {
      duration: ANIMATION_DURATION,
      type: "spring",
      scale: {
        duration: ANIMATION_DURATION - INSERTION_DELAY,
        delay: INSERTION_DELAY,
      },
    },
  }),
  backwards: (_idx: number) => ({
    opacity: [1, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
    scale: [1, 0.7, 0.1, 0, 0, 0, 1],
    transition: {
      duration: ANIMATION_DURATION,
      ease: "easeInOut",
    },
  }),
  toNewLine: (_idx: number) => ({
    opacity: [1, 1, 1, 1, 1],
    scale: [1, 0.7, 0.1, 0, 1],
    transition: {
      duration: ANIMATION_DURATION,
      ease: "easeInOut",
    },
  }),
  default: (_idx: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      duration: 0,
      delay: 0,
    },
  }),
  initial: (idx: number) => ({
    opacity: [0, 1],
    scale: 1,
    transition: {
      duration: ANIMATION_DURATION * 2,
      type: "just",
      delay: idx * PER_ELEMENT_ANIMATION_DELAY,
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
  latestEvent?: AnyEmojicoinEvent
) => {
  // Note this is in microseconds.
  const now = BigInt(Date.now()) * 1000n;
  const eventTime = latestEvent ? getEmojicoinEventTime(latestEvent) : now;
  return isMounted.current && now - eventTime <= FIVE_SECONDS_MS * 1000n;
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
    controls.start(variants[0]).then(() => {
      // Only check if the component is still mounted after the first animation, because we
      // always want to reset it to the initial state if the first animation is triggered.
      // console.log("should go back to initial?", shouldAnimateGlow(isMounted));
      if (shouldAnimateGlow(isMounted)) {
        controls.start(variants[1]);
      }
    });
  }
};

export const determineGridAnimationVariant = ({
  prevIndex,
  index,
  rowLength,
  runInitialAnimation,
}: {
  prevIndex?: number;
  index: number;
  rowLength: number;
  runInitialAnimation?: boolean;
}): TableCardVariants => {
  if (runInitialAnimation) return "initial";
  const inPreviousGrid = typeof prevIndex !== "undefined";
  const isBeingInserted = !inPreviousGrid;
  const isMovingForwards = inPreviousGrid && prevIndex < index;
  const isMovingBackwards = inPreviousGrid && prevIndex > index;
  const isMoving = isMovingBackwards || isMovingForwards;
  const isMovingToNewLine = inPreviousGrid && isMoving && index % rowLength === 0;

  // We have to check if it's moving here or it won't trigger the layout animation correctly.
  // Set the `symbol` <span> value to `variant` to view this in action and how it works.
  if (isMovingToNewLine) return isMoving ? "toNewLine" : "default";
  if (isBeingInserted) return "unshift";
  if (isMovingBackwards) return "backwards";
  if (isMovingForwards) return "default";

  return "default";
};

export const calculateDistance = ({
  index,
  prevIndex,
  rowLength,
}: {
  index: number;
  prevIndex?: number;
  rowLength: number;
}) => {
  /*                     row                         col               */
  const curr = [index % rowLength, Math.floor(index / rowLength)];
  const prev =
    typeof prevIndex === "undefined"
      ? [0, 0]
      : [prevIndex % rowLength, Math.floor(prevIndex / rowLength)];
  const deltaX = (curr[0] - prev[0]) * EMOJI_GRID_ITEM_WIDTH;
  const deltaY = (curr[1] - prev[1]) * EMOJI_GRID_ITEM_HEIGHT;
  return Math.sqrt(deltaX ** 2 + deltaY ** 2);
};

export default tableCardVariants;
