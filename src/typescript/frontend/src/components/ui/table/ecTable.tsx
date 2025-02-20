import { useMemo, useState } from "react";
import { EcTableHead } from "./ecTableHead";
import { Table, TableHeader, TableRow } from "./table";
import _ from "lodash";
import { EcTableBody } from "./ecTableBody";
import { cn } from "lib/utils/class-name";

export interface EcTableColumn<T> {
  id: string;
  text: string;
  width?: number;
  className?: string;
  // Only for head.
  headClassName?: string;
  // Only for body cells.
  cellClassName?: string;
  sortCallback?: (item: T) => unknown;
  // Can either render individual cells, or the whole row by using RenderRow TableProps
  renderCell?: (item: T) => React.ReactNode;
}

export interface TableProps<T> {
  items: T[];
  columns: EcTableColumn<T>[];
  className?: string;
  // Function to get the unique key for each item
  getKey: (item: T) => string;
  renderRow?: (item: T, i: number) => React.ReactNode;
  onClick?: (item: T) => void;
  textFormat?: "body-md" | "body-sm" | string;
}

export const EcTable = <T,>({
  items,
  className,
  columns,
  renderRow,
  getKey,
  onClick,
  textFormat = "body-md",
}: TableProps<T>) => {
  const [sort, setSort] = useState<{ column: string; direction: "asc" | "desc" }>({
    column: "ownedValue",
    direction: "desc",
  });

  const sorted = useMemo(() => {
    const sortCallback = _.find(columns, { id: sort.column })?.sortCallback;
    return _.orderBy(items, sortCallback, sort.direction);
  }, [columns, sort.column, sort.direction, items]);

  return (
    <div className={cn("flex w-full", className)}>
      <Table className={cn("border-solid border-[1px] border-dark-gray")}>
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
                setSort={column.sortCallback ? setSort : undefined}
                className={cn(column.className, column.headClassName)}
                text={column.text}
              />
            ))}
          </TableRow>
        </TableHeader>
        <EcTableBody
          className={textFormat}
          onClick={onClick}
          items={sorted}
          columns={columns}
          renderRow={renderRow}
          getKey={getKey}
        />
      </Table>
    </div>
  );
};
