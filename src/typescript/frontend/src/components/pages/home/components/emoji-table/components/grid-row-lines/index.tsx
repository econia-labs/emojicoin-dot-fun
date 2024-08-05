import React, { useMemo } from "react";
import { EMOJI_GRID_ITEM_WIDTH, EMOJI_GRID_ITEM_HEIGHT } from "../../../const";
import { useGridRowLength } from "../../hooks/use-grid-items-per-line";
import { GridRowBorders } from "../../styled";
import { motion } from "framer-motion";

// To account for the new bottom borders on each grid element.
const HEIGHT = EMOJI_GRID_ITEM_HEIGHT + 1;

const GridRowLines = ({ length, gridRowLinesKey }: { length: number; gridRowLinesKey: string }) => {
  const rowLength = useGridRowLength();

  const gridItems = useMemo(
    () =>
      Array.from({ length }).map((_, i) => ({
        row: Math.floor(i / rowLength),
        col: i % rowLength,
      })),
    [length, rowLength]
  );

  return (
    <>
      <GridRowBorders key={gridRowLinesKey}>
        {/* To prevent auto-scrolling to the top of the page when the elements re-order, we provide
             a static grid of horizontal lines that are the same height as the emoji grid items. */}
        {gridItems.map(({ row, col }, i) => {
          return (
            <motion.div
              initial={{
                backgroundColor: "#00000000",
              }}
              animate={{
                backgroundColor: ["#00000000", "#33343D66", "#00000000"],
                transition: {
                  backgroundColor: {
                    duration: 1,
                    delay: row * 0.04 + col * 0.04 + 0.2,
                  },
                },
              }}
              key={`${i}-live-clone-for-grid-lines`}
              className="horizontal-grid-line"
              style={{
                width: EMOJI_GRID_ITEM_WIDTH,
                height: HEIGHT,
              }}
            />
          );
        })}
      </GridRowBorders>
    </>
  );
};

const MemoizedGridRowLines = React.memo(GridRowLines);

export default MemoizedGridRowLines;
