import { STATS_MARKETS_PER_PAGE, statsSortByValues } from "app/stats/(utils)/schema";
import { fetchNumRegisteredMarkets } from "lib/queries/num-market";
import { GENERATE_ALL_STATIC_PAGES } from "lib/server-env";
import getMaxPageNumber from "lib/utils/get-max-page-number";

const generateForOnePageNumber = (page: number) =>
  statsSortByValues.flatMap((sort) => [
    {
      sort,
      page: `${page}`,
      order: "asc",
    } as const,
    {
      sort,
      page: `${page}`,
      order: "desc",
    } as const,
  ]);

export async function generateStatsPageStaticParams() {
  if (GENERATE_ALL_STATIC_PAGES) {
    const numMarkets = await fetchNumRegisteredMarkets();
    const maxPageNumber = getMaxPageNumber(numMarkets, STATS_MARKETS_PER_PAGE);
    return Array.from({ length: maxPageNumber }).flatMap((_, i) => generateForOnePageNumber(i + 1));
  } else {
    // Just generate the first page for each sort type, for both asc/desc order.
    return generateForOnePageNumber(1);
  }
}
