import { cn } from "lib/utils/class-name";
import React from "react";

import { type EcTableColumn } from "./ecTable";
import { TableCell, TableRow } from "./table";

interface Props<T> {
  index: number;
  onClick?: (item: T) => void;
  animateInsertion?: boolean;
  height?: number;
  item: T;
  columns: EcTableColumn<T>[];
}

export const EcTableRow = <T,>({
  animateInsertion,
  index,
  onClick,
  height,
  item,
  columns,
}: Props<T>) => {
  return (
    <TableRow
      index={index}
      height={height}
      onClick={() => onClick?.(item)}
      className="cursor-pointer group"
      animateInsertion={animateInsertion}
    >
      {columns.map((col, cellIndex) => (
        <TableCell key={cellIndex}>
          <div
            className={cn(
              "flex",
              cellIndex === 0 ? "pl-4" : cellIndex === columns.length - 1 ? "pr-6" : "",
              cellIndex === 0 ? "justify-start" : "justify-end",
              col.className,
              col.cellClassName
            )}
          >
            {col.renderCell?.(item)}
          </div>
        </TableCell>
      ))}
    </TableRow>
  );
};
