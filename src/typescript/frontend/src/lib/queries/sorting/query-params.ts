import { type OrderByStrings } from "@sdk/queries/const";
import { toMarketDataSortByHomePage, type SortByPageQueryParams } from "./types";
import { safeParsePageWithDefault } from "lib/routes/home-page-params";
import { SortMarketsBy } from "@sdk/indexer-v2/types/common";

export type HomePageSearchParams = {
  page: string | undefined;
  sort: SortByPageQueryParams | undefined;
  order: OrderByStrings | undefined;
  bonding: boolean | undefined;
  q: string | undefined;
};

export const DefaultHomePageSearchParams: HomePageSearchParams = {
  page: "1",
  sort: "market_cap",
  order: "desc",
  bonding: undefined,
  q: undefined,
};

export const AllHomePageSearchParams = Object.keys(DefaultHomePageSearchParams) as Array<
  keyof HomePageSearchParams
>;

export const constructHomePageSearchParams = (searchParams: URLSearchParams) => {
  const res = {} as HomePageSearchParams;
  AllHomePageSearchParams.forEach((key) => {
    const value = searchParams.get(key);
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    res[key] = value ?? (DefaultHomePageSearchParams[key] as any);
  });
  return res;
};

export const constructURLForHomePage = ({
  page,
  sort,
  searchBytes,
}: {
  page?: number;
  sort?: SortMarketsBy;
  searchBytes?: string;
}) => {
  const newURL = new URL(location.href);
  newURL.searchParams.delete("page");
  newURL.searchParams.delete("sort");
  newURL.searchParams.delete("q");

  const safePage = safeParsePageWithDefault((page ?? 1).toString());
  if (safePage !== 1) {
    newURL.searchParams.set("page", safePage.toString());
  }
  if (searchBytes && searchBytes !== "0x") {
    newURL.searchParams.set("q", searchBytes);
  }
  const newSort = toMarketDataSortByHomePage(sort);
  if (newSort !== SortMarketsBy.MarketCap) {
    newURL.searchParams.set("sort", newSort);
  }

  return newURL;
};

/**
 * Check all the current and next url parameters using their default fallback values to see if the URL has
 * actually changed.
 */
export const isHomePageURLDifferent = (curr: URLSearchParams, next: URLSearchParams) => {
  if ((curr.get("page") ?? "1") !== (next.get("page") ?? "1")) {
    return true;
  }
  if (
    (curr.get("sort") ?? SortMarketsBy.MarketCap) !== (next.get("sort") ?? SortMarketsBy.MarketCap)
  ) {
    return true;
  }
  if ((curr.get("q") ?? "0x") !== (next.get("q") ?? "0x")) {
    return true;
  }
  return false;
};
