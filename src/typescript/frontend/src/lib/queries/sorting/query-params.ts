import { safeParsePageWithDefault } from "lib/routes/home-page-params";
import { ROUTES } from "router/routes";

import type { SortMarketsBy } from "@/sdk/indexer-v2/types/common";

import { toMarketDataSortByHomePage } from "./types";

export const constructURLForHomePage = ({ page, sort }: { page?: number; sort?: SortMarketsBy }) =>
  `${ROUTES.home}/${toMarketDataSortByHomePage(sort)}/${safeParsePageWithDefault(page)}`;
