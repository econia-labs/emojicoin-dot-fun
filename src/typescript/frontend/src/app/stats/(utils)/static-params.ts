import { STATS_MARKETS_PER_PAGE, statsSortByValues } from "app/stats/(utils)/schema";
import { fetchNumRegisteredMarkets } from "lib/queries/num-market";
import getMaxPageNumber from "lib/utils/get-max-page-number";

export async function generateStatsPageStaticParams() {
  const numMarkets = await fetchNumRegisteredMarkets();
  const maxPageNumber = getMaxPageNumber(numMarkets, STATS_MARKETS_PER_PAGE);
  return Array.from({ length: maxPageNumber }).flatMap((_, i) =>
    statsSortByValues.flatMap(
      (sort) =>
        [
          {
            sort,
            page: `${i + 1}`,
            order: "asc",
          } as const,
          {
            sort,
            page: `${i + 1}`,
            order: "desc",
          } as const,
        ]
    )
  );
}
