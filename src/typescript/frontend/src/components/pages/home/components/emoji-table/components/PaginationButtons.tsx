import { createHomePageURL } from "lib/queries/sorting/query-params";
import { cn } from "lib/utils/class-name";
import Link from "next/link";
import React, { useMemo } from "react";

import SearchArrow from "@/components/arrow/SearchArrow";
import { useHomePageUrlParams } from "@/components/pages/home/hooks/use-url-params";

type ButtonsBlockProps = {
  numPages: number;
  className?: string;
};

const styles = "flex gap-3 h-fit";
const groupHover = "group-hover:text-ec-blue group-hover:fill-ec-blue";

const PaginationLinkWithBraces = ({
  page,
  sort,
  ariaLabel,
  children,
}: ReturnType<typeof useHomePageUrlParams> & {
  ariaLabel: string;
} & React.PropsWithChildren) => {
  const url = useMemo(() => createHomePageURL({ page, sort }), [page, sort]);

  return (
    <Link href={url} className={cn("group cursor-pointer", styles)} aria-label={ariaLabel}>
      <span>{"{"}</span>
      {children}
      <span>{"}"}</span>
    </Link>
  );
};

export const PaginationButtons = ({ numPages, className }: ButtonsBlockProps) => {
  const { page, sort } = useHomePageUrlParams();

  return (
    <div
      className={cn("flex gap-3 md:gap-4 justify-center med-pixel-text text-dark-gray", className)}
    >
      <PaginationLinkWithBraces ariaLabel={"go to the first page"} page={1} sort={sort}>
        <span className={groupHover}>{"<<"} </span>
      </PaginationLinkWithBraces>

      <PaginationLinkWithBraces
        ariaLabel={"go to the previous page"}
        page={Math.max(page - 1, 1)}
        sort={sort}
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
      >
        <SearchArrow direction="right" className={groupHover} />
      </PaginationLinkWithBraces>

      <PaginationLinkWithBraces ariaLabel={"go to the last page"} page={numPages} sort={sort}>
        <span className={groupHover}>{">>"} </span>
      </PaginationLinkWithBraces>
    </div>
  );
};
