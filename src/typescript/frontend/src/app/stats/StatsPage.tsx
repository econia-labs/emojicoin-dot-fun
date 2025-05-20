"use client";

import type { StatsSchemaOutput } from "app/api/stats/schema";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { cn } from "lib/utils/class-name";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ROUTES } from "router/routes";
import { addSearchParams } from "utils/url-utils";

import { EcTable } from "@/components/ui/table/ecTable";
import type { OrderBy, OrderByStrings } from "@/sdk/indexer-v2/const";
import { ORDER_BY } from "@/sdk/indexer-v2/const";
import type { PriceFeedWithNullsModel } from "@/sdk/indexer-v2/types";

import statsHeaderColumns, { columnSortStrings, columnSortStringsReverseMapping } from "./columns";

const toOrderByString = (orderBy: OrderBy): OrderByStrings =>
  orderBy === ORDER_BY.ASC ? "asc" : "desc";

export default function StatsPageComponent({
  page,
  sortBy,
  orderBy,
  data,
}: StatsSchemaOutput & {
  data: PriceFeedWithNullsModel[];
}) {
  const router = useRouter();
  return (
    <>
      <div className="flex relative">
        <div className="absolute top-0 left-0 border-t border-dark-gray border-solid border-collapse px-[100dvw] z-10" />
        <div className="absolute top-[37px] left-0 border-t border-dark-gray border-solid border-collapse px-[100dvw] -jz-10" />
        <div className="absolute bottom-0 left-0 border-t border-dark-gray border-solid border-collapse px-[100dvw] z-10" />
        <div className="m-auto w-[90dvw] max-w-[1440px]">
          <EcTable
            textFormat="body-sm"
            emptyText="No markets exist for this column data."
            columns={statsHeaderColumns}
            getKey={(item) => [orderBy, page, sortBy, item.market.marketID].join("-")}
            items={data}
            serverSideOrderHandler={(columnString: string, direction: OrderByStrings) => {
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
        </div>
      </div>
    </>
  );
}
