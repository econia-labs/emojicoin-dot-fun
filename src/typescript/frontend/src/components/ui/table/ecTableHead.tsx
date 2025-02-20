import SortArrow from "@icons/SortArrow";
import { Arrows } from "components/svg";
import { TableHead } from "components/ui/table/table";
import { cn } from "lib/utils/class-name";
import { type FC } from "react";

interface SortableHeadProps {
  text: string;
  id: string;
  index: number;
  columnsCount: number;
  sort?: { column: string; direction: "asc" | "desc" };
  width?: number;
  // Undefined if column is not sortable
  setSort?: (sort: { column: string; direction: "asc" | "desc" }) => void;
  className?: string;
}
export const EcTableHead: FC<SortableHeadProps> = ({
  id,
  text,
  index,
  columnsCount,
  width,
  className,
  sort,
  setSort,
}) => {
  const currDirection = sort?.column === id ? sort.direction : undefined;
  const isSortable = setSort !== undefined;

  return (
    <TableHead
      className={cn(setSort ? "cursor-pointer" : "")}
      onClick={
        isSortable
          ? () => setSort({ column: id, direction: currDirection === "desc" ? "asc" : "desc" })
          : undefined
      }
    >
      <div
        style={{ minWidth: width ? `${width}px` : undefined }}
        className={cn(
          "w-full flex gap-1 items-center",
          index === 0 ? "pl-6" : index === columnsCount - 1 ? "pr-6" : "",
          index === 0 ? "justify-start" : "justify-end",
          className
        )}
      >
        <span>{text}</span>
        {currDirection ? (
          <SortArrow
            className={
              currDirection === "desc"
                ? "rotate-180 -translate-x-[5px] -translate-y-1"
                : "translate-x-[6px]"
            }
            color="econiaBlue"
          />
        ) : isSortable ? (
          <Arrows className="translate-x-1" />
        ) : undefined}
      </div>
    </TableHead>
  );
};
