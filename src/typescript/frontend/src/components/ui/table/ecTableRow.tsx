import { cn } from "lib/utils/class-name";

import type { EcTableColumn } from "./ecTable";
import { TableCell, TableRow } from "./table";

interface Props<T> {
  index: number;
  onClick?: (item: T, i: number) => void;
  // Same as key, obtained from getKey. But key is a reserved prop in React, so we need to use a different name.
  id: string;
  animateInsertion?: boolean;
  height?: number;
  item: T;
  columns: EcTableColumn<T>[];
  selectedRowKey?: string | null;
}

export const EcTableRow = <T,>({
  animateInsertion,
  index,
  id,
  onClick,
  height,
  item,
  columns,
  selectedRowKey,
}: Props<T>) => {
  return (
    <TableRow
      index={index}
      height={height}
      onClick={() => onClick?.(item, index)}
      aria-selected={selectedRowKey === id}
      className={cn("group cursor-pointer", selectedRowKey === id && "bg-ec-blue *:text-black")}
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
