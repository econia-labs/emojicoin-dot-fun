"use client";

import type { StatsSchemaOutput } from "app/api/stats/schema";
import { cn } from "lib/utils/class-name";
import { useRouter } from "next/navigation";
import path from "path";
import { useCallback, useTransition } from "react";
import { ROUTES } from "router/routes";
import { emojiNamesToPath } from "utils/pathname-helpers";
import { addSearchParams } from "utils/url-utils";

import { EcTable } from "@/components/ui/table/ecTable";
import type { OrderBy, OrderByStrings } from "@/sdk/indexer-v2/const";
import { ORDER_BY } from "@/sdk/indexer-v2/const";
import type { PriceFeedWithNullsModel } from "@/sdk/indexer-v2/types";

import statsHeaderColumns, { columnSortStrings, columnSortStringsReverseMapping } from "./columns";
import { StatsButtonsBlock } from "./PaginationButtons";

const toOrderByString = (orderBy: OrderBy): OrderByStrings =>
  orderBy === ORDER_BY.ASC ? "asc" : "desc";

export default function StatsPageComponent({
  page,
  sortBy,
  orderBy,
  data,
  maxPageNumber,
}: StatsSchemaOutput & {
  data: PriceFeedWithNullsModel[];
  maxPageNumber: number;
}) {
  const router = useRouter();
  const [isLoading, startTransition] = useTransition();

  const handleNavigation = useCallback(
    (columnString: string, direction: OrderByStrings) => {
      const currentSortByString = columnSortStrings[sortBy];
      // If it's a new column, reset the order to "desc" and use the new column.
      // If it's the same column, flip the orderBy to the opposite order.
      // In both cases, set it to page 1.
      const newParams =
        currentSortByString !== columnString
          ? {
              sortBy: columnSortStringsReverseMapping[columnString],
              orderBy: toOrderByString(ORDER_BY.DESC),
              page: 1,
            }
          : {
              sortBy: sortBy,
              orderBy: direction,
              page: 1,
            };
      const url = addSearchParams(ROUTES.stats, newParams);
      startTransition(() => {
        router.push(url);
      });
    },
    [sortBy, router]
  );

  return (
    <>
      <StatsButtonsBlock
        numPages={maxPageNumber}
        page={page}
        sortBy={sortBy}
        desc={!orderBy.ascending}
        className="pb-2"
        startTransition={startTransition}
      />
      <div className="relative w-screen">
        <div className="pointer-events-none absolute left-[-100vw] top-0 z-50 h-px w-[300vw] bg-dark-gray" />
        <div className="pointer-events-none absolute bottom-0 left-[-100vw] z-50 h-px w-[300vw] bg-dark-gray" />
        <div className="-z-1 pointer-events-none absolute left-[-100vw] top-[37px] h-px w-[300vw] bg-dark-gray" />
        <EcTable
          className={cn(
            "relative m-auto flex h-[80dvh] w-[90dvw] max-w-[1600px]",
            "border-collapse border-l border-r border-solid border-dark-gray",
            // Remove all the extra borders lining up random sides of the table.
            "[&>table>tbody>tr:first-child>td]:border-t-0",
            "[&>table]:border-l-0 [&>table]:border-t-0",
            "[&>table>tbody>tr>td]:!border-l-0"
          )}
          textFormat="body-sm"
          emptyText="No more markets to display!"
          columns={statsHeaderColumns}
          getKey={(item) => [orderBy, page, sortBy, item.market.marketID].join("-")}
          items={data}
          serverSideOrderHandler={handleNavigation}
          isLoading={isLoading}
          defaultSortColumn={columnSortStrings[sortBy]}
          onClick={(item) => {
            const namePath = emojiNamesToPath(item.market.emojis.map(({ name }) => name));
            const url = path.join(ROUTES.market, namePath);
            router.push(url);
          }}
        />
      </div>
      <StatsButtonsBlock
        numPages={maxPageNumber}
        page={page}
        sortBy={sortBy}
        desc={!orderBy.ascending}
        className="mt-3 pb-2"
        startTransition={startTransition}
      />
    </>
  );
}
