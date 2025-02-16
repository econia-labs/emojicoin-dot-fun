import { cn } from "lib/utils";
import { type EcTableColumn } from "./ecTable";
import { TableCell, TableRow } from "./table";

interface Props<T> {
  item: T;
  rowIndex: number;
  renderCell: Array<NonNullable<EcTableColumn<T>["renderCell"]>>;
  onClick?: () => void;
}

const firstCelStyle = "pl-4";
const lastCellStyle = "pr-4";

export const EcTableDataRow = <T,>({ item, renderCell, onClick }: Props<T>) => {
  return (
    <TableRow onClick={onClick} className="cursor-pointer">
      {renderCell.map((cell, cellIndex) => (
        <TableCell
          key={cellIndex}
          className={cn(
            cellIndex === 0 ? firstCelStyle : "",
            cellIndex === renderCell.length - 1 ? lastCellStyle : ""
          )}
        >
          {cell(item)}
        </TableCell>
      ))}
    </TableRow>
  );
};
