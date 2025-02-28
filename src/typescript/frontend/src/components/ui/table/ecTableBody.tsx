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

  if (items.length === 0 && isLoading)
    return (
      <TableBody
        className="flex justify-center items-center absolute top-[50%] left-[50%]"
        style={{ height: containerHeight - rowHeight + "px" }}
      >
        <tr className="-translate-x-1/2 -translate-y-1/2">
          <td>
            <AnimatedLoadingBoxes numSquares={11} />
          </td>
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
          {/* Fill the row with empty cells, otherwise on some browsers the row won't be the full width */}
          {columns.map((c) => (
            <TableCell key={c.id} />
          ))}
        </TableRow>
      ))}
      {pagination && items.length > minRows && <LoadMore query={pagination} />}
    </TableBody>
  );
};
