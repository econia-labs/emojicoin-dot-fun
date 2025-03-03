import { useCallback, useMemo, useState } from "react";
import { EcTableHead } from "./ecTableHead";
import { Table, TableHeader, TableRow } from "./table";
import _ from "lodash";
import { EcTableBody } from "./ecTableBody";
import { cn } from "lib/utils/class-name";
import { type OrderByStrings } from "@sdk/indexer-v2/const";

export interface EcTableColumn<T> {
  id: string;
  text: string;
  width?: number;
  className?: string;
  // Only for head.
  headClassName?: string;
  // Only for body cells.
  cellClassName?: string;

  // This prop is used to handle client side sorting.
  sortFn?: (item: T) => unknown;
  isServerSideSortable?: boolean;
  // Can either render individual cells, or the whole row by using RenderRow TableProps
  renderCell?: (item: T) => React.ReactNode;
}

export interface TableProps<T> {
  items: T[];
  columns: EcTableColumn<T>[];
  rowHeight?: number;
  className?: string;
  // Function to get the unique key for each item
  getKey: (item: T) => string;
  renderRow?: (item: T, i: number) => React.ReactNode;
  onClick?: (item: T) => void;
  textFormat?: "body-md" | "body-sm" | string;
  defaultSortColumn?: string;
  isLoading?: boolean;
  // This prop is used to handle server side sorting.
  serverSideOrderHandler?: (column: string, direction: OrderByStrings) => void;
  pagination?: {
    hasNextPage?: boolean;
    fetchNextPage: () => void;
    isLoading: boolean;
    isFetching: boolean;
  };
}

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

  return (
    <div ref={containerRef} className={cn("flex w-full", className)}>
      <Table className={cn("relative border-solid border-[1px] border-dark-gray")}>
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
          containerHeight={containerHeight}
          items={sorted}
          columns={columns}
          renderRow={renderRow}
          getKey={getKey}
          pagination={pagination}
          isLoading={isLoading}
        />
      </Table>
    </div>
  );
};
