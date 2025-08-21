import { fetchNumRegisteredMarkets } from "lib/queries/num-market";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import type { MarketDataSortByHomePage } from "lib/queries/sorting/types";
import getMaxPageNumber from "lib/utils/get-max-page-number";

import { SortMarketsBy } from "@/sdk/index";

export async function generateHomePageStaticParams() {
  const numMarkets = await fetchNumRegisteredMarkets();
  const maxPageNumber = getMaxPageNumber(numMarkets, MARKETS_PER_PAGE);
  return Array.from({ length: maxPageNumber }).flatMap((_, i) => {
    const slugs: { sort: MarketDataSortByHomePage; page: string }[] = [
      { sort: SortMarketsBy.BumpOrder, page: `${i + 1}` },
      { sort: SortMarketsBy.AllTimeVolume, page: `${i + 1}` },
      { sort: SortMarketsBy.DailyVolume, page: `${i + 1}` },
      { sort: SortMarketsBy.MarketCap, page: `${i + 1}` },
    ];

    return slugs.map(({ sort, page }) => ({ sort, page: page.toString() }));
  });
}
