"use client";

import type { StatsColumn } from "app/api/stats/schema";
import { cn } from "lib/utils/class-name";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TransitionStartFunction } from "react";
import React, { useCallback, useMemo } from "react";
import { ROUTES } from "router/routes";
import type { ClassNameValue } from "tailwind-merge";
import { addSearchParams } from "utils/url-utils";

interface PaginationProps {
  page: number;
  sortBy: StatsColumn;
  desc: boolean;
}

const styles = "flex gap-3 h-fit";
const groupHover = "group-hover:text-ec-blue";

const PaginationLinkWithBraces = ({
  page,
  sortBy,
  desc,
  ariaLabel,
  startTransition,
  children,
}: PaginationProps & {
  ariaLabel: string;
  startTransition: TransitionStartFunction;
} & React.PropsWithChildren) => {
  const router = useRouter();
  const url = useMemo(
    () =>
      addSearchParams(ROUTES.stats, {
        page,
        sortBy,
        orderBy: desc ? "desc" : "asc",
      }),
    [page, sortBy, desc]
  );

  const handleTransition = useCallback(
    () =>
      startTransition(() => {
        router.push(url);
      }),
    [startTransition, router, url]
  );

  return (
    <Link
      href={url}
      className={cn("group cursor-pointer", styles)}
      aria-label={ariaLabel}
      onClick={handleTransition}
    >
      <span className={groupHover}>{"{"}</span>
      {children}
      <span className={groupHover}>{"}"}</span>
    </Link>
  );
};

/**
 * The props passed in for this component are for the current page.
 */
export const StatsButtonsBlock = ({
  numPages,
  page,
  sortBy,
  desc,
  startTransition,
  className = "",
}: PaginationProps & {
  numPages: number;
  startTransition: TransitionStartFunction;
  className?: ClassNameValue;
}) => {
  return (
    <div
      className={cn(
        "flex flex-row justify-center gap-3 md:gap-4 med-pixel-text text-dark-gray",
        className
      )}
    >
      <PaginationLinkWithBraces
        ariaLabel={"go to the first page"}
        page={1}
        sortBy={sortBy}
        desc={desc}
        startTransition={startTransition}
      >
        <span className={groupHover}>{"<<"}</span>
      </PaginationLinkWithBraces>

      <PaginationLinkWithBraces
        ariaLabel={"go to the previous page"}
        page={page > 0 ? page - 1 : numPages}
        sortBy={sortBy}
        desc={desc}
        startTransition={startTransition}
      >
        <span className={groupHover}>{"<"}</span>
      </PaginationLinkWithBraces>

      <div className={styles}>
        <span>{`${page} / ${numPages}`}</span>
      </div>

      <PaginationLinkWithBraces
        ariaLabel={"go to the next page"}
        page={page < numPages ? page + 1 : 0}
        sortBy={sortBy}
        desc={desc}
        startTransition={startTransition}
      >
        <span className={groupHover}>{">"}</span>
      </PaginationLinkWithBraces>

      <PaginationLinkWithBraces
        ariaLabel={"go to the last page"}
        page={numPages}
        sortBy={sortBy}
        desc={desc}
        startTransition={startTransition}
      >
        <span className={groupHover}>{">>"}</span>
      </PaginationLinkWithBraces>
    </div>
  );
};
