"use client";

import { cn } from "lib/utils/class-name";
import { useRouter } from "next/navigation";
import path from "path";
import { useMemo } from "react";
import { ROUTES } from "router/routes";
import { emojiNamesToPath } from "utils/pathname-helpers";

import { EcTable } from "@/components/ui/table/ecTable";
import type { OrderByStrings } from "@/sdk/indexer-v2/const";
import { toOrderByString } from "@/sdk/indexer-v2/const";
import { toPriceFeedWithNulls } from "@/sdk/indexer-v2/types";
import { useStatsPageStore } from "@/store/stats-page/store";

import useStatsTransition from "../(hooks)/use-stats-transition";
import { useStatsUrlParams } from "../(hooks)/use-url-params";
import { toggleStatsUrl } from "../(utils)/create-url";
import type { StatsPageData } from "../(utils)/fetches";
import statsHeaderColumns, { columnSortStrings, columnSortStringsReverseMapping } from "./columns";
import { StatsButtonsBlock } from "./PaginationButtons";

export default function StatsPageComponent({
  sort,
  data,
  maxPageNumber,
}: Pick<StatsPageData, "sort" | "data" | "maxPageNumber">) {
  const router = useRouter();
  const isLoading = useStatsPageStore((s) => s.isLoading);
  // On a transition to a new slug/page, the url will update faster than the UI due to the
  // transition schedule in `useTransition`. Use the URL for the most up to date params and
  // the props params for the previous params.
  const { page: currPage, sort: currSort, order: currOrder } = useStatsUrlParams();

  const handleSortClick = useStatsTransition();
  const sorting = useMemo(
    () => ({
      mode: "controlled" as const,
      column: columnSortStrings[currSort],
      direction: toOrderByString(currOrder),
      getLinkProps: (next: { column: string; direction: OrderByStrings }) => ({
        href: toggleStatsUrl({
          sort: columnSortStringsReverseMapping[next.column],
          currSort,
          currOrder,
        }),
        onClick: handleSortClick,
      }),
    }),
    [currOrder, currSort, handleSortClick]
  );

  return (
    <>
      <StatsButtonsBlock
        numPages={maxPageNumber}
        page={currPage}
        sort={currSort}
        desc={currOrder === "desc"}
        className="pb-2"
      />
      <div className="relative w-screen">
        <div className="absolute top-0 left-[-100vw] w-[300vw] h-px bg-dark-gray z-50 pointer-events-none" />
        <div className="absolute bottom-0 left-[-100vw] w-[300vw] h-px bg-dark-gray z-50 pointer-events-none" />
        <div className="absolute top-[37px] left-[-100vw] w-[300vw] h-px bg-dark-gray -z-1 pointer-events-none" />
        <EcTable
          className={cn(
            "flex relative h-[80dvh] m-auto w-[90dvw] max-w-[1600px]",
            "border-l border-r border-dark-gray border-solid border-collapse",
            // Remove all the extra borders lining up random sides of the table.
            "[&>table>tbody>tr:first-child>td]:border-t-0",
            "[&>table]:border-l-0 [&>table]:border-t-0",
            "[&>table>tbody>tr>td]:!border-l-0"
          )}
          textFormat="body-sm"
          emptyText="No more markets to display!"
          columns={statsHeaderColumns}
          getKey={(item) =>
            `${data.findIndex((v) => BigInt(v.market_id) === item.market.marketID)}`
          }
          items={data.map(toPriceFeedWithNulls)}
          sorting={sorting}
          isLoading={isLoading}
          defaultSortColumn={columnSortStrings[sort]}
          onClick={(item) => {
            const namePath = emojiNamesToPath(item.market.emojis.map(({ name }) => name));
            const url = path.join(ROUTES.market, namePath);
            router.push(url);
          }}
        />
      </div>
      <StatsButtonsBlock
        numPages={maxPageNumber}
        page={currPage}
        sort={currSort}
        desc={currOrder === "desc"}
        className="mt-3 pb-2"
      />
    </>
  );
}
