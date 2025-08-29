"use client";

import type { StatsColumn } from "app/stats/(utils)/schema";
import { cn } from "lib/utils/class-name";
import Link from "next/link";
import React, { useMemo } from "react";
import { ROUTES } from "router/routes";
import type { ClassNameValue } from "tailwind-merge";

import SearchArrow from "@/components/arrow/SearchArrow";

import useStatsTransition from "../(hooks)/use-stats-transition";

interface PaginationProps {
  page: number;
  sort: StatsColumn;
  desc: boolean;
}

const styles = "flex gap-3 h-fit";
const groupHover = "group-hover:text-ec-blue group-hover:fill-ec-blue";

const PaginationLinkWithBraces = ({
  page,
  sort,
  desc,
  ariaLabel,
  children,
}: PaginationProps & {
  ariaLabel: string;
} & React.PropsWithChildren) => {
  const url = useMemo(
    () => `${ROUTES.stats}/${sort}/${page}/${desc ? "desc" : "asc"}`,
    [page, sort, desc]
  );

  const handleTransition = useStatsTransition();

  return (
    <Link
      href={url}
      onClick={handleTransition}
      className={cn("group cursor-pointer", styles)}
      aria-label={ariaLabel}
      // These are heavy queries- the stats page shouldn't pre-fetch them until they're more efficient.
      prefetch={false}
    >
      <span>{"{"}</span>
      {children}
      <span>{"}"}</span>
    </Link>
  );
};

/**
 * The props passed in for this component are for the current page.
 */
export const StatsButtonsBlock = ({
  numPages,
  page,
  sort,
  desc,
  className = "",
}: PaginationProps & {
  numPages: number;
  className?: ClassNameValue;
}) => {
  return (
    <div
      className={cn(
        "flex flex-row justify-center gap-3 md:gap-4 med-pixel-text text-dark-gray",
        className
      )}
    >
      <PaginationLinkWithBraces ariaLabel={"go to the first page"} page={1} sort={sort} desc={desc}>
        <span className={groupHover}>{"<<"}</span>
      </PaginationLinkWithBraces>

      <PaginationLinkWithBraces
        ariaLabel={"go to the previous page"}
        page={Math.max(page - 1, 1)}
        sort={sort}
        desc={desc}
      >
        <SearchArrow direction="left" className={groupHover} />
      </PaginationLinkWithBraces>

      <div className={styles}>
        <span>{`${page} / ${numPages}`}</span>
      </div>

      <PaginationLinkWithBraces
        ariaLabel={"go to the next page"}
        page={Math.min(page + 1, numPages)}
        sort={sort}
        desc={desc}
      >
        <SearchArrow direction="right" className={groupHover} />
      </PaginationLinkWithBraces>

      <PaginationLinkWithBraces
        ariaLabel={"go to the last page"}
        page={numPages}
        sort={sort}
        desc={desc}
      >
        <span className={groupHover}>{">>"}</span>
      </PaginationLinkWithBraces>
    </div>
  );
};
