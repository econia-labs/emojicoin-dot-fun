import { cn } from "lib/utils/class-name";
import { type EcTableColumn } from "./ecTable";
import { TableCell, TableRow } from "./table";

interface Props<T> {
  index: number;
  onClick?: (item: T) => void;
  height?: number;
  item: T;
  columns: EcTableColumn<T>[];
}

export const EcTableRow = <T,>({ index, onClick, height, item, columns }: Props<T>) => {
  return (
    <TableRow
      key={index}
      index={index}
      height={height}
      onClick={() => onClick?.(item)}
      className="cursor-pointer group"
    >
      {columns.map((col, cellIndex) => (
        <TableCell key={cellIndex}>
          <span
            className={cn(
              "flex",
              cellIndex === 0 ? "pl-6" : cellIndex === columns.length - 1 ? "pr-6" : "",
              cellIndex === 0 ? "justify-start" : "justify-end",
              col.className,
              col.cellClassName
            )}
          >
            {col.renderCell?.(item)}
          </span>
        </TableCell>
      ))}
    </TableRow>
  );
};
