import { cn } from "lib/utils/class-name";
import { type EcTableColumn } from "./ecTable";
import { TableCell, TableRow } from "./table";

interface Props<T> {
  item: T;
  rowIndex: number;
  columns: EcTableColumn<T>[];
  onClick?: () => void;
}

export const EcTableDataRow = <T,>({ item, columns, onClick }: Props<T>) => {
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
