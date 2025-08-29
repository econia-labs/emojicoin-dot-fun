import { fetchNumRegisteredMarkets } from "lib/queries/num-market";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { GENERATE_ALL_STATIC_PAGES } from "lib/server-env";
import getMaxPageNumber from "lib/utils/get-max-page-number";

import { SortMarketsBy } from "@/sdk/index";

const generateForOnePageNumber = (page: number) =>
  [
    { sort: SortMarketsBy.BumpOrder, page: `${page}` },
    { sort: SortMarketsBy.AllTimeVolume, page: `${page}` },
    { sort: SortMarketsBy.DailyVolume, page: `${page}` },
    { sort: SortMarketsBy.MarketCap, page: `${page}` },
  ] as const;

export async function generateHomePageStaticParams() {
  if (GENERATE_ALL_STATIC_PAGES) {
    const numMarkets = await fetchNumRegisteredMarkets();
    const maxPageNumber = getMaxPageNumber(numMarkets, MARKETS_PER_PAGE);
    return Array.from({ length: maxPageNumber }).flatMap((_, i) => generateForOnePageNumber(i + 1));
  } else {
    // Just generate the first page for each sort type.
    return generateForOnePageNumber(1).flat();
  }
}
