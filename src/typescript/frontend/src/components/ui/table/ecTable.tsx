import { useMemo, useState } from "react";
import { SortableHead } from "./ecTableHead";
import { Table, TableHeader, TableRow } from "./table";
import _ from "lodash";
import { EcTableBody } from "./ecTableBody";

export interface EcTableColumn<T> {
  id: string;
  text: string;
  className: string;
  sortCallback?: (item: T) => unknown;
  // Can either render individual cells, or the whole row by using RenderRow TableProps
  renderCell?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  items: T[];
  columns: EcTableColumn<T>[];
  // Function to get the unique key for each item
  getId: (item: T) => string;
  renderRow?: (item: T) => React.ReactNode;
}

export const EcTable = <T,>({ items, columns, renderRow, getId }: TableProps<T>) => {
  const [sort, setSort] = useState<{ column: string; direction: "asc" | "desc" }>({
    column: "ownedValue",
    direction: "desc",
  });

  const sorted = useMemo(() => {
    const sortCallback = _.find(columns, { id: sort.column })?.sortCallback;
    return _.orderBy(items, sortCallback, sort.direction);
  }, [columns, sort.column, sort.direction, items]);

  return (
    <Table className="border-solid border-[1px] border-dark-gray">
      <TableHeader>
        <TableRow isHeader>
          {columns.map((column) => (
            <SortableHead
              key={column.id}
              id={column.id}
              sort={sort}
              setSort={column.sortCallback ? setSort : undefined}
              className={column.className}
              text={column.text}
            />
          ))}
        </TableRow>
      </TableHeader>
      <EcTableBody items={sorted} columns={columns} renderRow={renderRow} getKey={getId} />
    </Table>
  );
};
