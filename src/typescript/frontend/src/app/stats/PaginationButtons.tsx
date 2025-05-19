import type { StatsColumn } from "app/api/stats/schema";
import { cn } from "lib/utils/class-name";
import React from "react";
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
  children,
}: PaginationProps & { ariaLabel: string } & React.PropsWithChildren) => {
  const url = addSearchParams(ROUTES.stats, {
    page,
    sortBy,
    orderBy: desc ? "desc" : "asc",
  });

  return (
    <a href={url} className={cn("group cursor-pointer", styles)} aria-label={ariaLabel}>
      <span className={groupHover}>{"{"}</span>
      {children}
      <span className={groupHover}>{"}"}</span>
    </a>
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
      <PaginationLinkWithBraces
        ariaLabel={"go to the first page"}
        page={0}
        sortBy={sortBy}
        desc={desc}
      >
        <span className={groupHover}>{"<<"}</span>
      </PaginationLinkWithBraces>

      <PaginationLinkWithBraces
        ariaLabel={"go to the previous page"}
        page={page > 0 ? page - 1 : numPages}
        sortBy={sortBy}
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
        sortBy={sortBy}
        desc={desc}
      >
        <span className={groupHover}>{">"}</span>
      </PaginationLinkWithBraces>

      <PaginationLinkWithBraces
        ariaLabel={"go to the last page"}
        page={numPages}
        sortBy={sortBy}
        desc={desc}
      >
        <span className={groupHover}>{">>"}</span>
      </PaginationLinkWithBraces>
    </div>
  );
};
