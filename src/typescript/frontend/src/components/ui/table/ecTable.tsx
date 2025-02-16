import { useMemo, useState } from "react";
import { SortableHead } from "./sortableHead";
import { Table, TableBody, TableHeader, TableRow } from "./table";
import _ from "lodash";

interface ColumnProps<T> {
  id: string;
  text: string;
  className: string;
  sortCallback?: (item: T) => unknown;
}

interface TableProps<T> {
  items: T[];
  columns: ColumnProps<T>[];
  renderRow: (item: T) => React.ReactNode;
}

export const EcTable = <T,>({ items, columns, renderRow }: TableProps<T>) => {
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
      <TableBody>{sorted.map((item) => renderRow(item))}</TableBody>
    </Table>
  );
};
