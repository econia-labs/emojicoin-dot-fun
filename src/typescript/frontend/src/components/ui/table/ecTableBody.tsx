import { Fragment, useEffect, useMemo, useState } from "react";

import { type TableProps } from "./ecTable";
import { EcTableRow } from "./ecTableRow";
import { LoadMore } from "./loadMore";
import { TableBody, TableCell, TableRow } from "./table";

export const EcTableBody = <T,>({
  className,
  items,
  renderRow,
  rowHeight = 33,
  columns,
  getKey,
  onClick,
  pagination,
  minRows,
}: TableProps<T> & { minRows: number; className: string }) => {
  const [firstItemKey, setFirstItemKey] = useState<string | undefined>(undefined);

  const animateInsertion = useMemo(() => {
    if (items.length === 0) return false;
    return !!firstItemKey && getKey(items[0]) !== firstItemKey;
  }, [firstItemKey, getKey, items]);

  useEffect(() => {
    if (items.length > 0) {
      setFirstItemKey(getKey(items[0]));
    }
  }, [getKey, items]);

  // Make sure there is either a renderRow function or a renderCell function in each column.
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
              animateInsertion={animateInsertion && i === 0}
              key={getKey(item)}
              item={item}
              height={rowHeight}
              index={i}
              columns={columns}
              onClick={onClick}
            />
          ))}
      {Array.from({ length: minRows - items.length }).map((_, i) => (
        <TableRow key={i} index={items.length + i} height={rowHeight} className="w-full">
          <TableCell colSpan={columns.length} />
        </TableRow>
      ))}
      {pagination && items.length > minRows && (
        <TableRow>
          <TableCell colSpan={columns.length}>
            <LoadMore query={pagination} />
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  );
};
