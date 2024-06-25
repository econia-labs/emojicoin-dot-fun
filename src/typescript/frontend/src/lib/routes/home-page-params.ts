import { toOrderBy } from "@sdk/queries/const";
import { type HomePageSearchParams } from "lib/queries/sorting/query-params";
import { MarketDataSortBy, toPostgrestQueryParam } from "lib/queries/sorting/types";

export interface HomePageParams {
  params?: {};
  searchParams?: HomePageSearchParams;
}

export const safeParsePage = (pageInput: string | undefined | null): number => {
  try {
    return parseInt(pageInput ?? "1");
  } catch (e) {
    return 1;
  }
};

export const toHomePageParamsWithDefault = (searchParams: HomePageSearchParams | undefined) => {
  const {
    page: pageInput,
    sort = MarketDataSortBy.MarketCap,
    order = "desc",
    bonding: inBondingCurve = null,
  } = searchParams ?? {};

  const sortBy = toPostgrestQueryParam(sort);
  const page = safeParsePage(pageInput);
  const orderBy = toOrderBy(order);

  return {
    page,
    sortBy,
    orderBy,
    inBondingCurve,
  };
};
