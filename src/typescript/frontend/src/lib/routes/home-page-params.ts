import { toOrderBy } from "@sdk/indexer-v2/const";
import { Schemas } from "@sdk/utils";
import { type HomePageSearchParams } from "lib/queries/sorting/query-params";
import { toMarketDataSortByHomePage } from "lib/queries/sorting/types";

export interface HomePageParams {
  params?: {};
  searchParams?: HomePageSearchParams;
}

export const safeParsePageWithDefault = (pageInput: unknown): number => {
  const result = Schemas["PositiveInteger"].safeParse(pageInput);
  return result.success ? result.data : 1;
};

export const toHomePageParamsWithDefault = (searchParams: HomePageSearchParams | undefined) => {
  const {
    page: pageInput,
    sort,
    order = "desc",
    bonding: inBondingCurve,
    q: searchBytes,
  } = searchParams ?? {};

  // Ensure the filter is a home-page-only filter.
  const sortBy = toMarketDataSortByHomePage(sort);
  const page = safeParsePageWithDefault(pageInput);
  const orderBy = toOrderBy(order);
  const q = handleEmptySearchBytes(searchBytes);

  return {
    page,
    sortBy,
    orderBy,
    inBondingCurve,
    q,
  };
};

// Converts a bare `0x` and a `null` input to undefined. If it's already undefined, it remains so.
// Otherwise, return the value.
export const handleEmptySearchBytes = (searchBytes?: string | null) => {
  return searchBytes === "0x" ? undefined : (searchBytes ?? undefined);
};
