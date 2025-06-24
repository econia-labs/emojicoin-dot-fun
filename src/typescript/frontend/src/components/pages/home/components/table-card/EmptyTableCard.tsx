import { motion, type MotionProps } from "framer-motion";
import { useMemo } from "react";

import { calculateGridData, tableCardVariants } from "./animation-variants/grid-variants";
import type { GridLayoutInformation, TableCardProps } from "./types";

/**
 * Emulates the `TableCard` component styles without any of the unnecessary calculations or animations.
 * @param param0
 */
export default function EmptyTableCard({
  index,
  rowLength,
  pageOffset,
  sortBy,
}: Pick<TableCardProps, "index"> & GridLayoutInformation & MotionProps) {
  const { curr } = useMemo(() => calculateGridData({ index, rowLength }), [index, rowLength]);
  return (
    <motion.div
      layout
      layoutId={`empty-card-${sortBy}-${pageOffset + index}`}
      initial={{
        opacity: 0,
      }}
      className="group border-solid bg-black border border-dark-gray hover:z-10 hover:border-ec-blue"
      variants={tableCardVariants}
      animate={"initial"}
      custom={{ curr }}
      transition={{
        type: "just",
        delay: 0,
        duration: 0,
      }}
      whileHover={{
        filter: "brightness(1.05) saturate(1.1)",
        boxShadow: "0 0 9px 7px rgba(8, 108, 217, 0.2)",
        transition: {
          filter: { duration: 0.05 },
          boxShadow: { duration: 0.05 },
        },
      }}
    ></motion.div>
  );
}
