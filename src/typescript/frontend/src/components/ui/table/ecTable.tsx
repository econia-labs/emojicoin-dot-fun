import { useCallback, useMemo, useState } from "react";
import { EcTableHead } from "./ecTableHead";
import { Table, TableHeader, TableRow } from "./table";
import _ from "lodash";
import { EcTableBody } from "./ecTableBody";
import { cn } from "lib/utils/class-name";
import { type OrderByStrings } from "@sdk/indexer-v2/const";
import AnimatedLoadingBoxes from "components/pages/launch-emojicoin/animated-loading-boxes";

/**
 * Configuration for a table column.
 * @template T - The type of data items in the table
 */
export interface EcTableColumn<T> {
  /** Unique identifier for the column */
  id: string;
  /** Display text for the column header */
  text: string;
  /** Optional width of the column in pixels */
  width?: number;
  /** Optional CSS class name for both header and body cells */
  className?: string;
  /** Optional CSS class name specifically for the header cell */
  headClassName?: string;
  /** Optional CSS class name specifically for body cells */
  cellClassName?: string;

  /**
   * Function for client-side sorting of this column.
   * If provided, enables client-side sorting for this column.
   * The function should return a value that can be compared (string, number, etc.).
   * Example: sortFn: (item) => item.price // Sorts by price
   */
  sortFn?: (item: T) => unknown;

  /**
   * Indicates if this column supports server-side sorting.
   * When true and serverSideOrderHandler is provided in TableProps,
   * clicking this column's header will trigger the server-side sort handler.
   */
  isServerSideSortable?: boolean;

  /**
   * Function to render individual cells in this column.
   * Alternative to using renderRow in TableProps which renders entire rows.
   * Example: renderCell: (item) => <div>{item.name}</div>
   */
  renderCell?: (item: T) => React.ReactNode;
}

/**
 * Props for the EcTable component.
 * @template T - The type of data items in the table
 */
export interface TableProps<T> {
  /** Array of data items to display in the table */
  items: T[];
  /** Array of column configurations */
  columns: EcTableColumn<T>[];
  /** Height of each row in pixels. Defaults to 33. */
  rowHeight?: number;
  /** Optional CSS class name for the table container */
  className?: string;
  /**
   * Function to generate a unique key for each row.
   * Important for React's reconciliation process.
   * Example: getKey: (item) => item.id
   */
  getKey: (item: T) => string;
  /**
   * Function to render an entire row.
   * Alternative to using renderCell in column config.
   * Provides more control over row layout and styling.
   * Example: renderRow: (item) => <CustomRow data={item} />
   */
  renderRow?: (item: T, i: number) => React.ReactNode;
  /** Optional click handler for row items */
  onClick?: (item: T) => void;
  /** Text size class for the table. Defaults to "body-md". */
  textFormat?: "body-md" | "body-sm" | string;
  /** Column ID to sort by default */
  defaultSortColumn?: string;
  /** Loading state for the table */
  isLoading?: boolean;
  /**
   * Handler for server-side sorting.
   * When provided, disables client-side sorting and delegates sorting to the server.
   * Only triggers for columns where isServerSideSortable is true.
   * Example: (column, direction) => fetchSortedData(column, direction)
   */
  serverSideOrderHandler?: (column: string, direction: OrderByStrings) => void;
  /**
   * Configuration for pagination functionality.
   * Enables infinite scrolling when provided.
   */
  emptyText?: string;
  pagination?: {
    /** Whether there are more pages to load */
    hasNextPage?: boolean;
    /** Function to fetch the next page of data */
    fetchNextPage: () => void;
    /** Loading state for the current page */
    isLoading: boolean;
    /** Whether data is currently being fetched */
    isFetching: boolean;
  };
}

/**
 * A flexible table component that supports both client-side and server-side sorting,
 * custom row/cell rendering, and pagination.
 *
 * Sorting Functionality:
 * 1. Client-side sorting:
 *    - Enabled by providing sortFn in column config
 *    - Sorts data in-memory using the provided sort function
 *    - Example: sortFn: (item) => item.value
 *
 * 2. Server-side sorting:
 *    - Enabled by providing serverSideOrderHandler prop and isServerSideSortable in column
 *    - Delegates sorting to server, useful for large datasets
 *    - Example: serverSideOrderHandler: (col, dir) => fetchSortedData(col, dir)
 *
 * Rendering Options:
 * 1. Cell-level rendering:
 *    - Use renderCell in column config for custom cell content
 *    - Example: renderCell: (item) => <CustomCell data={item} />
 *
 * 2. Row-level rendering:
 *    - Use renderRow prop for complete control over row layout
 *    - Takes precedence over renderCell
 *    - Example: renderRow: (item) => <CustomRow data={item} />
 *
 * @template T - The type of data items in the table
 */
export const EcTable = <T,>({
  items,
  className,
  columns,
  rowHeight = 33,
  renderRow,
  getKey,
  onClick,
  textFormat = "body-md",
  defaultSortColumn,
  pagination,
  serverSideOrderHandler,
  isLoading,
  emptyText,
}: TableProps<T>) => {
  // const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const containerRef = useCallback((node: HTMLElement | null) => {
    if (node) {
      setContainerHeight(node.clientHeight);
    }
  }, []);

  const [sort, setSort] = useState<{ column: string; direction: OrderByStrings }>({
    column: defaultSortColumn || "",
    direction: "desc",
  });

  const sorted = useMemo(() => {
    //Ignore client side sorting if orderByHandler is provided
    if (serverSideOrderHandler) {
      return items;
    }
    const sortFn = _.find(columns, { id: sort.column })?.sortFn;
    return _.orderBy(items, sortFn, sort.direction);
  }, [serverSideOrderHandler, columns, sort.column, sort.direction, items]);

  const setSortHandler = (sort: { column: string; direction: OrderByStrings }) => {
    const columnData = columns.find((column) => column.id === sort.column);
    setSort(sort);
    if (serverSideOrderHandler && columnData?.isServerSideSortable) {
      serverSideOrderHandler(sort.column, sort.direction);
    }
  };

  const minRows = useMemo(() => {
    if (containerHeight) {
      const height = containerHeight;
      return Math.floor(height / rowHeight) - 1;
    }
    return 0;
  }, [rowHeight, containerHeight]);

  return (
    <div
      ref={containerRef}
      className={cn("relative flex w-full", className)}
      // Prevents scrollbar from appearing when there are empty rows
      style={{ overflowY: items.length < minRows ? "hidden" : "auto" }}
    >
      {(items.length === 0 || isLoading) && (
        <div
          className={cn(
            "absolute top-0 left-1 bottom-1 right-1 bg-black bg-opacity-30 z-10 flex justify-center text-light-gray items-center pixel-heading-4",
            isLoading && "bg-opacity-80"
          )}
        >
          <div>
            {isLoading ? (
              <AnimatedLoadingBoxes numSquares={11} />
            ) : items.length === 0 ? (
              <span>{emptyText || "Empty"}</span>
            ) : null}
          </div>
        </div>
      )}
      <Table className={cn("border-solid border-l border-r border-dark-gray")}>
        <TableHeader>
          <TableRow isHeader>
            {columns.map((column, i) => (
              <EcTableHead
                index={i}
                columnsCount={columns.length}
                key={column.id}
                id={column.id}
                sort={sort}
                width={column.width}
                setSort={column.sortFn || column.isServerSideSortable ? setSortHandler : undefined}
                className={cn(column.className, column.headClassName)}
                text={column.text}
              />
            ))}
          </TableRow>
        </TableHeader>
        <EcTableBody
          className={textFormat}
          onClick={onClick}
          rowHeight={rowHeight}
          minRows={minRows}
          items={sorted}
          columns={columns}
          renderRow={renderRow}
          getKey={getKey}
          pagination={pagination}
          isLoading={isLoading}
          emptyText={emptyText}
        />
      </Table>
    </div>
  );
};
