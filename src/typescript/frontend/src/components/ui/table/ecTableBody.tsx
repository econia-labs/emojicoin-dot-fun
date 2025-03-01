import { Fragment, useMemo } from "react";
import { type TableProps } from "./ecTable";
import { TableBody, TableCell, TableRow } from "./table";
import { EcTableRow } from "./ecTableRow";
import { LoadMore } from "./loadMore";
import AnimatedLoadingBoxes from "components/pages/launch-emojicoin/animated-loading-boxes";

export const EcTableBody = <T,>({
  containerHeight,
  className,
  items,
  renderRow,
  rowHeight = 33,
  columns,
  getKey,
  onClick,
  pagination,
  isLoading,
}: TableProps<T> & { containerHeight: number; className: string }) => {
  // Make sure there is either a renderRow function or a renderCell function in each column.
  if (!renderRow && (!columns || columns.some((col) => !col.renderCell)))
    throw new Error(
      "Either renderRow must be defined or renderCell must be defined in each column"
    );

  const minRows = useMemo(() => {
    if (containerHeight) {
      const height = containerHeight;
      // We subtract 1 because of the header, and 1 to remove last row to prevent overflow
      return Math.floor(height / rowHeight) - 2;
    }
    return 0;
  }, [rowHeight, containerHeight]);

  if (items.length === 0)
    return (
      <TableBody className={className}>
        <tr style={{ height: containerHeight - rowHeight - 1.5 + "px" }}>
          <TableCell colSpan={columns.length}>
            <div className="flex justify-center items-center">
              {isLoading ? <AnimatedLoadingBoxes numSquares={11} /> : "Empty"}
            </div>
          </TableCell>
        </tr>
      </TableBody>
    );

  return (
    <TableBody className={className}>
      {renderRow
        ? items.map((item, i) => <Fragment key={getKey(item)}>{renderRow(item, i)}</Fragment>)
        : items.map((item, i) => (
            <EcTableRow
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
        <LoadMore colSpan={columns.length} query={pagination} />
      )}
    </TableBody>
  );
};
