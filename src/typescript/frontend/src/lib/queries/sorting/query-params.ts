import type { OrderByStrings } from "@sdk/indexer-v2/const";
import { DEFAULT_SORT_BY, type SortMarketsBy } from "@sdk/indexer-v2/types/common";
import { safeParsePageWithDefault } from "lib/routes/home-page-params";

import { type SortByPageQueryParams, toMarketDataSortByHomePage } from "./types";

export type HomePageSearchParams = {
  page: string | undefined;
  sort: SortByPageQueryParams | undefined;
  order: OrderByStrings | undefined;
  bonding: boolean | undefined;
  q: string | undefined;
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

  const safePage = safeParsePageWithDefault(page);
  if (safePage !== 1) {
    newURL.searchParams.set("page", safePage.toString());
  }
  if (searchBytes && searchBytes !== "0x") {
    newURL.searchParams.set("q", searchBytes);
  }
  const newSort = toMarketDataSortByHomePage(sort);
  if (newSort !== DEFAULT_SORT_BY) {
    newURL.searchParams.set("sort", newSort);
  }

  return newURL;
};
