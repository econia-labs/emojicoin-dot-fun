import { Fragment } from "react";
import { type TableProps } from "./ecTable";
import { TableBody, TableCell, TableRow } from "./table";
import { cn } from "lib/utils/class-name";

export const EcTableBody = <T,>({
  className,
  items,
  renderRow,
  columns,
  getKey,
  onClick,
}: TableProps<T> & { className: string }) => {
  // Make sure there is either a renderRow function or a renderCell function in each column
  if (!renderRow && (!columns || columns.some((col) => !col.renderCell)))
    throw new Error(
      "Either renderRow must be defined or renderCell must be defined in each column"
    );

  return (
    <TableBody className={className}>
      {renderRow
        ? items.map((item, i) => <Fragment key={getKey(item)}>{renderRow(item, i)}</Fragment>)
        : items.map((item, rowIndex) => (
            <TableRow
              key={getKey(item)}
              index={rowIndex}
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
          ))}
    </TableBody>
  );
};
