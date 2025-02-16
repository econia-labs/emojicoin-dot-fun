import { cn } from "lib/utils";
import { type EcTableColumn } from "./ecTable";
import { TableCell, TableRow } from "./table";

interface Props<T> {
  item: T;
  className?: string;
  rowIndex: number;
  columns: EcTableColumn<T>[];
  onClick?: () => void;
}

export const EcTableDataRow = <T,>({ className, item, columns, onClick }: Props<T>) => {
  return (
    <TableRow onClick={onClick} className="cursor-pointer group">
      {columns.map((col, cellIndex) => (
        <TableCell key={cellIndex}>
          <span className={cn("flex", col.className, col.cellClassName)}>
            {col.renderCell?.(item)}
          </span>
        </TableCell>
      ))}
    </TableRow>
  );
};
