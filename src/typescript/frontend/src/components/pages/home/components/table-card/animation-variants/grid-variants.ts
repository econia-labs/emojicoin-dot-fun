import { getEmojicoinEventTime, type AnyEmojicoinEvent } from "@sdk/types/types";
import { type AnimationControls } from "framer-motion";
import { type AnyNonGridTableCardVariant } from "./event-variants";

export const ANIMATION_DURATION = 0.15;
export const LAYOUT_DURATION = 0.2;
export const PORTAL_ANIMATION_DURATION = 0.25;
export const PER_ROW_DELAY = 0.02;
export const INITIAL_GRID_ANIMATION_DELAY = 0.02;

export const LONG_PORTAL_DURATION = LAYOUT_DURATION * 2;
const INSERTION_DELAY = LAYOUT_DURATION * 0.5;

// This isn't the longest animation ("initial" is), but for the purpose of updating the grid
// with a debounced animation effect, it is. Revisit this if we change the animation times.
export const TOTAL_ANIMATION_TIME = ANIMATION_DURATION;

type GridDataAndLayoutDelay = GridData & { layoutDelay: number };

export const tableCardVariants = {
  unshift: () => ({
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
  "portal-backwards": () => ({
    opacity: [1, 1, 1, 1, 1, 1, 1],
    scale: [1, 0, 0, 0, 0, 0, 1],
    transition: {
      duration: LAYOUT_DURATION * 2,
      ease: "easeInOut",
      delay: 0,
    },
  }),
  "portal-forwards": ({ layoutDelay }: GridDataAndLayoutDelay) => ({
    opacity: [1, 1, 1, 1, 1, 1, 1],
    scale: [1, 0, 0, 0, 0, 0, 1],
    transition: {
      duration: LAYOUT_DURATION * 1.1,
      ease: "easeInOut",
      delay: layoutDelay - 0.1,
    },
  }),
  "moving-down": ({ layoutDelay }: GridDataAndLayoutDelay) => ({
    opacity: [1, 1, 1, 1, 1],
    scale: [1, 0.7, 0.1, 0, 1],
    transition: {
      duration: LAYOUT_DURATION * 1.25,
      ease: "easeInOut",
      delay: layoutDelay - 0.1,
    },
  }),
  default: () => ({
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
      delay: idx * INITIAL_GRID_ANIMATION_DELAY,
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

// Set the `symbol` <span> value to `variant` to view these variants in action and how they work.
export const determineGridAnimationVariant = ({
  coordinates: { prev, curr },
  rowLength,
  runInitialAnimation,
}: {
  coordinates: GridCoordinateHistory;
  rowLength: number;
  runInitialAnimation?: boolean;
}): { variant: TableCardVariants; layoutDelay: number } => {
  const defaultDelay = ((prev?.row ?? 0) + 1) * (rowLength * PER_ROW_DELAY);

  if (runInitialAnimation)
    return {
      variant: "initial",
      layoutDelay: defaultDelay,
    };
  const inPreviousGrid = typeof prev !== "undefined";
  const isBeingInserted = !inPreviousGrid;
  if (isBeingInserted) {
    return {
      variant: "unshift",
      layoutDelay: defaultDelay,
    };
  }

  const simpleHorizontalShift = curr.index - prev.index === 1 && curr.row === prev.row;
  const gridIndexIncreased = curr.index > prev.index;
  const gridIndexDecreased = curr.index < prev.index;
  const isMovingVertically = prev.row !== curr.row;

  if (simpleHorizontalShift) {
    return {
      variant: "default",
      layoutDelay: defaultDelay,
    };
  }

  const portalDelay = (prev.row + 1) * (rowLength * PER_ROW_DELAY);

  if (gridIndexDecreased && isMovingVertically) {
    if (curr.col === 0 && curr.row === 0) {
      return {
        variant: "portal-backwards",
        layoutDelay: PORTAL_ANIMATION_DURATION,
      };
    }
    return {
      variant: "portal-backwards",
      layoutDelay: portalDelay,
    };
  }
  if (gridIndexIncreased && isMovingVertically) {
    return {
      variant: "portal-forwards",
      layoutDelay: portalDelay,
    };
  }
  if (isMovingVertically) {
    return {
      variant: "moving-down",
      layoutDelay: portalDelay,
    };
  }
  return {
    variant: "default",
    layoutDelay: defaultDelay,
  };
};

export type GridCoordinateHistory = {
  prev?: GridCoordinate;
  curr: GridCoordinate;
};

export type GridCoordinate = {
  row: number;
  col: number;
  index: number;
};

export type GridData = {
  coordinates: GridCoordinateHistory;
  distance: number;
};

const getRow = (index: number, rowLength: number) => Math.floor(index / rowLength);
const getColumn = (index: number, rowLength: number) => index % rowLength;
const getDistance = (a: GridCoordinate, b?: GridCoordinate) =>
  b ? Math.sqrt((a.row - b.row) ** 2 + (a.col - b.col) ** 2) : 0;

export const calculateGridData = ({
  index,
  prevIndex,
  rowLength,
}: {
  index: number;
  prevIndex?: number;
  rowLength: number;
}): GridData => {
  const curr: GridCoordinate = {
    row: getRow(index, rowLength),
    col: getColumn(index, rowLength),
    index,
  };
  const prev =
    typeof prevIndex !== "undefined"
      ? {
          row: getRow(prevIndex, rowLength),
          col: getColumn(prevIndex, rowLength),
          index: prevIndex,
        }
      : undefined;
  const distance = getDistance(curr, prev);

  return {
    coordinates: {
      curr,
      prev,
    },
    distance,
  };
};

export default tableCardVariants;
