import { Fragment } from "react";
import { type TableProps } from "./ecTable";
import { TableBody } from "./table";
import { EcTableRow } from "./ecTableRow";

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
        : items.map((item, i) => (
            <EcTableRow
              key={getKey(item)}
              item={item}
              index={i}
              columns={columns}
              onClick={onClick}
            />
          ))}
    </TableBody>
  );
};
