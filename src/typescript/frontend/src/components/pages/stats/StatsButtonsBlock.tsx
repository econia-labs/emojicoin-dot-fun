"use client";

import { constructURLForStatsPage, type StatsColumn } from "./params";
import React, { useCallback } from "react";
import { cn } from "lib/utils/class-name";
import { useRouter } from "next/navigation";

interface PaginationProps {
  page: number;
  sort: StatsColumn;
  desc: boolean;
}

const styles = "flex gap-3 h-fit";
const groupHover = "group-hover:text-ec-blue";

/**
 * Pass the props for the page this link should navigate to, *not* the current page.
 */
const PaginationLinkWithBraces = ({
  page,
  sort,
  desc,
  ariaLabel,
  children,
}: PaginationProps & { ariaLabel: string } & React.PropsWithChildren) => {
  const router = useRouter();
  const handleClick = useCallback(() => {
    const newURL = constructURLForStatsPage({ sort, desc, page });
    router.push(newURL);
  }, [page, sort, desc, router]);

  return (
    <div
      onClick={handleClick}
      className={cn("group cursor-pointer", styles)}
      aria-label={ariaLabel}
    >
      <span className={groupHover}>{"{"}</span>
      {children}
      <span className={groupHover}>{"}"}</span>
    </div>
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
}: PaginationProps & {
  numPages: number;
}) => {
  return (
    <div className="flex flex-row justify-center gap-3 md:gap-4 med-pixel-text text-dark-gray">
      <PaginationLinkWithBraces ariaLabel={"go to the first page"} page={0} sort={sort} desc={desc}>
        <span className={groupHover}>{"<<"}</span>
      </PaginationLinkWithBraces>

      <PaginationLinkWithBraces
        ariaLabel={"go to the previous page"}
        page={page > 0 ? page - 1 : numPages}
        sort={sort}
        desc={desc}
      >
        <span className={groupHover}>{"<"}</span>
      </PaginationLinkWithBraces>

      <div className={styles}>
        <span>{`${page} / ${numPages}`}</span>
      </div>

      <PaginationLinkWithBraces
        ariaLabel={"go to the next page"}
        page={page < numPages ? page + 1 : 0}
        sort={sort}
        desc={desc}
      >
        <span className={groupHover}>{">"}</span>
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
