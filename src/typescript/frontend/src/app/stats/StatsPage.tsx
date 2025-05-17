"use client";

import type { StatsSchemaOutput } from "app/api/stats/schema";
import { useRouter } from "next/navigation";
import { ROUTES } from "router/routes";
import { addSearchParams } from "utils/url-utils";

import { EcTable } from "@/components/ui/table/ecTable";
import type { OrderBy, OrderByStrings } from "@/sdk/indexer-v2/const";
import { ORDER_BY } from "@/sdk/indexer-v2/const";
import type { PartialPriceFeedModel } from "@/sdk/indexer-v2/types";

import statsHeaderColumns, { columnSortStrings, columnSortStringsReverseMapping } from "./columns";

const toOrderByString = (orderBy: OrderBy): OrderByStrings =>
  orderBy === ORDER_BY.ASC ? "asc" : "desc";

export default function StatsPageComponent({
  params,
  data,
}: {
  params: StatsSchemaOutput;
  data: PartialPriceFeedModel[];
}) {
  const router = useRouter();

  return (
    <EcTable
      className="m-auto overflow-auto h-[70dvh]"
      textFormat="body-sm"
      emptyText="No markets exist for this column data."
      columns={statsHeaderColumns}
      getKey={(item) =>
        [params.orderBy, params.page, params.sortBy, item.market.marketID].join("-")
      }
      items={data}
      serverSideOrderHandler={(columnString: string, direction: OrderByStrings) => {
        const { sortBy } = params;
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
        router.push(url);
      }}
    />
  );
}
