import { Fragment } from "react";
import { type EcTableColumn } from "./ecTable";
import { EcTableDataRow } from "./ecTableDataRow";
import { TableBody } from "./table";

interface Props<T> {
  items: T[];
  getKey: (item: T) => string;
  columns: EcTableColumn<T>[];
  renderRow?: (item: T) => React.ReactNode;
}

export const EcTableBody = <T,>({ items, renderRow, columns, getKey }: Props<T>) => {
  // Make sure there is either a renderRow function or a renderCell function in each column
  if (!renderRow && (!columns || columns.some((col) => !col.renderCell)))
    throw new Error(
      "Either renderRow must be defined or renderCell must be defined in each column"
    );

  return (
    <TableBody>
      {renderRow
        ? items.map((item) => <Fragment key={getKey(item)}>{renderRow(item)}</Fragment>)
        : items.map((item, rowIndex) => (
            <EcTableDataRow
              key={getKey(item)}
              item={item}
              rowIndex={rowIndex}
              renderCell={columns.map((col) => col.renderCell!)}
            />
          ))}
    </TableBody>
  );
};
