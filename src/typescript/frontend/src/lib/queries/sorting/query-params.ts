import { safeParsePageWithDefault } from "lib/routes/home-page-params";
import { ROUTES } from "router/routes";

import { DEFAULT_SORT_BY, type SortMarketsBy } from "@/sdk/indexer-v2/types/common";

import { toMarketDataSortByHomePage } from "./types";

export const createHomePageURL = ({ page, sort }: { page?: number; sort?: SortMarketsBy }) =>
  !!sort && !!page && (sort !== DEFAULT_SORT_BY || page !== 1)
    ? (`${ROUTES.home}/${toMarketDataSortByHomePage(sort)}/${safeParsePageWithDefault(page)}` as const)
    : (`${ROUTES.home}` as const);
