import React, { useMemo } from "react";
import { EMOJI_GRID_ITEM_WIDTH, EMOJI_GRID_ITEM_HEIGHT } from "../../../const";
import { useGridRowLength } from "../../hooks/use-grid-items-per-line";
import { GridRowBorders } from "../../styled";
import { motion } from "framer-motion";
import { getColumn, getRow } from "../../../table-card/animation-variants/grid-variants";

const GridRowLines = ({
  length,
  gridRowLinesKey,
  shouldAnimate,
}: {
  length: number;
  gridRowLinesKey: string;
  shouldAnimate: boolean;
}) => {
  const rowLength = useGridRowLength();

  const gridItems = useMemo(
    () =>
      Array.from({ length }).map((_, i) => {
        const row = getRow(i, rowLength);
        const col = getColumn(i, rowLength);
        // The last element in the grid lines should not animate if it isn't the first render, because otherwise
        // elements added to the grid will animate in with the shine animation and look odd. It's only supposed to
        // animate a single time, but because we use keys to replace the grid with different arrays of elements to
        // prevent layout snapping, we must add this check.
        if (i === length - 1 && !shouldAnimate) {
          return false;
        }
        return {
          backgroundColor: ["#00000000", "#33343D66", "#00000000"],
          transition: {
            backgroundColor: {
              duration: 1,
              delay: row * 0.04 + col * 0.04 + 0.2,
            },
          },
        };
      }),
    [length, rowLength, shouldAnimate]
  );

  return (
    <>
      <GridRowBorders key={gridRowLinesKey}>
        {/* To prevent auto-scrolling to the top of the page when the elements re-order, we provide
             a static grid of horizontal lines that are the same height as the emoji grid items. */}
        {gridItems.map((animateProps, i) => {
          return (
            <motion.div
              initial={{
                backgroundColor: "#00000000",
              }}
              animate={animateProps}
              key={`${i}-clone-for-grid-lines`}
              className="horizontal-grid-line"
              style={{
                width: EMOJI_GRID_ITEM_WIDTH,
                // To account for the new bottom borders on each grid element.
                height: EMOJI_GRID_ITEM_HEIGHT + 1,
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
