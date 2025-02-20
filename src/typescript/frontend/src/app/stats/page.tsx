import {
  fetchCachedFirstTenPagesOfPriceDeltas,
  fetchCachedMarketStates,
} from "../../components/pages/stats/cached-fetches";
import { headers } from "next/headers";
import {
  type StatsPageSearchParams,
  statsSearchParamsToColumn,
  toStatsPageParamsWithDefault,
} from "../../components/pages/stats/params";
import { toTableRowData } from "../../components/pages/stats/types";
import { TableHeaders } from "../../components/pages/stats/HeaderRow";
import { MarketTableRow, type TableRowData } from "../../components/pages/stats/MarketTableRow";
import { calculateCirculatingSupply, calculateCurvePrice } from "@sdk/markets";
import { getEmojiFontFromUserAgent } from "lib/hooks/use-emoji-font-family";
import { cn } from "lib/utils/class-name";
import { StatsButtonsBlock } from "components/pages/stats/StatsButtonsBlock";
import { fetchCachedNumMarketsFromAptosNode } from "lib/queries/num-market";

export interface MarketStatsPageParams {
  params?: {};
  searchParams?: {
    page: StatsPageSearchParams["page"];
    sort: StatsPageSearchParams["sort"];
    order: StatsPageSearchParams["order"];
  };
}

const MARKETS_PER_PAGE = 100;

export default async function MarketStatsPage({ searchParams }: MarketStatsPageParams) {
  const { page, sortBy, orderBy } = toStatsPageParamsWithDefault(searchParams);

  const priceDeltas = await fetchCachedFirstTenPagesOfPriceDeltas();

  // If sorting by price delta, there's no need to fetch the total number of markets, since the number of markets with
  // daily activity will always be less than or equal to the total.
  const numMarkets =
    sortBy === "delta"
      ? Object.keys(priceDeltas).length
      : await fetchCachedNumMarketsFromAptosNode();
  const numPages = Math.ceil(numMarkets / MARKETS_PER_PAGE);

  const userAgent = headers().get("user-agent") || "";
  const { emojiFontClassName } = getEmojiFontFromUserAgent(userAgent);

  const marketRowData = await fetchCachedMarketStates({ page, sortBy, orderBy })
    .then((jsonRows) => jsonRows.map(toTableRowData))
    .then((rows) =>
      rows.map<Omit<TableRowData, "sort">>((row) => ({
        ...row,
        priceDelta: priceDeltas[row.symbol] ?? undefined,
        clammVirtualReservesQuote: row.clammVirtualReserves.quote,
        circulatingSupply: calculateCirculatingSupply(row),
        currentCurvePrice: calculateCurvePrice(row).toNumber(),
        emojiFontClassName,
      }))
    );

  const baseUrl = headers().get("host");
  const sort = statsSearchParamsToColumn(sortBy);

  return (
    <>
      <StatsButtonsBlock numPages={numPages} page={page} sort={sort} desc={!orderBy.ascending} />
      {/* Padding top 14px to make the distance between the top & bottom nav buttons symmetrical, due to scrollbar. */}
      <div className="flex max-w-[80vw] m-auto overflow-auto mt-4 mb-4 shadow-[0_0_0_1px_var(--dark-gray)]">
        <table className={cn("[&_th]:px-4 [&_th]:py-2 m-auto", "border-collapse")}>
          <TableHeaders
            emojiFontClassName={emojiFontClassName}
            sort={sort}
            desc={orderBy.ascending !== true}
            baseUrl={baseUrl}
          />
          <tbody
            className={cn(
              "[&_tr]:text-lighter-gray [&_tr]:text-sm [&_tr]:font-forma [&_tr]:p-3 [&_tr]:hover:ec-blue",
              "[&_tr]:bg-opacity-5",
              "[&_td]:px-4 [&_td]:py-2 [&_td]:border-solid",
              "[&_td]:border-[1px] [&_td]:border-dark-gray [&_td:first-child]:border-l-transparent"
            )}
          >
            {marketRowData.map((row) => (
              <MarketTableRow key={`${row.symbol}-${sortBy}`} sort={sort} {...row} />
            ))}
          </tbody>
        </table>
      </div>
      <StatsButtonsBlock numPages={numPages} page={page} sort={sort} desc={!orderBy.ascending} />
    </>
  );
}
