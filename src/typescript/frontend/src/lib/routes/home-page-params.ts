import type { HomePageSearchParams } from "lib/queries/sorting/query-params";
import { toMarketDataSortByHomePage } from "lib/queries/sorting/types";

import { Schemas } from "@/sdk/utils";

export interface HomePageParams {
  params: {
    sort: string,
    page: string,
  };
}

export const safeParsePageWithDefault = (pageInput: unknown): number => {
  const result = Schemas["PositiveInteger"].safeParse(pageInput);
  return result.success ? result.data : 1;
};

export const toHomePageParamsWithDefault = (searchParams: HomePageSearchParams | undefined) => {
  const { page: pageInput, sort } = searchParams ?? {};

  // Ensure the filter is a home-page-only filter.
  const sortBy = toMarketDataSortByHomePage(sort);
  const page = safeParsePageWithDefault(pageInput);

  return {
    page,
    sortBy,
  };
};
