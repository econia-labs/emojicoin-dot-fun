import SortArrow from "@icons/SortArrow";
import { Arrows } from "components/svg";
import { TableHead } from "components/ui/table";
import { cn } from "lib/utils";
import { type FC } from "react";
import { useScramble } from "use-scramble";

interface Props {
  text: string;
  id: string;
  sort?: { column: string; direction: "asc" | "desc" };
  setSort?: (sort: { column: string; direction: "asc" | "desc" }) => void;
  className?: string;
  onClick?: () => void;
}
export const PortfolioHeader: FC<Props> = ({ id, text, className, sort, setSort }) => {
  const { ref, replay } = useScramble({
    text: `${text}`,
    overdrive: false,
    speed: 0.5,
  });

  const currDirection = sort?.column === id ? sort.direction : undefined;

  return (
    <TableHead
      className={cn(className, "cursor-pointer")}
      onClick={
        setSort
          ? () => setSort({ column: id, direction: currDirection === "desc" ? "asc" : "desc" })
          : undefined
      }
    >
      <div className={cn("flex gap-2", className)}>
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
        ) : setSort ? (
          <Arrows />
        ) : undefined}
      </div>
    </TableHead>
  );
};
