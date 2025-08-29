import { Arrows } from "components/svg";
import { TableHead } from "components/ui/table/table";
import { cn } from "lib/utils/class-name";
import Link from "next/link";
import React, { useMemo } from "react";

import SortArrow from "@/icons/SortArrow";

import type { EffectiveSort } from "./ecTable";

type SortableHeadProps = {
  childNode: string | React.ReactNode;
  id: string;
  index: number;
  columnsCount: number;
  width?: number;
  // Undefined if column is not sortable or externally controlled.
  className?: string;
} & (
  | {
      sort: Extract<EffectiveSort, { mode: "client" }>;
      clientSortHandler?: (sort: { column: string; direction: "asc" | "desc" }) => void;
    }
  | {
      sort: Extract<EffectiveSort, { mode: "controlled" }>;
      clientSortHandler?: undefined;
    }
  | { sort?: undefined; clientSortHandler?: undefined }
);
export const EcTableHead = ({
  id,
  childNode,
  index,
  columnsCount,
  width,
  className,
  sort,
  // Set sort is the default sort handler.
  clientSortHandler,
}: SortableHeadProps) => {
  const currDirection = sort?.column === id ? sort.direction : undefined;
  const sortable = !!sort;

  const controlledLinkProps = useMemo(
    () =>
      sort?.mode === "controlled"
        ? sort.getLinkProps({ column: id, direction: sort.direction })
        : undefined,
    [id, sort]
  );

  const innerContent = (
    <span
      style={{ minWidth: width ? `${width}px` : undefined }}
      className={cn(
        "group-hover:brightness-[1.5]",
        "w-full flex gap-1 items-center",
        index === 0 ? "pl-4" : index === columnsCount - 1 ? "pr-6" : "",
        index === 0 ? "justify-start" : "justify-end",
        className
      )}
    >
      <span>{childNode}</span>
      {currDirection ? (
        <SortArrow
          className={cn(
            currDirection === "desc"
              ? "rotate-180 -translate-x-[5px] -translate-y-[3px]"
              : "translate-x-[6px] translate-y-0.5",
            "!transition-none"
          )}
          color="econiaBlue"
        />
      ) : sortable ? (
        <Arrows className="translate-x-1" />
      ) : undefined}
    </span>
  );

  return (
    <TableHead
      className={cn(sortable ? "cursor-pointer group" : "")}
      onClick={() => {
        // Controlled sorts have a Next link to control routing. Return early if controlled.
        if (sort?.mode === "controlled") return;
        // Otherwise, run the set sort.
        clientSortHandler?.({ column: id, direction: currDirection === "desc" ? "asc" : "desc" });
      }}
    >
      {controlledLinkProps ? <Link {...controlledLinkProps}>{innerContent}</Link> : innerContent}
    </TableHead>
  );
};
