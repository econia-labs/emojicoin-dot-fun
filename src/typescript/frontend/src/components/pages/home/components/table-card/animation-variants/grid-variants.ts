import { type AnimationControls } from "framer-motion";
import { type AnyNonGridTableCardVariant } from "./event-variants";
import {
  type AnyEventModel,
  type ChatEventModel,
  type LiquidityEventModel,
  type MarketLatestStateEventModel,
  type MarketRegistrationEventModel,
  type SwapEventModel,
} from "@sdk/indexer-v2/types";

export const MAX_ELEMENTS_PER_LINE = 7;
export const ANIMATION_DEBOUNCE_TIME = 1111;

export const ANIMATION_DURATION = 0.3;
export const LAYOUT_DURATION = 0.4;
export const PORTAL_BACKWARDS_ANIMATION_DURATION = LAYOUT_DURATION * 1.5;
export const PER_ROW_DELAY = 0.01;

export const PORTAL_DURATION = LAYOUT_DURATION * 3;
const INSERTION_DELAY = LAYOUT_DURATION * 0.5;

// This isn't the longest animation ("initial" is), but for the purpose of updating the grid
// with a debounced animation effect, it is. Revisit this if we change the animation times.
export const TOTAL_ANIMATION_TIME = ANIMATION_DURATION;

export type EmojicoinAnimationEvents =
  | SwapEventModel
  | ChatEventModel
  | LiquidityEventModel
  | MarketRegistrationEventModel
  | MarketLatestStateEventModel;

type GridDataAndLayoutDelay = GridCoordinateHistory & { layoutDelay: number };

export const tableCardVariants = {
  // Insertions to the front of the grid.
  unshift: ({ curr }: GridDataAndLayoutDelay) => ({
    scale: [0, 0.5, 1, 1, 1.5, 1.2, 1],
    opacity: [0, 0.5, 1, 1, 1, 1, 1],
    transition: {
      duration: LAYOUT_DURATION * 1,
      type: "spring",
      delay: INSERTION_DELAY + (curr.index * PER_ROW_DELAY) / 5,
    },
  }),
  // Up and/or left.
  "portal-backwards": () => ({
    opacity: [1, 0, 0, 1],
    scale: [1, 0, 0, 1],
    transition: {
      times: [0, 0.3, 0.7, 1],
      duration: PORTAL_BACKWARDS_ANIMATION_DURATION,
      delay: 0,
      type: "just",
    },
  }),
  // Down and/or right.
  "portal-forwards": ({ layoutDelay }: GridDataAndLayoutDelay) => ({
    opacity: [1, 1, 1, 1, 1, 1, 1],
    scale: [1, 0, 0, 0, 0, 0, 1],
    transition: {
      duration: LAYOUT_DURATION * 1.1,
      ease: "easeInOut",
      delay: layoutDelay,
    },
  }),
  // Shifting one grid position over on the same line.
  default: () => ({
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      duration: 0,
      delay: 0,
    },
  }),
  // The initial animation for each grid element.
  initial: ({ curr }: GridDataAndLayoutDelay) => ({
    opacity: [0, 1],
    scale: [1, 1],
    transition: {
      opacity: {
        duration: ANIMATION_DURATION * 2,
        type: "just",
        delay: (curr.col * PER_ROW_DELAY + curr.row * PER_ROW_DELAY) * 7,
      },
    },
  }),
};

export type TableCardVariants = keyof typeof tableCardVariants;

// Set the `symbol` <span> value to `variant` to view these variants in action and how they work.
export const determineGridAnimationVariant = ({
  prev,
  curr,
  rowLength,
  runInitialAnimation,
}: GridCoordinateHistory & {
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

export const getRow = (index: number, rowLength: number) => Math.floor(index / rowLength);
export const getColumn = (index: number, rowLength: number) => index % rowLength;

export const calculateGridData = ({
  index,
  prevIndex,
  rowLength,
}: {
  index: number;
  prevIndex?: number;
  rowLength: number;
}): GridCoordinateHistory => {
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

  return {
    curr,
    prev,
  };
};

export default tableCardVariants;
