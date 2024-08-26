import { toOrderBy } from "@sdk/queries/const";
import { type HomePageSearchParams } from "lib/queries/sorting/query-params";
import { toMarketDataSortByHomePage } from "lib/queries/sorting/types";

export interface HomePageParams {
  params?: {};
  searchParams?: HomePageSearchParams;
}

export const safeParsePage = (pageInput: string | undefined | null): number => {
  try {
    return Math.max(parseInt(pageInput ?? "1"), 1);
  } catch (e) {
    return 1;
  }
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
  const page = safeParsePage(pageInput);
  const orderBy = toOrderBy(order);
  const q = searchBytes === "0x" ? undefined : searchBytes;

  return {
    page,
    sortBy,
    orderBy,
    inBondingCurve,
    q,
  };
};
