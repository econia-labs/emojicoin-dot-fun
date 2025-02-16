import SortArrow from "@icons/SortArrow";
import { Arrows } from "components/svg";
import { TableHead } from "components/ui/table/table";
import { cn } from "lib/utils";
import { type FC } from "react";
import { useScramble } from "use-scramble";

interface SortableHeadProps {
  text: string;
  id: string;
  sort?: { column: string; direction: "asc" | "desc" };
  // Undefined if column is not sortable
  setSort?: (sort: { column: string; direction: "asc" | "desc" }) => void;
  className?: string;
}
export const EcTableHead: FC<SortableHeadProps> = ({ id, text, className, sort, setSort }) => {
  const { ref, replay } = useScramble({
    text: `${text}`,
    overdrive: false,
    speed: 0.5,
  });

  const currDirection = sort?.column === id ? sort.direction : undefined;
  const isSortable = setSort !== undefined;

  return (
    <TableHead
      className={cn(className, setSort ? "cursor-pointer" : "")}
      onClick={
        isSortable
          ? () => setSort({ column: id, direction: currDirection === "desc" ? "asc" : "desc" })
          : undefined
      }
    >
      <div className={cn(className, "w-full flex gap-1")}>
        <span onMouseEnter={() => replay()} ref={ref}>
          {text}
        </span>
        {currDirection ? (
          <SortArrow
            style={{
              transform:
                currDirection === "desc"
                  ? `rotate(180deg) translate(5px, 5px)`
                  : "translate(5px, 1px)",
            }}
            color="econiaBlue"
          />
        ) : isSortable ? (
          <Arrows />
        ) : undefined}
      </div>
    </TableHead>
  );
};
