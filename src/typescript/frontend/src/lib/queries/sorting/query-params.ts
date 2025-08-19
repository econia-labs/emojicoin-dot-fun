import { safeParsePageWithDefault } from "lib/routes/home-page-params";
import { ROUTES } from "router/routes";

import type { SortMarketsBy } from "@/sdk/indexer-v2/types/common";

import { type SortByPageQueryParams, toMarketDataSortByHomePage } from "./types";

export type HomePageSearchParams = {
  page: string | undefined;
  sort: SortByPageQueryParams | undefined;
};

export const constructURLForHomePage = ({
  page,
  sort,
}: {
  page?: number;
  sort?: SortMarketsBy;
}) => {
  const curr = new URL(location.href);
  console.log(location.href);
  console.dir(curr);
  console.log(`${curr.host}${ROUTES.home}/${toMarketDataSortByHomePage(sort)}/${safeParsePageWithDefault(page)}`)
  const url =  new URL(
    `${ROUTES.home}/${toMarketDataSortByHomePage(sort)}/${safeParsePageWithDefault(page)}`, curr.origin
  );

  console.log(url);
  return url;
};
